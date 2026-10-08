const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder
} = require('discord.js');

const {
    sendModerationLog
} = require('../utils/moderationLogger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Entbannt einen Benutzer vom Discord-Server.')
        .setDefaultMemberPermissions(
            PermissionFlagsBits.BanMembers.toString()
        )
        .addStringOption(option =>
            option
                .setName('userid')
                .setDescription('Die Discord-ID des gebannten Benutzers.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Grund für den Unban.')
                .setRequired(true)
                .setMaxLength(1000)
        ),

    async execute(interaction) {
        const userId =
            interaction.options.getString('userid');

        const reason =
            interaction.options.getString('reason');

        if (!interaction.guild) {
            return interaction.reply({
                content:
                    '❌ Dieser Command kann nur auf einem Server verwendet werden.',
                flags: MessageFlags.Ephemeral
            });
        }

        if (!/^\d{17,20}$/.test(userId)) {
            return interaction.reply({
                content:
                    '❌ Ungültige Discord User-ID.',
                flags: MessageFlags.Ephemeral
            });
        }

        let user;

        try {
            user =
                await interaction.client.users.fetch(
                    userId
                );
        } catch {
            return interaction.reply({
                content:
                    '❌ Dieser Discord-Benutzer konnte nicht gefunden werden.',
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            await interaction.guild.members.unban(
                userId,
                reason
            );

            await sendModerationLog(
                interaction.client,
                {
                    type: 'UNBAN',
                    user,
                    moderator: interaction.user,
                    reason
                }
            );

            const container =
                new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                            .setContent(
                                '# 🔓 Benutzer entbannt'
                            )
                    )
                    .addSeparatorComponents(
                        new SeparatorBuilder()
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                            .setContent(
                                `**Benutzer:** ${user}\n` +
                                `**Grund:** ${reason}\n` +
                                `**Moderator:** ${interaction.user}`
                            )
                    );

            await interaction.reply({
                components: [container],
                flags:
                    MessageFlags.IsComponentsV2 |
                    MessageFlags.Ephemeral
            });

        } catch (error) {
            console.error(
                '[UNBAN] Fehler:',
                error
            );

            await interaction.reply({
                content:
                    '❌ Der Benutzer konnte nicht entbannt werden. Überprüfe, ob er aktuell gebannt ist und ob der Bot die nötigen Berechtigungen besitzt.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
};