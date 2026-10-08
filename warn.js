const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder
} = require('discord.js');

const {
    addWarning,
    getNextWarningId
} = require('../utils/warnings');

const {
    sendModerationLog
} = require('../utils/moderationLogger');


// ============================================================
// DAUER PARSEN
// ============================================================

function parseDuration(input) {
    if (!input) {
        return null;
    }

    const match = input
        .toLowerCase()
        .trim()
        .match(/^(\d+)\s*(s|m|h|d|w)$/);

    if (!match) {
        return null;
    }

    const amount = Number(match[1]);
    const unit = match[2];

    const multipliers = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
        w: 7 * 24 * 60 * 60 * 1000
    };

    return amount * multipliers[unit];
}


// ============================================================
// DAUER SCHÖN ANZEIGEN
// ============================================================

function formatDuration(input) {
    const match = input
        .toLowerCase()
        .trim()
        .match(/^(\d+)\s*(s|m|h|d|w)$/);

    if (!match) {
        return input;
    }

    const amount = Number(match[1]);

    const names = {
        s: amount === 1 ? 'Sekunde' : 'Sekunden',
        m: amount === 1 ? 'Minute' : 'Minuten',
        h: amount === 1 ? 'Stunde' : 'Stunden',
        d: amount === 1 ? 'Tag' : 'Tagen',
        w: amount === 1 ? 'Woche' : 'Wochen'
    };

    return `${amount} ${names[match[2]]}`;
}


// ============================================================
// COMMAND
// ============================================================

module.exports = {

    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Verwarnt einen Benutzer.')
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers.toString()
        )

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription(
                    'Der Benutzer, der verwarnt werden soll.'
                )
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription(
                    'Grund für die Verwarnung.'
                )
                .setRequired(true)
                .setMaxLength(1000)
        )

        .addStringOption(option =>
            option
                .setName('duration')
                .setDescription(
                    'Dauer, z.B. 30m, 24h, 7d oder 1w.'
                )
                .setRequired(true)
        ),


    async execute(interaction) {

        const user =
            interaction.options.getUser('user');

        const reason =
            interaction.options.getString('reason');

        const durationInput =
            interaction.options.getString('duration');


        // ====================================================
        // SERVER CHECK
        // ====================================================

        if (!interaction.guild) {

            return interaction.reply({
                content:
                    '❌ Dieser Command kann nur auf einem Server verwendet werden.',
                flags: MessageFlags.Ephemeral
            });

        }


        // ====================================================
        // BOT CHECK
        // ====================================================

        if (user.bot) {

            return interaction.reply({
                content:
                    '❌ Bots können nicht verwarnt werden.',
                flags: MessageFlags.Ephemeral
            });

        }


        // ====================================================
        // SELBSTWARNUNG
        // ====================================================

        if (user.id === interaction.user.id) {

            return interaction.reply({
                content:
                    '❌ Du kannst dich nicht selbst verwarnen.',
                flags: MessageFlags.Ephemeral
            });

        }


        // ====================================================
        // DAUER PRÜFEN
        // ====================================================

        const durationMs =
            parseDuration(durationInput);

        if (!durationMs || durationMs <= 0) {

            return interaction.reply({
                content:
                    '❌ Ungültige Dauer.\n\n' +
                    'Beispiele: `30m`, `2h`, `7d`, `1w`',
                flags: MessageFlags.Ephemeral
            });

        }


        // ====================================================
        // USER AUF SERVER PRÜFEN
        // ====================================================

        const member =
            await interaction.guild.members
                .fetch(user.id)
                .catch(() => null);

        if (!member) {

            return interaction.reply({
                content:
                    '❌ Dieser Benutzer ist nicht auf dem Server.',
                flags: MessageFlags.Ephemeral
            });

        }


        // ====================================================
        // WARN-ID
        // ====================================================

        const warningId =
            getNextWarningId(
                interaction.guild.id,
                user.id
            );


        // ====================================================
        // ZEITEN
        // ====================================================

        const createdAt =
            new Date();

        const expiresAt =
            new Date(
                createdAt.getTime() +
                durationMs
            );


        // ====================================================
        // WARNUNG ERSTELLEN
        // ====================================================

        const warning = {

            id: warningId,

            reason: reason,

            moderatorId:
                interaction.user.id,

            createdAt:
                createdAt.toISOString(),

            expiresAt:
                expiresAt.toISOString()

        };


        addWarning(
            interaction.guild.id,
            user.id,
            warning
        );


        // ====================================================
        // DATUM FORMATIEREN
        // ====================================================

        const createdDate =
            createdAt.toLocaleString(
                'de-DE',
                {
                    dateStyle: 'short',
                    timeStyle: 'short'
                }
            );

        const expiresDate =
            expiresAt.toLocaleString(
                'de-DE',
                {
                    dateStyle: 'short',
                    timeStyle: 'short'
                }
            );

        const readableDuration =
            formatDuration(
                durationInput
            );


        // ====================================================
        // DM AN USER
        // ====================================================

        const dmContainer =
            new ContainerBuilder()

                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            '# ⚠️ Du wurdest verwarnt'
                        )
                )

                .addSeparatorComponents(
                    new SeparatorBuilder()
                )

                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            `Hallo **${user.username}**,`
                        )
                )

                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            'du wurdest auf **ApfelSMP** verwarnt.'
                        )
                )

                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            `⚠️ **Verwarnung:** #${warningId}\n` +
                            `📝 **Grund:** ${reason}\n` +
                            `⏱️ **Dauer:** ${readableDuration}\n` +
                            `📅 **Erstellt:** ${createdDate}\n` +
                            `⌛ **Läuft ab:** ${expiresDate}\n` +
                            `👮 **Moderator:** <@${interaction.user.id}>`
                        )
                )

                .addSeparatorComponents(
                    new SeparatorBuilder()
                )

                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            `Diese Verwarnung ist deine **${warningId}. Verwarnung**.`
                        )
                )

                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            'Sobald du **2 weitere Verwarnungen** erhältst, kann eine Sperre von **3–7 Tagen** erfolgen.'
                        )
                )

                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            'Wenn du Einspruch gegen diese Verwarnung einlegen möchtest, eröffne bitte ein **Support-Ticket**. Füge deinem Einspruch möglichst relevante Beweise oder Informationen hinzu.'
                        )
                )

                .addSeparatorComponents(
                    new SeparatorBuilder()
                )

                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            `Mit freundlichen Grüßen\n` +
                            `<@${interaction.user.id}>\n` +
                            '🍎 **ApfelSMP Moderation**'
                        )
                );


        // ====================================================
        // DM SENDEN
        // ====================================================

        let dmSent = true;

        try {

            await user.send({
                components: [
                    dmContainer
                ],
                flags:
                    MessageFlags.IsComponentsV2
            });

        } catch (error) {

            dmSent = false;

            console.error(
                `[WARN] DM an ${user.tag} konnte nicht gesendet werden:`,
                error
            );

        }


        // ====================================================
        // MODERATION LOG
        // ====================================================

        await sendModerationLog(
            interaction.client,
            {
                type: 'WARN',

                user: user,

                moderator:
                    interaction.user,

                reason: reason,

                warningId:
                    warningId,

                duration:
                    readableDuration
            }
        );


        // ====================================================
        // BESTÄTIGUNG
        // ====================================================

        const resultContainer =
            new ContainerBuilder()

                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            '# ⚠️ Verwarnung erstellt'
                        )
                )

                .addSeparatorComponents(
                    new SeparatorBuilder()
                )

                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            `**Benutzer:** ${user}\n` +
                            `**Verwarnung:** #${warningId}\n` +
                            `**Grund:** ${reason}\n` +
                            `**Dauer:** ${readableDuration}\n` +
                            `**Läuft ab:** ${expiresDate}`
                        )
                )

                .addSeparatorComponents(
                    new SeparatorBuilder()
                )

                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            dmSent
                                ? '📨 Der Benutzer wurde per DM informiert.'
                                : '⚠️ Die Verwarnung wurde gespeichert, aber die DM konnte nicht zugestellt werden.'
                        )
                );


        await interaction.reply({

            components: [
                resultContainer
            ],

            flags:
                MessageFlags.IsComponentsV2 |
                MessageFlags.Ephemeral

        });

    }

};