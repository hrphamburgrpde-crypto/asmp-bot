const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

function createPriorityPanel(currentPriority = 'medium') {
    const currentLabels = {
        high: '🔴 Hoch',
        medium: '🟡 Mittel',
        low: '🟢 Niedrig'
    };

    const current =
        currentLabels[currentPriority] ||
        currentLabels.medium;

    return new ContainerBuilder()
        .setAccentColor(0x5865F2)

        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    [
                        '# 🎯 Ticket-Priorität',
                        '',
                        `**Aktuelle Priorität:** ${current}`,
                        '',
                        'Wähle die gewünschte Priorität für dieses Ticket.'
                    ].join('\n')
                )
        )

        .addSeparatorComponents(
            new SeparatorBuilder()
                .setSpacing(SeparatorSpacingSize.Small)
                .setDivider(true)
        )

        .addActionRowComponents(
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket_priority_high')
                        .setLabel('Hoch')
                        .setEmoji('🔴')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(
                            currentPriority === 'high'
                        ),

                    new ButtonBuilder()
                        .setCustomId('ticket_priority_medium')
                        .setLabel('Mittel')
                        .setEmoji('🟡')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(
                            currentPriority === 'medium'
                        ),

                    new ButtonBuilder()
                        .setCustomId('ticket_priority_low')
                        .setLabel('Niedrig')
                        .setEmoji('🟢')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(
                            currentPriority === 'low'
                        )
                )
        )

        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    '-# 🔴 Hoch wird vor 🟡 Mittel und 🟢 Niedrig einsortiert.'
                )
        );
}

module.exports = createPriorityPanel;