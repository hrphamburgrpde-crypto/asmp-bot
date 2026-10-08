const {
    Events
} = require('discord.js');

const {
    add67,
    unlockSpecial,
    CHEESY_MICHAEL_ID
} = require('../utils/achievements');

const {
    handleNewAchievements
} = require('../utils/achievementDM');

module.exports = {
    name: Events.MessageCreate,

    async execute(message) {
        if (message.author.bot) {
            return;
        }

        if (!message.guild) {
            return;
        }

        const content =
            message.content.trim();

        const newlyUnlocked = [];

        /* =========================================
           NACHTEULE
           00:00:00 - 00:00:59
        ========================================= */

        const now =
            new Date();

        /*
         * Discord-Zeit ist UTC.
         * Deutschland ist im Oktober UTC+2.
         * Daher wird auf die lokale deutsche Zeit
         * umgerechnet.
         */
        const germanTime =
            new Date(
                now.toLocaleString(
                    'en-US',
                    {
                        timeZone:
                            'Europe/Berlin'
                    }
                )
            );

        if (
            germanTime.getHours() === 0 &&
            germanTime.getMinutes() === 0
        ) {
            const unlocked =
                unlockSpecial(
                    message.guild.id,
                    message.author.id,
                    'night_owl'
                );

            if (unlocked) {
                newlyUnlocked.push(
                    unlocked
                );
            }
        }

        /* =========================================
           67 GOAT
        ========================================= */

        if (content === '67') {
            const result =
                add67(
                    message.guild.id,
                    message.author.id
                );

            newlyUnlocked.push(
                ...result.newlyUnlocked
            );
        }

        /* =========================================
           KÄSIGER MICHAEL
        ========================================= */

        if (
            message.mentions.users.has(
                CHEESY_MICHAEL_ID
            )
        ) {
            const unlocked =
                unlockSpecial(
                    message.guild.id,
                    message.author.id,
                    'cheesy_michael'
                );

            if (unlocked) {
                newlyUnlocked.push(
                    unlocked
                );
            }
        }

        /* =========================================
           ACHIEVEMENT-DMS
        ========================================= */

        if (
            newlyUnlocked.length > 0
        ) {
            await handleNewAchievements(
                message.client,
                message.guild.id,
                message.author.id,
                newlyUnlocked
            );
        }
    }
};