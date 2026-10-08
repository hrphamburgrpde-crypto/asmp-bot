const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize
} = require('discord.js');

const { getUserWarnings } = require('../utils/warnings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn-list')
        .setDescription('Zeigt alle aktiven Verwarnungen eines Users an.')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('Der User, dessen Verwarnungen angezeigt werden sollen.')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({
                content: '❌ Dieser Command kann nur auf einem Server verwendet werden.',
                flags: MessageFlags.Ephemeral
            });
        }

        const user = interaction.options.getUser('user');

        const warnings = getUserWarnings(
            interaction.guild.id,
            user.id
        );

        const container = new ContainerBuilder()
            .setAccentColor(0xF1C40F);

        if (warnings.length === 0) {
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    [
                        '# ⚠️ Verwarnungen',
                        '',
                        `👤 **User:** ${user}`,
                        '',
                        '✅ Dieser User hat aktuell **keine aktiven Verwarnungen**.'
                    ].join('\n')
                )
            );
        } else {
            const lines = [
                '# ⚠️ Verwarnungen',
                '',
                `👤 **User:** ${user}`,
                `📊 **Aktive Verwarnungen:** ${warnings.length}`,
                ''
            ];

            warnings.forEach((warning, index) => {
                const createdAt = warning.createdAt
                    ? `<t:${Math.floor(new Date(warning.createdAt).getTime() / 1000)}:f>`
                    : 'Unbekannt';

                const expiresAt = warning.expiresAt
                    ? `<t:${Math.floor(new Date(warning.expiresAt).getTime() / 1000)}:f>`
                    : 'Unbekannt';

                lines.push(
                    `## ⚠️ Verwarnung #${warning.id}`,
                    `**Grund:** ${warning.reason || 'Kein Grund angegeben'}`,
                    `**Dauer:** ${warning.duration || 'Unbekannt'}`,
                    `**Vergeben von:** <@${warning.moderatorId}>`,
                    `**Erstellt:** ${createdAt}`,
                    `**Läuft ab:** ${expiresAt}`,
                    ''
                );

                if (index < warnings.length - 1) {
                    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━', '');
                }
            });

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    lines.join('\n')
                )
            );
        }

        container.addSeparatorComponents(
            new SeparatorBuilder()
                .setSpacing(SeparatorSpacingSize.Small)
                .setDivider(true)
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                '🍎 **ApfelSMP Moderation**'
            )
        );

        return interaction.reply({
            components: [container],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
        });
    }
};