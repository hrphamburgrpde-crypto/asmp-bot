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
        .setName('ban')
        .setDescription('Bannt einen Benutzer vom Discord-Server.')
        .setDefaultMemberPermissions(
            PermissionFlagsBits.BanMembers.toString()
        )
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Der Benutzer, der gebannt werden soll.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('Grund für den Ban.')
                .setRequired(true)
                .setMaxLength(1000)
        ),

    async execute(interaction) {
        const user =
            interaction.options.getUser('user');

        const reason =
            interaction.options.getString('reason');

        if (!interaction.guild) {
            return interaction.reply({
                content:
                    '❌ Dieser Command kann nur auf einem Server verwendet werden.',
                flags: MessageFlags.Ephemeral
            });
        }

        if (user.id === interaction.user.id) {
            return interaction.reply({
                content:
                    '❌ Du kannst dich nicht selbst bannen.',
                flags: MessageFlags.Ephemeral
            });
        }

        const member =
            await interaction.guild.members
                .fetch(user.id)
                .catch(() => null);

        if (member) {
            if (
                member.roles.highest.position >=
                interaction.member.roles.highest.position
            ) {
                return interaction.reply({
                    content:
                        '❌ Du kannst diesen Benutzer aufgrund seiner Rollenposition nicht bannen.',
                    flags: MessageFlags.Ephemeral
                });
            }
        }

        try {
            await interaction.guild.members.ban(
                user.id,
                {
                    reason
                }
            );

            await sendModerationLog(
                interaction.client,
                {
                    type: 'BAN',
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
                                '# 🔨 Benutzer gebannt'
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
                '[BAN] Fehler:',
                error
            );

            await interaction.reply({
                content:
                    '❌ Der Benutzer konnte nicht gebannt werden.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
};