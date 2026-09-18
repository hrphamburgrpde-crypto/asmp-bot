const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

function createTicketView(
    user,
    type,
    claimedBy = null,
    closed = false,
    priority = 'medium'
) {
    const ticketNames = {
        support: '🎫 Support',
        technical: '🛠️ Technischer Support',
        report: '🚨 Spieler melden'
    };

    const priorityNames = {
        high: '🔴 Hoch',
        medium: '🟡 Mittel',
        low: '🟢 Niedrig'
    };

    const ticketName =
        ticketNames[type] || '🎫 Support';

    const priorityName =
        priorityNames[priority] ||
        priorityNames.medium;

    const statusText = closed
        ? '🔴 **Geschlossen**'
        : '🟢 **Offen**';

    const claimedText = claimedBy
        ? `👤 **Übernommen von:** ${claimedBy}`
        : '👤 **Noch nicht übernommen**';

    const buttons = [];

    if (!closed) {
        buttons.push(
            new ButtonBuilder()
                .setCustomId('ticket_claim')
                .setLabel(
                    claimedBy
                        ? 'Übernommen'
                        : 'Ticket übernehmen'
                )
                .setEmoji('👤')
                .setStyle(
                    claimedBy
                        ? ButtonStyle.Secondary
                        : ButtonStyle.Primary
                )
                .setDisabled(Boolean(claimedBy))
        );

        buttons.push(
            new ButtonBuilder()
                .setCustomId('ticket_priority')
                .setLabel('Priorität')
                .setEmoji('🎯')
                .setStyle(ButtonStyle.Primary)
        );

        buttons.push(
            new ButtonBuilder()
                .setCustomId('ticket_close')
                .setLabel('Ticket schließen')
                .setEmoji('🔒')
                .setStyle(ButtonStyle.Danger)
        );
    } else {
        buttons.push(
            new ButtonBuilder()
                .setCustomId('ticket_reopen')
                .setLabel('Ticket wieder öffnen')
                .setEmoji('🔓')
                .setStyle(ButtonStyle.Success)
        );

        buttons.push(
            new ButtonBuilder()
                .setCustomId('ticket_delete')
                .setLabel('Ticket löschen')
                .setEmoji('🗑️')
                .setStyle(ButtonStyle.Danger)
        );
    }

    return new ContainerBuilder()
        .setAccentColor(
            closed
                ? 0xED4245
                : 0x57F287
        )

        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    [
                        `# ${ticketName}`,
                        '',
                        `Hallo ${user},`,
                        '',
                        'vielen Dank für deine Anfrage!',
                        'Ein Mitglied des Support-Teams wird sich so schnell wie möglich um dein Anliegen kümmern.',
                        '',
                        `**Status:** ${statusText}`,
                        `**Priorität:** ${priorityName}`,
                        claimedText
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
                    closed
                        ? '🔒 Dieses Ticket wurde geschlossen.'
                        : '💬 Bitte beschreibe dein Anliegen möglichst genau.'
                )
        )

        .addActionRowComponents(
            new ActionRowBuilder()
                .addComponents(buttons)
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
                    '-# Bitte vermeide es, mehrere Tickets für dasselbe Anliegen zu erstellen.'
                )
        );
}

module.exports = createTicketView;