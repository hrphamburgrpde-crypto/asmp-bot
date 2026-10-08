const {
    SlashCommandBuilder,
    MessageFlags
} = require('discord.js');

const {
    isSupporter
} = require('../components/support/supportManager');

const {
    createSupportPanel
} = require('../components/support/supportView');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('support-panel')
        .setDescription(
            'Erstellt das Support-Team-Panel.'
        ),

    async execute(interaction) {

        if (
            !isSupporter(
                interaction.member
            )
        ) {
            return interaction.reply({
                content:
                    '❌ Nur das Support-Team kann das Support-Panel erstellen.',

                flags:
                    MessageFlags.Ephemeral
            });
        }

        await interaction.channel.send({
            components: [
                createSupportPanel(
                    false
                )
            ],

            flags:
                MessageFlags.IsComponentsV2
        });

        await interaction.reply({
            content:
                '✅ Support-Team-Panel wurde erstellt.',

            flags:
                MessageFlags.Ephemeral
        });
    }
};