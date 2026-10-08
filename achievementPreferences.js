const {
    Events
} = require('discord.js');

const {
    handleAchievementSettingsInteraction
} = require('../utils/achievementNotification');

module.exports = {
    name: Events.InteractionCreate,

    async execute(interaction) {
        if (!interaction.isButton()) {
            return;
        }

        if (
            !interaction.customId.startsWith(
                'achievement_notifications_'
            ) &&
            !interaction.customId.startsWith(
                'achievement_pings_'
            )
        ) {
            return;
        }

        await handleAchievementSettingsInteraction(
            interaction
        );
    }
};