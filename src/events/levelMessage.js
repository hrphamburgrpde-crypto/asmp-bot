const {
    Events
} = require('discord.js');

const {
    MESSAGE_XP,
    addXp
} = require('../utils/levels');

const {
    getCurrentMultiplier
} = require('../utils/levelEvent');

const {
    handleLevelUp
} = require('../utils/levelNotifications');

module.exports = {
    name: Events.MessageCreate,

    async execute(message, client) {
        if (!message.guild) {
            return;
        }

        if (message.author.bot) {
            return;
        }

        /*
         * Keine XP für Nachrichten von Webhooks.
         */
        if (message.webhookId) {
            return;
        }

        const multiplier =
            getCurrentMultiplier();

        const xp =
            MESSAGE_XP * multiplier;

        const result =
            addXp(
                message.guild.id,
                message.author.id,
                xp,
                'message'
            );

        if (
            result.levelUp
        ) {
            await handleLevelUp(
                message.guild,
                message.author.id,
                result.newLevel,
                client
            );
        }
    }
};