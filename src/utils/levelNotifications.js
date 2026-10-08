const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize
} = require('discord.js');

const {
    getUserLevelData,
    getProgress
} = require('./levels');

const {
    updateLevelRole
} = require('./levelRoles');

async function handleLevelUp(
    guild,
    userId,
    newLevel,
    client
) {
    try {
        const member =
            await guild.members
                .fetch(userId)
                .catch(() => null);

        if (!member) {
            return;
        }

        await updateLevelRole(
            member,
            newLevel
        );

        const channelId =
            process.env.LEVEL_UP_CHANNEL_ID;

        if (!channelId) {
            console.warn(
                '[LEVEL] LEVEL_UP_CHANNEL_ID fehlt in .env'
            );

            return;
        }

        const channel =
            await client.channels
                .fetch(channelId)
                .catch(() => null);

        if (!channel) {
            console.error(
                '[LEVEL] Level-Up-Kanal konnte nicht gefunden werden.'
            );

            return;
        }

        const user =
            getUserLevelData(
                guild.id,
                userId
            );

        const progress =
            getProgress(user);

        const container =
            new ContainerBuilder()
                .setAccentColor(0xF1C40F);

        container.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    [
                        '# 🎉 LEVEL UP!',
                        '',
                        `🎊 Glückwunsch ${member}!`,
                        '',
                        `🏆 Du hast **Level ${newLevel}** erreicht!`,
                        '',
                        `✨ XP: **${user.xp.toLocaleString('de-DE')}**`,
                        `🚀 Nächstes Level: **${newLevel + 1}**`,
                        '',
                        '🍎 **ApfelSMP**'
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

        container.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    `📈 Fortschritt zum nächsten Level: **${progress.percentage}%**`
                )
        );

        await channel.send({
            components: [
                container
            ],
            flags:
                MessageFlags.IsComponentsV2
        });

    } catch (error) {
        console.error(
            '[LEVEL] Level-Up-Benachrichtigung fehlgeschlagen:',
            error
        );
    }
}

module.exports = {
    handleLevelUp
};