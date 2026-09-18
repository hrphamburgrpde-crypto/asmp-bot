const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    ChannelType
} = require('discord.js');


/*
 * =========================================================
 * KONFIGURATION
 * =========================================================
 *
 * In .env:
 *
 * DISCORDSRV_CONSOLE_CHANNEL_ID=DEINE_CHANNEL_ID
 *
 * Das ist die ID des Discord-Channels, den DiscordSRV
 * als Minecraft-Console-Channel verwendet.
 *
 * Beispiel:
 *
 * DISCORDSRV_CONSOLE_CHANNEL_ID=123456789012345678
 *
 * WICHTIG:
 * Dieser Channel muss für den Bot beschreibbar sein.
 *
 * =========================================================
 */


function getConsoleChannelId() {

    return process.env.DISCORDSRV_CONSOLE_CHANNEL_ID;

}


/*
 * =========================================================
 * MINECRAFT COMMAND ÜBER DISCORDSRV
 * =========================================================
 */

async function sendMinecraftCommand(
    interaction,
    command
) {

    const channelId =
        getConsoleChannelId();


    if (!channelId) {

        throw new Error(
            'DISCORDSRV_CONSOLE_CHANNEL_ID fehlt in der .env.'
        );

    }


    const channel =
        await interaction.client.channels.fetch(
            channelId
        );


    if (!channel) {

        throw new Error(
            'Der DiscordSRV-Console-Channel wurde nicht gefunden.'
        );

    }


    if (
        channel.type !==
        ChannelType.GuildText
    ) {

        throw new Error(
            'Der DiscordSRV-Console-Channel ist kein Textkanal.'
        );

    }


    /*
     * Minecraft-Befehl in den DiscordSRV-Console-Channel
     * senden.
     *
     * DiscordSRV übernimmt anschließend die Ausführung
     * auf dem Minecraft-Server.
     */

    await channel.send({
        content: command,
        allowedMentions: {
            parse: []
        }
    });


    return true;

}


/*
 * =========================================================
 * BROADCAST COMMAND
 * =========================================================
 */

module.exports = {

    data:

        new SlashCommandBuilder()

            .setName(
                'broadcast'
            )

            .setDescription(
                'Sendet eine Nachricht an alle Minecraft-Spieler.'
            )

            .addStringOption(
                option =>

                    option

                        .setName(
                            'nachricht'
                        )

                        .setDescription(
                            'Die Broadcast-Nachricht'
                        )

                        .setRequired(
                            true
                        )

                        .setMaxLength(
                            200
                        )

            )

            .setDefaultMemberPermissions(
                PermissionFlagsBits.Administrator
            ),


    /*
     * =====================================================
     * EXECUTE
     * =====================================================
     */

    async execute(
        interaction
    ) {

        const message =
            interaction.options.getString(
                'nachricht',
                true
            );


        /*
         * Interaction sofort bestätigen.
         */

        await interaction.deferReply({

            flags:
                MessageFlags.Ephemeral

        });


        try {


            /*
             * =================================================
             * MINECRAFT BROADCAST
             * =================================================
             *
             * Wir verwenden "broadcast".
             *
             * DiscordSRV führt diesen Befehl auf der
             * Minecraft-Console aus.
             */

            const command =
                `broadcast ${message}`;


            await sendMinecraftCommand(

                interaction,

                command

            );


            console.log(
                `[BROADCAST] Gesendet: ${message}`
            );


            /*
             * =================================================
             * DISCORD ANTWORT
             * =================================================
             */

            await interaction.editReply({

                content:

                    [

                        '✅ **Broadcast erfolgreich gesendet.**',

                        '',

                        `📢 **${message}**`,

                        '',

                        '🎮 Der Minecraft-Server hat den Broadcast erhalten.'

                    ].join('\n')

            });


        } catch (
            error
        ) {


            console.error(
                '[BROADCAST ERROR]',
                error
            );


            /*
             * =================================================
             * FEHLER
             * =================================================
             */

            await interaction.editReply({

                content:

                    [

                        '❌ **Broadcast konnte nicht gesendet werden.**',

                        '',

                        `Fehler: ${error.message}`

                    ].join('\n')

            });

        }

    }

};