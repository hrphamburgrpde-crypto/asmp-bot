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

const UPDATE_INTERVAL =
    60 * 1000;


// ============================================================
// DATEI FÜR DIE GESPEICHERTE STATUS-NACHRICHT
// ============================================================

const dataDirectory =
    path.join(
        __dirname,
        '../../../data'
    );

const stateFile =
    path.join(
        dataDirectory,
        'server-status.json'
    );


// ============================================================
// DATEI SICHERSTELLEN
// ============================================================

function ensureDataDirectory() {

    if (!fs.existsSync(dataDirectory)) {

        fs.mkdirSync(
            dataDirectory,
            {
                recursive: true
            }
        );

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

        return JSON.parse(
            fs.readFileSync(
                stateFile,
                'utf8'
            )
        );

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
        )

    );

}


// ============================================================
// MINECRAFT STATUS ABFRAGEN
// ============================================================

async function getMinecraftStatus() {

    try {

        const result =
            await status(

                SERVER_HOST,

                SERVER_PORT,

                {

                    timeout:
                        5000

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

            version:
                'Unbekannt',

            ping: null

        };

    }

}


// ============================================================
// COMPONENTS V2
// ============================================================

function createServerStatusComponents(
    server
) {

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

        '━━━━━━━━━━━━━━━━━━━━',

        '🔄 Aktualisierung alle **60 Sekunden**'

    ].join('\n');


    container
        .addTextDisplayComponents(

            new TextDisplayBuilder()
                .setContent(text)

        );


    container
        .addSeparatorComponents(

            new SeparatorBuilder()
                .setSpacing(
                    SeparatorSpacingSize.Small
                )
                .setDivider(true)

        );


    container
        .addTextDisplayComponents(

            new TextDisplayBuilder()
                .setContent(
                    '🍎 **ApfelSMP** • Minecraft Server'
                )

        );


    return {

        components: [

            container

        ],

        flags:
            MessageFlags.IsComponentsV2

    };

}


// ============================================================
// GESPEICHERTE NACHRICHT AKTUALISIEREN
// ============================================================

async function updateServerStatusMessage(
    client
) {

    const state =
        loadState();


    if (
        !state.guildId ||
        !state.channelId ||
        !state.messageId
    ) {

        return;

    }


    try {

        const guild =
            await client.guilds.fetch(
                state.guildId
            );


        if (!guild) {

            return;

        }


        const channel =
            await guild.channels.fetch(
                state.channelId
            );


        if (
            !channel ||
            !channel.isTextBased()
        ) {

            return;

        }


        const message =
            await channel.messages.fetch(
                state.messageId
            );


        if (!message) {

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

    }

}


// ============================================================
// AUTOMATISCHE AKTUALISIERUNG
// ============================================================

let updaterStarted = false;


function startServerStatusUpdater(
    client
) {

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


    // Direkt nach dem Start aktualisieren
    update();


    // Danach alle 60 Sekunden
    setInterval(

        update,

        UPDATE_INTERVAL

    );

}


// ============================================================
// COMMAND
// ============================================================

module.exports = {

    data:

        new SlashCommandBuilder()

            .setName(
                'server-status'
            )

            .setDescription(
                'Sendet den aktuellen Minecraft-Serverstatus.'
            ),


    async execute(
        interaction
    ) {

        try {

            // Slash-Command kurz bestätigen,
            // damit Discord die Interaction nicht ablaufen lässt.
            await interaction.deferReply({

                flags:
                    MessageFlags.Ephemeral

            });


            const server =
                await getMinecraftStatus();


            const message =
                await interaction.channel.send(

                    createServerStatusComponents(
                        server
                    )

                );


            saveState({

                guildId:
                    interaction.guildId,

                channelId:
                    interaction.channelId,

                messageId:
                    message.id

            });


            await interaction.deleteReply();


            console.log(

                `[SERVER STATUS] Status-Nachricht erstellt: ${message.id}`

            );


        } catch (error) {

            console.error(
                '[SERVER STATUS ERROR]',
                error
            );


            try {

                await interaction.editReply({

                    content:
                        '❌ Die Server-Status-Nachricht konnte nicht erstellt werden.'

                });

            } catch {}

        }

    },


    startServerStatusUpdater

};