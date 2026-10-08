const {
    EmbedBuilder,
    AttachmentBuilder
} = require('discord.js');

const path = require('path');

const {
    getUserSettings
} = require('./achievements');

const {
    sendAchievementSettingsPanel
} = require('./achievementNotification');

const ACHIEVEMENT_DIRECTORY =
    path.join(
        process.cwd(),
        'assets',
        'achievements'
    );

function formatDate(isoDate) {
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

async function sendAchievementDM(
    client,
    guildId,
    userId,
    achievement,
    unlockedAt
) {
    try {
        const user =
            await client.users.fetch(userId);

        const settings =
            getUserSettings(
                guildId,
                userId
            );

        /*
         * Wenn DMs deaktiviert wurden,
         * keine Achievement-DM senden.
         */
        if (
            settings.achievementNotifications === false
        ) {
            return;
        }

        const imagePath =
            path.join(
                ACHIEVEMENT_DIRECTORY,
                achievement.image
            );

        const attachment =
            new AttachmentBuilder(
                imagePath,
                {
                    name: achievement.image
                }
            );

        const embed =
            new EmbedBuilder()
                .setColor(0xF1C40F)
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

        const content =
            settings.achievementPings
                ? `<@${userId}>`
                : undefined;

        await user.send({
            content,
            embeds: [embed],
            files: [attachment]
        });

    } catch (error) {
        console.log(
            `[ACHIEVEMENT] DM an ${userId} konnte nicht gesendet werden: ${error.message}`
        );
    }
}

async function handleNewAchievements(
    client,
    guildId,
    userId,
    newlyUnlocked
) {
    if (
        !newlyUnlocked ||
        newlyUnlocked.length === 0
    ) {
        return;
    }

    const settings =
        getUserSettings(
            guildId,
            userId
        );

    /*
     * Erst die normalen Achievement-DMs.
     */
    for (
        const unlocked of newlyUnlocked
    ) {
        await sendAchievementDM(
            client,
            guildId,
            userId,
            unlocked.achievement,
            unlocked.unlockedAt
        );
    }

    /*
     * Erstes Achievement seit dem Update:
     * Danach einmalig das Einstellungs-Panel.
     */
    if (
        !settings.notificationPanelShown
    ) {
        const sent =
            await sendAchievementSettingsPanel(
                client,
                guildId,
                userId
            );

        if (sent) {
            const {
                setUserSettings
            } = require('./achievements');

            setUserSettings(
                guildId,
                userId,
                {
                    notificationPanelShown: true
                }
            );
        }
    }
}

module.exports = {
    sendAchievementDM,
    handleNewAchievements
};