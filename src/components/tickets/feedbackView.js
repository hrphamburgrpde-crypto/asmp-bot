const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

function createFeedbackView(
    ticketId,
    ticketName,
    claimedBy = null,
    disabled = false
) {
    const claimedText =
        claimedBy
            ? `👤 **Übernommen von:** ${claimedBy}`
            : '👤 **Übernommen von:** Niemand';

    return new ContainerBuilder()
        .setAccentColor(
            disabled
                ? 0x808080
                : 0xFEE75C
        )

        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    [
                        '# ⭐ Ticket-Bewertung',
                        '',
                        'Dein Ticket wurde geschlossen.',
                        '',
                        `🎫 **Ticket:** ${ticketName}`,
                        claimedText,
                        '',
                        disabled
                            ? '✅ **Du hast dieses Ticket bereits bewertet.**'
                            : 'Wie zufrieden warst du mit dem Support?',
                        '',
                        disabled
                            ? 'Vielen Dank für dein Feedback! ❤️'
                            : 'Wähle unten eine Bewertung von **1 bis 5 Sternen**.'
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

        .addActionRowComponents(
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(
                            `feedback_star_1_${ticketId}`
                        )
                        .setLabel('1')
                        .setEmoji('⭐')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(disabled),

                    new ButtonBuilder()
                        .setCustomId(
                            `feedback_star_2_${ticketId}`
                        )
                        .setLabel('2')
                        .setEmoji('⭐')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(disabled),

                    new ButtonBuilder()
                        .setCustomId(
                            `feedback_star_3_${ticketId}`
                        )
                        .setLabel('3')
                        .setEmoji('⭐')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(disabled),

                    new ButtonBuilder()
                        .setCustomId(
                            `feedback_star_4_${ticketId}`
                        )
                        .setLabel('4')
                        .setEmoji('⭐')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(disabled),

                    new ButtonBuilder()
                        .setCustomId(
                            `feedback_star_5_${ticketId}`
                        )
                        .setLabel('5')
                        .setEmoji('⭐')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(disabled)
                )
        )

        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    disabled
                        ? '-# Diese Bewertung kann nicht erneut abgegeben werden.'
                        : '-# Du kannst pro Ticket nur eine Bewertung abgeben.'
                )
        );
}

module.exports = createFeedbackView;