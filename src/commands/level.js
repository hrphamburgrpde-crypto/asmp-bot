const {
    SlashCommandBuilder,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize
} = require('discord.js');

const {
    getUserLevelData,
    getProgress,
    DAILY_MESSAGE_LIMIT,
    DAILY_VOICE_MINUTES
} = require('../utils/levels');

const {
    getCurrentMultiplier
} = require('../utils/levelEvent');

function createProgressBar(
    percentage,
    size = 20
) {
    const filled =
        Math.round(
            (percentage / 100) *
            size
        );

    return (
        '█'.repeat(filled) +
        '░'.repeat(
            size - filled
        )
    );
}

function formatVoiceMinutes(
    minutes
) {
    const hours =
        Math.floor(
            minutes / 60
        );

    const remainingMinutes =
        minutes % 60;

    return `${hours}h ${remainingMinutes}m`;
}

module.exports = {
    data:
        new SlashCommandBuilder()
            .setName('level')
            .setDescription(
                'Zeigt deinen aktuellen Level-Fortschritt an.'
            ),

    async execute(interaction) {
        const user =
            getUserLevelData(
                interaction.guild.id,
                interaction.user.id
            );

        const progress =
            getProgress(user);

        const multiplier =
            getCurrentMultiplier();

        const bar =
            createProgressBar(
                progress.percentage
            );

        const container =
            new ContainerBuilder()
                .setAccentColor(
                    0xF1C40F
                );

        container.addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    [
                        '# 🍎 APFELSMP LEVEL',
                        '',
                        `👤 **${interaction.user.username}**`,
                        '',
                        `🏆 **Level ${progress.level}**`,
                        '',
                        `✨ **${user.xp.toLocaleString('de-DE')} XP**`,
                        '',
                        `\`${bar}\` **${progress.percentage}%**`,
                        '',
                        `📈 **${progress.progressXp.toLocaleString('de-DE')} / ${progress.neededXp.toLocaleString('de-DE')} XP**`,
                        `🚀 Noch **${Math.max(0, progress.neededXp - progress.progressXp).toLocaleString('de-DE')} XP** bis Level ${progress.level + 1}`,
                        ''
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
                    [
                        '## 📅 Tagesfortschritt',
                        '',
                        `💬 Nachrichten: **${user.daily.messages} / ${DAILY_MESSAGE_LIMIT}**`,
                        `🎙️ Voice: **${formatVoiceMinutes(user.daily.voiceMinutes)} / ${formatVoiceMinutes(DAILY_VOICE_MINUTES)}**`,
                        '',
                        `⚡ XP-Multiplikator: **${multiplier}x**`
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
                    '🍎 **ApfelSMP Level-System**'
                )
        );

        return interaction.reply({
            components: [
                container
            ],
            flags:
                MessageFlags.IsComponentsV2
        });
    }
};