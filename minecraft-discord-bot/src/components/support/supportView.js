const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

function createSupportPanel(isOpen = false) {
    const container =
        new ContainerBuilder()
            .setAccentColor(
                isOpen
                    ? 0x57F287
                    : 0xED4245
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        [
                            '# 🎧 ApfelSMP Support',

                            '',

                            isOpen
                                ? '🟢 **Der Support ist aktuell geöffnet.**'
                                : '🔴 **Der Support ist aktuell geschlossen.**',

                            '',

                            isOpen
                                ? 'Supporter können sich jetzt in einen Support-Call setzen und Spieler aus dem Warteraum übernehmen.'
                                : 'Der Support-Warteraum ist aktuell geschlossen.',

                            '',

                            '### 📋 Ablauf',

                            '1. Ein Supporter öffnet den Support.',
                            '2. Der Bot wartet im Support-Warteraum.',
                            '3. Spieler können dem Warteraum beitreten.',
                            '4. Das Support-Team erhält einen neuen Support-Fall.',
                            '5. Ein Supporter übernimmt den Spieler.'
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
                                'support_open'
                            )
                            .setLabel(
                                'Support öffnen'
                            )
                            .setEmoji('🟢')
                            .setStyle(
                                ButtonStyle.Success
                            )
                            .setDisabled(isOpen),

                        new ButtonBuilder()
                            .setCustomId(
                                'support_close'
                            )
                            .setLabel(
                                'Support schließen'
                            )
                            .setEmoji('🔴')
                            .setStyle(
                                ButtonStyle.Danger
                            )
                            .setDisabled(!isOpen)
                    )
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        isOpen
                            ? '-# Support ist geöffnet.'
                            : '-# Nur Supporter können den Support öffnen.'
                    )
            );

    return container;
}

module.exports = {
    createSupportPanel
};