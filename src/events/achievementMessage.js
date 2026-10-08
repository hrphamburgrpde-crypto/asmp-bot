const {
    Events,
    EmbedBuilder,
    AttachmentBuilder
} = require('discord.js');

const path =
    require('path');


const {
    addMessage
} = require('../utils/achievements');


/*
 * ==========================================
 * ACHIEVEMENT-BILD
 * ==========================================
 */

const ACHIEVEMENT_DIRECTORY =
    path.join(
        process.cwd(),
        'assets',
        'achievements'
    );


/*
 * ==========================================
 * DATUM
 * ==========================================
 */

function formatDate(
    isoDate
) {

    return new Date(
        isoDate
    ).toLocaleString(
        'de-DE',
        {
            dateStyle: 'short',
            timeStyle: 'short'
        }
    );

}


/*
 * ==========================================
 * DM SENDEN
 * ==========================================
 */

async function sendAchievementDM(
    user,
    achievement,
    unlockedAt
) {

    try {

        const imagePath =
            path.join(
                ACHIEVEMENT_DIRECTORY,
                achievement.image
            );


        const attachment =
            new AttachmentBuilder(
                imagePath,
                {
                    name:
                        achievement.image
                }
            );


        const embed =
            new EmbedBuilder()

                .setColor(
                    0xF1C40F
                )

                .setTitle(
                    '🏆 NEUES ACHIEVEMENT!'
                )

                .setDescription(
                    [
                        `## ${achievement.name}`,
                        '',
                        '🎉 **Glückwunsch!**',
                        '',
                        achievement.description,
                        '',
                        `📅 **Freigeschaltet:** ${formatDate(unlockedAt)}`
                    ].join('\n')
                )

                .setImage(
                    `attachment://${achievement.image}`
                )

                .setFooter({
                    text:
                        '🍎 ApfelSMP Achievements'
                });


        await user.send({

            embeds: [
                embed
            ],

            files: [
                attachment
            ]

        });


        console.log(
            `[ACHIEVEMENT] DM gesendet: ${user.tag} → ${achievement.name}`
        );


    } catch (error) {

        /*
         * Achievement bleibt trotzdem gespeichert,
         * auch wenn der User DMs deaktiviert hat.
         */

        console.log(
            `[ACHIEVEMENT] DM an ${user.tag} konnte nicht gesendet werden.`
        );

    }

}


/*
 * ==========================================
 * EVENT
 * ==========================================
 */

module.exports = {

    name:
        Events.MessageCreate,


    async execute(
        message
    ) {

        /*
         * DMs ignorieren
         */

        if (
            !message.guild
        ) {

            return;

        }


        /*
         * Bots ignorieren
         */

        if (
            message.author.bot
        ) {

            return;

        }


        /*
         * Webhooks ignorieren
         */

        if (
            message.webhookId
        ) {

            return;

        }


        /*
         * Nachricht zählen
         */

        const result =
            addMessage(
                message.guild.id,
                message.author.id
            );


        /*
         * Keine neuen Achievements
         */

        if (
            !result.newlyUnlocked ||
            result.newlyUnlocked.length === 0
        ) {

            return;

        }


        /*
         * Alle neu freigeschalteten
         * Achievements ausgeben.
         */

        for (
            const unlocked
            of result.newlyUnlocked
        ) {

            console.log(
                `[ACHIEVEMENT] ${message.author.tag} hat "${unlocked.achievement.name}" freigeschaltet.`
            );


            await sendAchievementDM(

                message.author,

                unlocked.achievement,

                unlocked.unlockedAt

            );

        }

    }

};