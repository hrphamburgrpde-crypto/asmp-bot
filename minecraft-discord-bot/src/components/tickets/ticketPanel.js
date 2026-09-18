const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

function createTicketPanel() {
    return new ContainerBuilder()
        .setAccentColor(0x5865F2)

        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    [
                        '# 🎫 Support',
                        '',
                        'Brauchst du Hilfe oder hast du ein Anliegen?',
                        'Erstelle über einen der Buttons unten ein Ticket.',
                        '',
                        'Bitte erstelle nur ein Ticket, wenn du tatsächlich Hilfe benötigst.'
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

        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    [
                        '### 📂 Ticket auswählen',
                        '',
                        '🎫 **Support**',
                        'Allgemeine Fragen und Hilfe',
                        '',
                        '🛠️ **Technischer Support**',
                        'Probleme mit Minecraft oder dem Server',
                        '',
                        '🚨 **Spieler melden**',
                        'Meldung eines Spielers oder Regelverstoßes'
                    ].join('\n')
                )
        )

        .addActionRowComponents(
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket_support')
                        .setLabel('Support')
                        .setEmoji('🎫')
                        .setStyle(ButtonStyle.Primary),

                    new ButtonBuilder()
                        .setCustomId('ticket_technical')
                        .setLabel('Technischer Support')
                        .setEmoji('🛠️')
                        .setStyle(ButtonStyle.Secondary),

                    new ButtonBuilder()
                        .setCustomId('ticket_report')
                        .setLabel('Spieler melden')
                        .setEmoji('🚨')
                        .setStyle(ButtonStyle.Danger)
                )
        )

        .addSeparatorComponents(
            new SeparatorBuilder()
                .setSpacing(
                    SeparatorSpacingSize.Small
                )
                .setDivider(true)
        )

        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    '-# Das Support-Team wird sich schnellstmöglich um dein Anliegen kümmern.'
                )
        );
}

module.exports = createTicketPanel;