const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize
} = require('discord.js');


/*
 * ==========================================
 * MINECRAFT LOG CHANNEL
 * ==========================================
 */

function getMinecraftLogChannel(client) {

    const channelId =
        process.env.MINECRAFT_LOG_CHANNEL_ID;


    if (!channelId) {

        console.warn(
            '[MINECRAFT LOG] MINECRAFT_LOG_CHANNEL_ID fehlt in der .env.'
        );

        return null;
    }


    const channel =
        client.channels.cache.get(
            channelId
        );


    if (
        !channel ||
        !channel.isTextBased()
    ) {

        console.warn(
            '[MINECRAFT LOG] Minecraft-Log-Kanal nicht gefunden.'
        );

        return null;
    }


    return channel;
}


/*
 * ==========================================
 * COMMAND LOG
 * ==========================================
 */

async function logMinecraftCommand(
    client,
    {
        moderator,
        command,
        action,
        player,
        reason,
        duration,
        success,
        error,
        errorCode
    }
) {

    const channel =
        getMinecraftLogChannel(
            client
        );


    if (!channel) {

        return;
    }


    const color =
        success
            ? 0x57F287
            : 0xED4245;


    const icon =
        success
            ? '🟢'
            : '🔴';


    const status =
        success
            ? 'Erfolgreich'
            : 'Fehlgeschlagen';


    const lines = [

        `# ${icon} Minecraft Moderation`,

        '',

        `👮 **Moderator:** ${moderator}`,

        `🎮 **Spieler:** ${player}`,

        `🔨 **Aktion:** ${action}`,

        `📝 **Grund:** ${reason}`,

        duration
            ? `⏱️ **Dauer:** ${duration}`
            : null,

        '',

        `💻 **Command:** \`${command}\``,

        '',

        `📊 **Status:** ${status}`,

        error
            ? `❌ **Fehler:** ${error}`
            : null,

        errorCode
            ? `🔢 **Fehlercode:** \`${errorCode}\``
            : null,

        '',

        `🕐 <t:${Math.floor(Date.now() / 1000)}:F>`

    ].filter(
        Boolean
    );


    try {

        await channel.send({

            components: [

                new ContainerBuilder()

                    .setAccentColor(
                        color
                    )

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

                            .setDivider(
                                true
                            )

                    )

            ],

            flags:
                MessageFlags.IsComponentsV2

        });

    } catch (error) {

        console.error(
            '[MINECRAFT LOG SEND ERROR]',
            error
        );

    }
}


/*
 * ==========================================
 * MINECRAFT EVENT LOG
 * ==========================================
 */

async function logMinecraftEvent(
    client,
    {
        type,
        player,
        message,
        success,
        error,
        errorCode
    }
) {

    const channel =
        getMinecraftLogChannel(
            client
        );


    if (!channel) {

        return;
    }


    let icon =
        '📘';

    let color =
        0x3498DB;


    if (
        type === 'join'
    ) {

        icon =
            '🟢';

        color =
            0x57F287;
    }


    if (
        type === 'leave'
    ) {

        icon =
            '🔴';

        color =
            0xED4245;
    }


    const lines = [

        `# ${icon} Minecraft Event`,

        '',

        `🎮 **Spieler:** ${player || 'Unbekannt'}`,

        `📌 **Event:** ${type || 'Unbekannt'}`,

        message
            ? `📝 **Info:** ${message}`
            : null,

        typeof success === 'boolean'
            ? `📊 **Status:** ${success ? 'Erfolgreich' : 'Fehlgeschlagen'}`
            : null,

        error
            ? `❌ **Fehler:** ${error}`
            : null,

        errorCode
            ? `🔢 **Fehlercode:** \`${errorCode}\``
            : null,

        '',

        `🕐 <t:${Math.floor(Date.now() / 1000)}:F>`

    ].filter(
        Boolean
    );


    try {

        await channel.send({

            components: [

                new ContainerBuilder()

                    .setAccentColor(
                        color
                    )

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

                            .setDivider(
                                true
                            )

                    )

            ],

            flags:
                MessageFlags.IsComponentsV2

        });

    } catch (error) {

        console.error(
            '[MINECRAFT EVENT LOG ERROR]',
            error
        );

    }
}


module.exports = {

    logMinecraftCommand,

    logMinecraftEvent

};