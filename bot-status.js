const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require('discord.js');

const createBotStatusView = require(
    '../components/botStatus/statusView'
);

const {
    saveMessage,
    loadStatusMessage,
    updateStatusMessage,
    startStatusUpdater
} = require(
    '../components/botStatus/statusManager'
);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bot-status')
        .setDescription(
            'Zeigt den aktuellen Status des Bots an.'
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        ),

    async execute(interaction, client) {

        /*
         * Administrator überprüfen
         */

        if (
            !interaction.memberPermissions?.has(
                PermissionFlagsBits.Administrator
            )
        ) {
            return interaction.reply({
                content:
                    '❌ Du benötigst Administrator-Rechte.',
                ephemeral: true
            });
        }

        /*
         * Prüfen, ob bereits eine Status-Nachricht
         * gespeichert wurde.
         */

        const existingStatus =
            loadStatusMessage();

        if (existingStatus) {

            try {
                const channel =
                    await client.channels.fetch(
                        existingStatus.channelId
                    );

                const message =
                    await channel.messages.fetch(
                        existingStatus.messageId
                    );

                /*
                 * Bereits vorhandene Nachricht
                 * aktualisieren.
                 */

                await message.edit({
                    components: [
                        createBotStatusView(client)
                    ],
                    flags:
                        MessageFlags.IsComponentsV2
                });

                /*
                 * Interaction bestätigen.
                 */

                await interaction.reply({
                    content:
                        '✅ Die bestehende Bot-Status-Nachricht wurde aktualisiert.',
                    ephemeral: true
                });

                startStatusUpdater(client);

                return;

            } catch (error) {

                console.warn(
                    '[BOT STATUS] Gespeicherte Nachricht nicht mehr verfügbar.'
                );

            }
        }

        /*
         * Neue Status-Nachricht erstellen.
         */

        await interaction.reply({
            components: [
                createBotStatusView(client)
            ],
            flags:
                MessageFlags.IsComponentsV2
        });

        /*
         * Tatsächlich erstellte Nachricht holen.
         */

        const statusMessage =
            await interaction.fetchReply();

        /*
         * Nachricht speichern.
         */

        saveMessage(statusMessage);

        /*
         * Automatische Aktualisierung starten.
         */

        startStatusUpdater(client);
    }
};