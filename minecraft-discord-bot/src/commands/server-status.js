const {
    SlashCommandBuilder,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize
} = require('discord.js');

const minecraftServerUtil = require('minecraft-server-util');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'server-status.json');

const UPDATE_INTERVAL = 60 * 1000;

let updaterStarted = false;

function ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, {
            recursive: true
        });
    }
}

function loadStatusData() {
    ensureDataDirectory();

    if (!fs.existsSync(DATA_FILE)) {
        return {};
    }

    try {
        const raw = fs.readFileSync(
            DATA_FILE,
            'utf8'
        );

        return JSON.parse(raw);
    } catch (error) {
        console.error(
            '[SERVER STATUS] server-status.json konnte nicht gelesen werden:',
            error
        );

        return {};
    }
}

function saveStatusData(data) {
    ensureDataDirectory();

    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(data, null, 4),
        'utf8'
    );
}

function getServerHost() {
    return (
        process.env.MINECRAFT_SERVER_HOST ||
        'mc.apfelsmp.de'
    );
}

function getServerPort() {
    return Number(
        process.env.MINECRAFT_SERVER_PORT ||
        25565
    );
}

async function getMinecraftStatus() {
    const host = getServerHost();
    const port = getServerPort();

    try {
        const status = await minecraftServerUtil.status(
            host,
            port,
            {
                timeout: 5000
            }
        );

        return {
            online: true,
            players: status.players?.online ?? 0,
            maxPlayers: status.players?.max ?? 0,
            latency: status.roundTripLatency ?? 0,
            version:
                status.version?.name ||
                'Unbekannt'
        };

    } catch (error) {
        return {
            online: false,
            players: 0,
            maxPlayers: 0,
            latency: 0,
            version: 'Offline'
        };
    }
}

async function createServerStatusContainer() {
    const status = await getMinecraftStatus();

    const host = getServerHost();
    const port = getServerPort();

    const onlineText = status.online
        ? '🟢 **Online**'
        : '🔴 **Offline**';

    const playerText = status.online
        ? `👥 **Spieler:** ${status.players}/${status.maxPlayers}`
        : '👥 **Spieler:** —';

    const pingText = status.online
        ? `📡 **Ping:** ${status.latency} ms`
        : '📡 **Ping:** —';

    const versionText = status.online
        ? `🧱 **Version:** ${status.version}`
        : '🧱 **Version:** —';

    return new ContainerBuilder()
        .setAccentColor(
            status.online
                ? 0x57F287
                : 0xED4245
        )

        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    [
                        '# 🍎 APFEL SMP — SERVER STATUS',
                        '',
                        onlineText,
                        '',
                        `🌐 **IP:** \`${host}:${port}\``,
                        '',
                        playerText,
                        pingText,
                        versionText,
                        '',
                        '🔄 **Automatische Aktualisierung:** alle 60 Sekunden'
                    ].join('\n')
                )
        )

        .addSeparatorComponents(
            new SeparatorBuilder()
                .setSpacing(
                    SeparatorSpacingSize.Small
                )
                .setDivider(true)
        )

        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    status.online
                        ? '✅ Der Minecraft-Server ist erreichbar.'
                        : '⚠️ Der Minecraft-Server ist aktuell nicht erreichbar.'
                )
        );
}

async function updateServerStatusMessage(
    client,
    guildId,
    channelId,
    messageId
) {
    try {
        const guild = await client.guilds.fetch(
            guildId
        );

        if (!guild) {
            return false;
        }

        const channel = await guild.channels.fetch(
            channelId
        );

        if (!channel || !channel.isTextBased()) {
            console.error(
                '[SERVER STATUS] Channel ist ungültig:',
                channelId
            );

            return false;
        }

        const message = await channel.messages.fetch(
            messageId
        );

        if (!message) {
            return false;
        }

        const container =
            await createServerStatusContainer();

        await message.edit({
            components: [container]
        });

        console.log(
            `[SERVER STATUS] Aktualisiert: ${guild.name} -> #${channel.name}`
        );

        return true;

    } catch (error) {
        console.error(
            '[SERVER STATUS] Aktualisierung fehlgeschlagen:',
            error
        );

        return false;
    }
}

async function updateAllServerStatusMessages(client) {
    const data = loadStatusData();

    const entries = Object.entries(data);

    if (entries.length === 0) {
        return;
    }

    for (const [
        guildId,
        config
    ] of entries) {

        if (
            !config ||
            !config.channelId ||
            !config.messageId
        ) {
            continue;
        }

        const success =
            await updateServerStatusMessage(
                client,
                guildId,
                config.channelId,
                config.messageId
            );

        if (!success) {
            console.log(
                `[SERVER STATUS] Gespeicherte Nachricht nicht mehr erreichbar: ${guildId}`
            );
        }
    }
}

function startServerStatusUpdater(client) {
    if (updaterStarted) {
        return;
    }

    updaterStarted = true;

    console.log(
        '[SERVER STATUS] Automatische Aktualisierung gestartet.'
    );

    // Sofort einmal aktualisieren
    setTimeout(() => {
        updateAllServerStatusMessages(client)
            .catch(error => {
                console.error(
                    '[SERVER STATUS] Initiales Update fehlgeschlagen:',
                    error
                );
            });
    }, 5000);

    // Danach alle 60 Sekunden
    setInterval(() => {

        updateAllServerStatusMessages(client)
            .catch(error => {
                console.error(
                    '[SERVER STATUS] Automatisches Update fehlgeschlagen:',
                    error
                );
            });

    }, UPDATE_INTERVAL);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server-status')
        .setDescription(
            'Zeigt den aktuellen Minecraft Server Status an.'
        ),

    async execute(interaction) {

        try {
            await interaction.deferReply({
                flags: MessageFlags.Ephemeral
            });

            const container =
                await createServerStatusContainer();

            const message =
                await interaction.channel.send({
                    components: [container],
                    flags: MessageFlags.IsComponentsV2
                });

            const data = loadStatusData();

            data[interaction.guildId] = {
                channelId: interaction.channelId,
                messageId: message.id
            };

            saveStatusData(data);

            await interaction.deleteReply();

            console.log(
                `[SERVER STATUS] Neue Status-Nachricht erstellt: ${message.id}`
            );

        } catch (error) {

            console.error(
                '[SERVER STATUS] Fehler:',
                error
            );

            try {
                if (interaction.deferred) {
                    await interaction.editReply({
                        content:
                            '❌ Der Server-Status konnte nicht erstellt werden.'
                    });
                } else {
                    await interaction.reply({
                        content:
                            '❌ Der Server-Status konnte nicht erstellt werden.',
                        flags: MessageFlags.Ephemeral
                    });
                }
            } catch {}
        }
    },

    startServerStatusUpdater
};
