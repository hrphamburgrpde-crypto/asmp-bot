const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} = require('discord.js');

function createFeedbackModal(
    stars,
    ticketId
) {
    const modal =
        new ModalBuilder()
            .setCustomId(
                `feedback_modal_${stars}_${ticketId}`
            )
            .setTitle(
                `${stars}/5 Sterne - Feedback`
            );

    const comment =
        new TextInputBuilder()
            .setCustomId(
                'feedback_comment'
            )
            .setLabel(
                'Kommentar (optional)'
            )
            .setPlaceholder(
                'Wie war dein Support-Erlebnis?'
            )
            .setStyle(
                TextInputStyle.Paragraph
            )
            .setRequired(false)
            .setMaxLength(1000);

    const row =
        new ActionRowBuilder()
            .addComponents(
                comment
            );

    modal.addComponents(row);

    return modal;
}

module.exports = createFeedbackModal;