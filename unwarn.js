const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder
} = require('discord.js');

const {
    removeWarning
} = require('../utils/warnings');

const {
    sendModerationLog
} = require('../utils/moderationLogger');


// ============================================================
// COMMAND
// ============================================================

module.exports = {

    data: new SlashCommandBuilder()
        .setName('unwarn')
        .setDescription(
            'Entfernt eine bestimmte Verwarnung.'
        )

        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers.toString()
        )

        .addUserOption(option =>
            option
                .setName('user')
                .setDescription(
                    'Der Benutzer, dessen Verwarnung entfernt werden soll.'
                )
                .setRequired(true)
        )

        .addIntegerOption(option =>
            option
                .setName('warnid')
                .setDescription(
                    'Die ID der Verwarnung.'
                )
                .setRequired(true)
                .setMinValue(1)
        ),


    async execute(interaction) {

        const user =
            interaction.options.getUser('user');

        const warningId =
            interaction.options.getInteger('warnid');


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
        // WARNUNG ENTFERNEN
        // ====================================================

        const removedWarning =
            removeWarning(
                interaction.guild.id,
                user.id,
                warningId
            );


        // ====================================================
        // NICHT GEFUNDEN
        // ====================================================

        if (!removedWarning) {

            const container =
                new ContainerBuilder()

                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                            .setContent(
                                '# ❌ Verwarnung nicht gefunden'
                            )
                    )

                    .addSeparatorComponents(
                        new SeparatorBuilder()
                    )

                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                            .setContent(
                                `Für ${user} wurde keine Verwarnung mit der ID **#${warningId}** gefunden.`
                            )
                    );


            return interaction.reply({

                components: [
                    container
                ],

                flags:
                    MessageFlags.IsComponentsV2 |
                    MessageFlags.Ephemeral

            });

        }


        // ====================================================
        // DATUM
        // ====================================================

        const createdDate =
            new Date(
                removedWarning.createdAt
            ).toLocaleString(
                'de-DE',
                {
                    dateStyle: 'short',
                    timeStyle: 'short'
                }
            );


        // ====================================================
        // DM AN USER
        // ====================================================

        const dmContainer =
            new ContainerBuilder()

                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            '# ✅ Verwarnung entfernt'
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
                            `deine Verwarnung **#${warningId}** auf **ApfelSMP** wurde manuell entfernt.`
                        )
                )

                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            `📝 **Ursprünglicher Grund:** ${removedWarning.reason}\n` +
                            `📅 **Verwarnung erstellt:** ${createdDate}\n` +
                            `👮 **Entfernt von:** <@${interaction.user.id}>`
                        )
                )

                .addSeparatorComponents(
                    new SeparatorBuilder()
                )

                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            'Diese Verwarnung ist ab sofort nicht mehr aktiv.'
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
                `[UNWARN] DM an ${user.tag} konnte nicht gesendet werden:`,
                error
            );

        }


        // ====================================================
        // MODERATION LOG
        // ====================================================

        await sendModerationLog(
            interaction.client,
            {
                type: 'UNWARN',

                user: user,

                moderator:
                    interaction.user,

                reason:
                    removedWarning.reason,

                warningId:
                    warningId
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
                            '# ✅ Verwarnung entfernt'
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
                            `**Grund:** ${removedWarning.reason}\n` +
                            `**Entfernt von:** ${interaction.user}`
                        )
                )

                .addSeparatorComponents(
                    new SeparatorBuilder()
                )

                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            dmSent
                                ? '📨 Der Benutzer wurde per DM über die Entfernung informiert.'
                                : '⚠️ Die Verwarnung wurde entfernt, aber die DM konnte nicht zugestellt werden.'
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