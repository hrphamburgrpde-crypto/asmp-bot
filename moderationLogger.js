const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags
} = require('discord.js');

async function getLogChannel(client) {
    const channelId =
        process.env.MODERATION_LOG_CHANNEL_ID;

    if (!channelId) {
        console.warn(
            '[MODERATION LOG] MODERATION_LOG_CHANNEL_ID ist nicht gesetzt.'
        );

        return null;
    }

    try {
        const channel =
            await client.channels.fetch(channelId);

        if (!channel || !channel.isTextBased()) {
            console.warn(
                '[MODERATION LOG] Der angegebene Kanal ist kein Textkanal.'
            );

            return null;
        }

        return channel;

    } catch (error) {
        console.error(
            '[MODERATION LOG] Kanal konnte nicht gefunden werden:',
            error
        );

        return null;
    }
}

async function sendModerationLog(client, {
    type,
    user,
    moderator,
    reason = null,
    warningId = null,
    duration = null,
    extra = null
}) {
    const channel =
        await getLogChannel(client);

    if (!channel) {
        return false;
    }

    let title = '';
    let icon = '';
    let accentColor = 0x5865F2;

    switch (type) {
        case 'WARN':
            icon = '⚠️';
            title = 'VERWARNUNG';
            accentColor = 0xFEE75C;
            break;

        case 'UNWARN':
            icon = '✅';
            title = 'VERWARNUNG ENTFERNT';
            accentColor = 0x57F287;
            break;

        case 'BAN':
            icon = '🔨';
            title = 'BAN';
            accentColor = 0xED4245;
            break;

        case 'UNBAN':
            icon = '🔓';
            title = 'UNBAN';
            accentColor = 0x57F287;
            break;

        default:
            icon = '🛡️';
            title = 'MODERATION';
            break;
    }

    const lines = [
        `# ${icon} ${title}`,
        '',
        `👤 **Benutzer:** ${user}`,
        `🆔 **User-ID:** \`${user.id}\``,
        `👮 **Moderator:** ${moderator}`,
        `🆔 **Moderator-ID:** \`${moderator.id}\``
    ];

    if (warningId !== null) {
        lines.push(
            `⚠️ **Warn-ID:** #${warningId}`
        );
    }

    if (reason) {
        lines.push(
            `📝 **Grund:** ${reason}`
        );
    }

    if (duration) {
        lines.push(
            `⏱️ **Dauer:** ${duration}`
        );
    }

    if (extra) {
        lines.push(
            extra
        );
    }

    lines.push(
        '',
        `📅 **Datum:** ${new Date().toLocaleString(
            'de-DE',
            {
                dateStyle: 'short',
                timeStyle: 'medium'
            }
        )}`
    );

    const container =
        new ContainerBuilder()
            .setAccentColor(accentColor)
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        lines.join('\n')
                    )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
                    .setSpacing(
                        SeparatorSpacingSize.Small
                    )
                    .setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        '🍎 **ApfelSMP Moderation**'
                    )
            );

    try {
        await channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });

        return true;

    } catch (error) {
        console.error(
            '[MODERATION LOG] Log konnte nicht gesendet werden:',
            error
        );

        return false;
    }
}

module.exports = {
    sendModerationLog
};