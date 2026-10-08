const {
    SlashCommandBuilder,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize
} = require('discord.js');

const {
    status
} = require('minecraft-server-util');

const fs = require('fs');
const path = require('path');

// ============================================================
// KONFIGURATION
// ============================================================

const SERVER_HOST =
    process.env.MINECRAFT_SERVER_HOST ||
    'mc.apfelsmp.de';

const SERVER_PORT =
    Number(
        process.env.MINECRAFT_SERVER_PORT ||
        25565
    );

const UPDATE_INTERVAL = 60 * 1000;

// ============================================================
// DATEI FÜR GESPEICHERTE STATUS-NACHRICHT
// ============================================================

const dataDirectory = path.join(
    process.cwd(),
    'data'
);

const stateFile = path.join(
    dataDirectory,
    'server-status.json'
);

// ============================================================
// DATEI SICHERSTELLEN
// ============================================================

function ensureDataDirectory() {
    if (!fs.existsSync(dataDirectory)) {
        fs.mkdirSync(dataDirectory, {
            recursive: true
        });
    }
}

// ============================================================
// STATUS-DATEN LADEN
// ============================================================

function loadState() {
    ensureDataDirectory();

    if (!fs.existsSync(stateFile)) {
        return {
            guildId: null,
            channelId: null,
            messageId: null
        };
    }

    try {
        const content = fs.readFileSync(
            stateFile,
            'utf8'
        );

        if (!content.trim()) {
            return {
                guildId: null,
                channelId: null,
                messageId: null
            };
        }

        return JSON.parse(content);
    } catch (error) {
        console.error(
            '[SERVER STATUS] Status-Datei konnte nicht gelesen werden:',
            error
        );

        return {
            guildId: null,
            channelId: null,
            messageId: null
        };
    }
}

// ============================================================
// STATUS-DATEN SPEICHERN
// ============================================================

function saveState(state) {
    ensureDataDirectory();

    fs.writeFileSync(
        stateFile,
        JSON.stringify(
            state,
            null,
            4
        ),
        'utf8'
    );
}

// ============================================================
// STATUS-DATEN ZURÜCKSETZEN
// ============================================================

function resetState() {
    saveState({
        guildId: null,
        channelId: null,
        messageId: null
    });
}

// ============================================================
// MINECRAFT STATUS ABFRAGEN
// ============================================================

async function getMinecraftStatus() {
    try {
        const result = await status(
            SERVER_HOST,
            SERVER_PORT,
            {
                timeout: 5000
            }
        );

        return {
            online: true,

            players:
                result.players?.online ?? 0,

            maxPlayers:
                result.players?.max ?? 0,

            version:
                result.version?.name ||
                'Unbekannt',

            ping:
                result.roundTripLatency ?? 0
        };
    } catch (error) {
        return {
            online: false,

            players: 0,

            maxPlayers: 0,

            version: 'Unbekannt',

            ping: null
        };
    }
}

// ============================================================
// COMPONENTS V2
// ============================================================

function createServerStatusComponents(server) {
    const container =
        new ContainerBuilder()
            .setAccentColor(
                server.online
                    ? 0x57F287
                    : 0xED4245
            );

    const statusText =
        server.online
            ? '🟢 **Online**'
            : '🔴 **Offline**';

    const playerText =
        server.online
            ? `👥 **Spieler:** ${server.players} / ${server.maxPlayers}`
            : '👥 **Spieler:** —';

    const versionText =
        server.online
            ? `🧱 **Version:** ${server.version}`
            : '🧱 **Version:** —';

    const pingText =
        server.online
            ? `📶 **Ping:** ${server.ping} ms`
            : '📶 **Ping:** —';

    const text = [
        '# 🍎 APFELSMP SERVER',
        '',
        statusText,
        '',
        playerText,
        versionText,
        pingText,
        '',
        `🌐 **IP:** \`${SERVER_HOST}\``,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '🔄 Aktualisierung alle **60 Sekunden**'
    ].join('\n');

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(text)
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
            .setSpacing(
                SeparatorSpacingSize.Small
            )
            .setDivider(true)
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(
                '🍎 **ApfelSMP** • Minecraft Server'
            )
    );

    return {
        components: [
            container
        ],
        flags: MessageFlags.IsComponentsV2
    };
}

// ============================================================
// NEUE STATUS-NACHRICHT ERSTELLEN
// ============================================================

async function createNewServerStatusMessage(client) {
    try {
        const guilds = client.guilds.cache;

        if (guilds.size === 0) {
            console.error(
                '[SERVER STATUS] Keine Discord-Server gefunden.'
            );

            return false;
        }

        let state = loadState();

        // Wenn bereits ein Guild-/Channel-Ziel vorhanden ist,
        // versuchen wir diesen zuerst zu verwenden.
        let guild = null;
        let channel = null;

        if (state.guildId && state.channelId) {
            guild = await client.guilds.fetch(
                state.guildId
            ).catch(() => null);

            if (guild) {
                channel = await guild.channels.fetch(
                    state.channelId
                ).catch(() => null);
            }
        }

        // Falls das alte Ziel nicht mehr existiert,
        // verwenden wir den ersten Server und suchen dort
        // einen passenden Textkanal.
        if (!guild) {
            guild = guilds.first();
        }

        if (!guild) {
            console.error(
                '[SERVER STATUS] Keine Guild verfügbar.'
            );

            return false;
        }

        if (!channel || !channel.isTextBased()) {
            channel = guild.channels.cache.find(
                ch =>
                    ch.isTextBased() &&
                    ch.permissionsFor(
                        client.user
                    )?.has([
                        'ViewChannel',
                        'SendMessages'
                    ])
            );
        }

        if (!channel) {
            console.error(
                '[SERVER STATUS] Kein geeigneter Textkanal gefunden.'
            );

            return false;
        }

        const server =
            await getMinecraftStatus();

        const message =
            await channel.send(
                createServerStatusComponents(
                    server
                )
            );

        saveState({
            guildId: guild.id,
            channelId: channel.id,
            messageId: message.id
        });

        console.log(
            `[SERVER STATUS] Neue Status-Nachricht erstellt: ${message.id}`
        );

        return true;

    } catch (error) {
        console.error(
            '[SERVER STATUS] Neue Status-Nachricht konnte nicht erstellt werden:',
            error
        );

        return false;
    }
}

// ============================================================
// GESPEICHERTE NACHRICHT AKTUALISIEREN
// ============================================================

async function updateServerStatusMessage(client) {
    const state = loadState();

    // Keine gespeicherte Nachricht vorhanden
    if (
        !state.guildId ||
        !state.channelId ||
        !state.messageId
    ) {
        console.log(
            '[SERVER STATUS] Keine gespeicherte Nachricht gefunden. Erstelle eine neue.'
        );

        await createNewServerStatusMessage(
            client
        );

        return;
    }

    try {
        const guild =
            await client.guilds.fetch(
                state.guildId
            ).catch(() => null);

        // Guild existiert nicht mehr
        if (!guild) {
            console.log(
                '[SERVER STATUS] Gespeicherter Server nicht gefunden. Erstelle neuen Status.'
            );

            resetState();

            await createNewServerStatusMessage(
                client
            );

            return;
        }

        const channel =
            await guild.channels.fetch(
                state.channelId
            ).catch(() => null);

        // Channel existiert nicht mehr
        if (
            !channel ||
            !channel.isTextBased()
        ) {
            console.log(
                '[SERVER STATUS] Gespeicherter Channel nicht gefunden. Erstelle neuen Status.'
            );

            resetState();

            await createNewServerStatusMessage(
                client
            );

            return;
        }

        // Nachricht abrufen
        const message =
            await channel.messages.fetch(
                state.messageId
            ).catch(() => null);

        // Nachricht wurde gelöscht
        if (!message) {
            console.log(
                '[SERVER STATUS] Alte Status-Nachricht nicht gefunden. Erstelle automatisch eine neue.'
            );

            resetState();

            await createNewServerStatusMessage(
                client
            );

            return;
        }

        const server =
            await getMinecraftStatus();

        await message.edit(
            createServerStatusComponents(
                server
            )
        );

        console.log(
            server.online
                ? `[SERVER STATUS] Aktualisiert: ${server.players}/${server.maxPlayers} Spieler`
                : '[SERVER STATUS] Server offline'
        );

    } catch (error) {
        console.error(
            '[SERVER STATUS] Aktualisierung fehlgeschlagen:',
            error
        );

        // Falls Discord "Unknown Message" zurückgibt,
        // setzen wir den gespeicherten Status zurück.
        if (
            error?.code === 10008 ||
            error?.rawError?.code === 10008
        ) {
            console.log(
                '[SERVER STATUS] Nachricht existiert nicht mehr. Erstelle beim nächsten Durchlauf eine neue.'
            );

            resetState();
        }
    }
}

// ============================================================
// SLASH COMMAND
// ============================================================

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server-status')
        .setDescription(
            'Zeigt den aktuellen Minecraft-Serverstatus an.'
        ),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({
                content:
                    '❌ Dieser Command kann nur auf einem Server verwendet werden.',
                flags: MessageFlags.Ephemeral
            });
        }

        const server =
            await getMinecraftStatus();

        const message =
            await interaction.channel.send(
                createServerStatusComponents(
                    server
                )
            );

        saveState({
            guildId: interaction.guild.id,
            channelId: interaction.channel.id,
            messageId: message.id
        });

        await interaction.reply({
            content:
                '✅ Die permanente Server-Status-Nachricht wurde erstellt.',
            flags: MessageFlags.Ephemeral
        });
    }
};

// ============================================================
// AUTOMATISCHE AKTUALISIERUNG
// ============================================================

let updaterStarted = false;

function startServerStatusUpdater(client) {
    if (updaterStarted) {
        return;
    }

    updaterStarted = true;

    console.log(
        '[SERVER STATUS] Automatische Aktualisierung gestartet.'
    );

    const update = async () => {
        await updateServerStatusMessage(
            client
        );
    };

    // Kurz nach dem Login aktualisieren
    setTimeout(
        update,
        2000
    );

    // Danach alle 60 Sekunden
    setInterval(
        update,
        UPDATE_INTERVAL
    );
}

module.exports.startServerStatusUpdater =
    startServerStatusUpdater;