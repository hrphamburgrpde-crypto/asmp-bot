const {
    SlashCommandBuilder,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');


const {
    getAllAchievements,
    getUserAchievements
} = require('../utils/achievements');


/*
 * ==========================================
 * DATUM FORMATIEREN
 * ==========================================
 */

function formatDate(
    isoDate
) {

    if (!isoDate) {
        return 'Unbekannt';
    }


    const date =
        new Date(
            isoDate
        );


    return date.toLocaleString(
        'de-DE',
        {
            dateStyle: 'short',
            timeStyle: 'short'
        }
    );

}


/*
 * ==========================================
 * SEITE ERSTELLEN
 * ==========================================
 */

function createAchievementPage(
    interaction,
    page
) {

    const achievements =
        getAllAchievements();


    const userAchievements =
        getUserAchievements(
            interaction.guild.id,
            interaction.user.id
        );


    /*
     * 4 Achievements pro Seite
     */

    const perPage = 4;


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                achievements.length /
                perPage
            )
        );


    page =
        Math.max(
            0,
            Math.min(
                page,
                totalPages - 1
            )
        );


    const start =
        page *
        perPage;


    const currentAchievements =
        achievements.slice(
            start,
            start + perPage
        );


    const unlockedCount =
        Object.keys(
            userAchievements
        ).length;


    const totalCount =
        achievements.length;


    const container =
        new ContainerBuilder()
            .setAccentColor(
                0xF1C40F
            );


    /*
     * ==========================================
     * HEADER
     * ==========================================
     */

    container.addTextDisplayComponents(

        new TextDisplayBuilder()
            .setContent(
                [
                    '# 🏆 APFELSMP ACHIEVEMENTS',
                    '',
                    `👤 **${interaction.user.username}**`,
                    '',
                    `🏆 **${unlockedCount} / ${totalCount} Achievements freigeschaltet**`
                ].join('\n')
            )

    );


    container.addSeparatorComponents(

        new SeparatorBuilder()
            .setSpacing(
                SeparatorSpacingSize.Small
            )
            .setDivider(true)

    );


    /*
     * ==========================================
     * ACHIEVEMENTS
     * ==========================================
     */

    for (
        const achievement
        of currentAchievements
    ) {

        const unlocked =
            Boolean(
                userAchievements[
                    achievement.id
                ]
            );


        /*
         * --------------------------------------
         * FREIGESCHALTET
         * --------------------------------------
         */

        if (unlocked) {

            const unlockedAt =
                userAchievements[
                    achievement.id
                ].unlockedAt;


            container.addTextDisplayComponents(

                new TextDisplayBuilder()
                    .setContent(
                        [
                            `## 🏆 ${achievement.name}`,
                            '',
                            achievement.description,
                            '',
                            `✅ **Freigeschaltet**`,
                            `📅 ${formatDate(unlockedAt)}`
                        ].join('\n')
                    )

            );

        }


        /*
         * --------------------------------------
         * NICHT FREIGESCHALTET
         * --------------------------------------
         *
         * Name und Beschreibung werden NICHT
         * angezeigt.
         *
         * Das Achievement bleibt geheim.
         */

        else {

            container.addTextDisplayComponents(

                new TextDisplayBuilder()
                    .setContent(
                        [
                            '## 🔒 ████████████████████',
                            '',
                            '🔒 **Geheimes Achievement**',
                            '',
                            '❔ Noch nicht freigeschaltet'
                        ].join('\n')
                    )

            );

        }


        container.addSeparatorComponents(

            new SeparatorBuilder()
                .setSpacing(
                    SeparatorSpacingSize.Small
                )
                .setDivider(true)

        );

    }


    /*
     * ==========================================
     * SEITENINFO
     * ==========================================
     */

    container.addTextDisplayComponents(

        new TextDisplayBuilder()
            .setContent(
                `📖 **Seite ${page + 1} / ${totalPages}**`
            )

    );


    /*
     * ==========================================
     * BUTTONS
     * ==========================================
     */

    const previousButton =
        new ButtonBuilder()
            .setCustomId(
                `achievements_prev_${interaction.user.id}_${page}`
            )
            .setLabel(
                '◀️'
            )
            .setStyle(
                ButtonStyle.Secondary
            )
            .setDisabled(
                page === 0
            );


    const nextButton =
        new ButtonBuilder()
            .setCustomId(
                `achievements_next_${interaction.user.id}_${page}`
            )
            .setLabel(
                '▶️'
            )
            .setStyle(
                ButtonStyle.Secondary
            )
            .setDisabled(
                page >= totalPages - 1
            );


    const buttons =
        new ActionRowBuilder()
            .addComponents(
                previousButton,
                nextButton
            );


    return {
        container,
        buttons,
        page
    };

}


/*
 * ==========================================
 * COMMAND
 * ==========================================
 */

module.exports = {

    data:
        new SlashCommandBuilder()
            .setName(
                'achievements'
            )
            .setDescription(
                'Zeigt deine persönlichen Achievements an.'
            ),


    async execute(
        interaction
    ) {

        if (
            !interaction.guild
        ) {

            return interaction.reply({
                content:
                    '❌ Dieser Command kann nur auf einem Server verwendet werden.',
                flags:
                    MessageFlags.Ephemeral
            });

        }


        const result =
            createAchievementPage(
                interaction,
                0
            );


        await interaction.reply({

            components: [
                result.container,
                result.buttons
            ],

            flags:
                MessageFlags.Ephemeral |
                MessageFlags.IsComponentsV2

        });


        /*
         * ==========================================
         * BUTTON COLLECTOR
         * ==========================================
         */

        const message =
            await interaction.fetchReply();


        const collector =
            message.createMessageComponentCollector({
                time:
                    10 * 60 * 1000
            });


        collector.on(
            'collect',
            async buttonInteraction => {

                /*
                 * Nur der User, der den Command
                 * ausgeführt hat, darf die Buttons
                 * benutzen.
                 */

                if (
                    buttonInteraction.user.id !==
                    interaction.user.id
                ) {

                    await buttonInteraction.reply({

                        content:
                            '❌ Dieses Achievement-Menü gehört jemand anderem.',

                        flags:
                            MessageFlags.Ephemeral

                    });

                    return;

                }


                const parts =
                    buttonInteraction.customId.split(
                        '_'
                    );


                const direction =
                    parts[1];


                const currentPage =
                    Number(
                        parts[3]
                    );


                let newPage =
                    currentPage;


                if (
                    direction === 'prev'
                ) {

                    newPage--;

                }


                if (
                    direction === 'next'
                ) {

                    newPage++;

                }


                const newResult =
                    createAchievementPage(
                        interaction,
                        newPage
                    );


                await buttonInteraction.update({

                    components: [
                        newResult.container,
                        newResult.buttons
                    ],

                    flags:
                        MessageFlags.IsComponentsV2

                });

            }
        );

    }

};