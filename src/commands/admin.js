const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize
} = require('discord.js');

const {
    startXpEvent,
    stopXpEvent,
    getEventStatus
} = require('../utils/levelEvent');

const {
    sendLevelEventMessage
} = require('../utils/levelEventChecker');

function formatRemaining(
    expiresAt
) {
    if (!expiresAt) {
        return 'Unbekannt';
    }

    const remaining =
        Math.max(
            0,
            Number(expiresAt) -
                Date.now()
        );

    const totalMinutes =
        Math.ceil(
            remaining /
                60000
        );

    const hours =
        Math.floor(
            totalMinutes / 60
        );

    const minutes =
        totalMinutes % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
}

module.exports = {
    data:
        new SlashCommandBuilder()
            .setName('admin')
            .setDescription(
                'Administrative Funktionen.'
            )
            .setDefaultMemberPermissions(
                PermissionFlagsBits.Administrator
            )

            .addSubcommandGroup(
                group =>
                    group
                        .setName('level')
                        .setDescription(
                            'Level-System verwalten.'
                        )

                        .addSubcommand(
                            subcommand =>
                                subcommand
                                    .setName('event')
                                    .setDescription(
                                        'XP-Event verwalten.'
                                    )

                                    .addStringOption(
                                        option =>
                                            option
                                                .setName(
                                                    'aktion'
                                                )
                                                .setDescription(
                                                    'Aktion auswählen.'
                                                )
                                                .setRequired(
                                                    true
                                                )
                                                .addChoices(
                                                    {
                                                        name: '⚡ Event starten',
                                                        value: 'start'
                                                    },
                                                    {
                                                        name: '🛑 Event stoppen',
                                                        value: 'stop'
                                                    },
                                                    {
                                                        name: '📊 Status anzeigen',
                                                        value: 'status'
                                                    }
                                                )
                                    )

                                    .addIntegerOption(
                                        option =>
                                            option
                                                .setName(
                                                    'dauer'
                                                )
                                                .setDescription(
                                                    'Event-Dauer in Minuten.'
                                                )
                                                .setMinValue(
                                                    1
                                                )
                                                .setMaxValue(
                                                    10080
                                                )
                                                .setRequired(
                                                    false
                                                )
                                    )

                                    .addIntegerOption(
                                        option =>
                                            option
                                                .setName(
                                                    'multiplikator'
                                                )
                                                .setDescription(
                                                    'XP-Multiplikator, z.B. 2, 3 oder 5.'
                                                )
                                                .setMinValue(
                                                    2
                                                )
                                                .setMaxValue(
                                                    10
                                                )
                                                .setRequired(
                                                    false
                                                )
                                    )
                        )
            ),

    async execute(
        interaction,
        client
    ) {
        if (
            !interaction.member.permissions.has(
                PermissionFlagsBits.Administrator
            )
        ) {
            return interaction.reply({
                content:
                    '❌ Du benötigst Administrator-Rechte.',
                flags:
                    MessageFlags.Ephemeral
            });
        }

        const aktion =
            interaction.options.getString(
                'aktion'
            );

        const dauer =
            interaction.options.getInteger(
                'dauer'
            );

        const multiplikator =
            interaction.options.getInteger(
                'multiplikator'
            );

        /*
         * ==============================
         * START
         * ==============================
         */

        if (
            aktion === 'start'
        ) {
            if (!dauer) {
                return interaction.reply({
                    content:
                        '❌ Bitte gib eine Dauer in Minuten an.',
                    flags:
                        MessageFlags.Ephemeral
                });
            }

            if (!multiplikator) {
                return interaction.reply({
                    content:
                        '❌ Bitte gib einen XP-Multiplikator an.',
                    flags:
                        MessageFlags.Ephemeral
                });
            }

            /*
             * Prüfen, ob bereits
             * ein Event läuft.
             */
            const currentEvent =
                getEventStatus();

            if (
                currentEvent.active &&
                currentEvent.expiresAt &&
                Date.now() <
                    Number(
                        currentEvent.expiresAt
                    )
            ) {
                return interaction.reply({
                    content:
                        `❌ Es läuft bereits ein **${currentEvent.multiplier}× XP-Event** für weitere **${formatRemaining(currentEvent.expiresAt)}**.`,
                    flags:
                        MessageFlags.Ephemeral
                });
            }

            const event =
                startXpEvent(
                    dauer,
                    multiplikator
                );

            const container =
                new ContainerBuilder()
                    .setAccentColor(
                        0x2ECC71
                    );

            container.addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        [
                            '# ⚡ XP-EVENT GESTARTET',
                            '',
                            `🚀 **${multiplikator}× XP** wurde aktiviert!`,
                            '',
                            `⏱️ Dauer: **${dauer} Minuten**`,
                            `🕐 Ende: <t:${Math.floor(event.expiresAt / 1000)}:F>`,
                            `⏳ Restzeit: <t:${Math.floor(event.expiresAt / 1000)}:R>`,
                            '',
                            '💬 Nachrichten geben mehr XP.',
                            '🎙️ Voice gibt mehr XP.',
                            '',
                            `👮 Aktiviert von: ${interaction.user}`
                        ].join('\n')
                    )
            );

            await interaction.reply({
                components: [
                    container
                ],
                flags:
                    MessageFlags.Ephemeral |
                    MessageFlags.IsComponentsV2
            });

            /*
             * Öffentliche Information
             * im Level-Kanal.
             */
            await sendLevelEventMessage(
                client,
                [
                    '# ⚡ XP-EVENT GESTARTET',
                    '',
                    `🚀 **${multiplikator}× XP** ist jetzt aktiv!`,
                    '',
                    `⏱️ Dauer: **${dauer} Minuten**`,
                    `🕐 Ende: <t:${Math.floor(event.expiresAt / 1000)}:F>`,
                    '',
                    '💬 **Nachrichten:**',
                    `> ${multiplikator}× XP`,
                    '',
                    '🎙️ **Voice:**',
                    `> ${multiplikator}× XP`,
                    '',
                    `👮 Aktiviert von: ${interaction.user}`
                ].join('\n'),
                0x2ECC71
            );

            console.log(
                `[LEVEL EVENT] ${multiplikator}x XP gestartet für ${dauer} Minuten von ${interaction.user.tag}.`
            );

            return;
        }

        /*
         * ==============================
         * STOP
         * ==============================
         */

        if (
            aktion === 'stop'
        ) {
            const currentEvent =
                getEventStatus();

            if (
                !currentEvent.active
            ) {
                return interaction.reply({
                    content:
                        '❌ Aktuell läuft kein XP-Event.',
                    flags:
                        MessageFlags.Ephemeral
                });
            }

            const oldMultiplier =
                Number(
                    currentEvent.multiplier ||
                        1
                );

            stopXpEvent();

            const container =
                new ContainerBuilder()
                    .setAccentColor(
                        0xE74C3C
                    );

            container.addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        [
                            '# 🛑 XP-EVENT GESTOPPT',
                            '',
                            `Das **${oldMultiplier}× XP-Event** wurde beendet.`,
                            '',
                            '📊 Das Level-System läuft wieder mit **1× XP**.'
                        ].join('\n')
                    )
            );

            await interaction.reply({
                components: [
                    container
                ],
                flags:
                    MessageFlags.Ephemeral |
                    MessageFlags.IsComponentsV2
            });

            await sendLevelEventMessage(
                client,
                [
                    '# 🛑 XP-EVENT BEENDET',
                    '',
                    `Das **${oldMultiplier}× XP-Event** wurde von ${interaction.user} beendet.`,
                    '',
                    '📊 Ab jetzt gilt wieder **1× XP**.'
                ].join('\n'),
                0xE74C3C
            );

            console.log(
                `[LEVEL EVENT] ${oldMultiplier}x XP manuell gestoppt von ${interaction.user.tag}.`
            );

            return;
        }

        /*
         * ==============================
         * STATUS
         * ==============================
         */

        if (
            aktion === 'status'
        ) {
            const event =
                getEventStatus();

            const active =
                event.active &&
                event.expiresAt &&
                Date.now() <
                    Number(
                        event.expiresAt
                    );

            const container =
                new ContainerBuilder()
                    .setAccentColor(
                        active
                            ? 0x2ECC71
                            : 0x95A5A6
                    );

            container.addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        [
                            '# ⚡ LEVEL-EVENT STATUS',
                            '',
                            `📊 Status: **${active ? 'AKTIV' : 'INAKTIV'}**`,
                            `✨ Multiplikator: **${active ? `${event.multiplier}×` : '1×'}**`,
                            active
                                ? `⏱️ Restzeit: **${formatRemaining(event.expiresAt)}**`
                                : '⏱️ Kein aktives XP-Event.',
                            active
                                ? `🕐 Ende: <t:${Math.floor(Number(event.expiresAt) / 1000)}:F>`
                                : ''
                        ].filter(Boolean).join('\n')
                    )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder()
                    .setSpacing(
                        SeparatorSpacingSize.Small
                    )
                    .setDivider(true)
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        '🍎 **ApfelSMP Level-System**'
                    )
            );

            return interaction.reply({
                components: [
                    container
                ],
                flags:
                    MessageFlags.Ephemeral |
                    MessageFlags.IsComponentsV2
            });
        }
    }
};