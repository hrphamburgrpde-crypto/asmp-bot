const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize
} = require('discord.js');

const {
    getEventStatus,
    stopXpEvent
} = require('./levelEvent');

let checkerStarted = false;

async function sendLevelEventMessage(
    client,
    content,
    accentColor = 0xF1C40F
) {
    const channelId =
        process.env.LEVEL_UP_CHANNEL_ID;

    if (!channelId) {
        console.warn(
            '[LEVEL EVENT] LEVEL_UP_CHANNEL_ID fehlt in .env'
        );

        return;
    }

    const channel =
        await client.channels
            .fetch(channelId)
            .catch(() => null);

    if (!channel) {
        console.error(
            '[LEVEL EVENT] Level-Kanal konnte nicht gefunden werden.'
        );

        return;
    }

    const container =
        new ContainerBuilder()
            .setAccentColor(
                accentColor
            );

    container.addTextDisplayComponents(
        new TextDisplayBuilder()
            .setContent(content)
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

    await channel.send({
        components: [
            container
        ],
        flags:
            MessageFlags.IsComponentsV2
    });
}

async function checkLevelEvent(
    client
) {
    const event =
        getEventStatus();

    if (
        !event.active ||
        !event.expiresAt
    ) {
        return;
    }

    if (
        Date.now() <
        Number(event.expiresAt)
    ) {
        return;
    }

    const oldMultiplier =
        Number(
            event.multiplier || 1
        );

    stopXpEvent();

    await sendLevelEventMessage(
        client,
        [
            '# ⏰ XP-EVENT BEENDET',
            '',
            'Das aktive XP-Event ist abgelaufen.',
            '',
            `⚡ Der **${oldMultiplier}× XP-Multiplikator** wurde beendet.`,
            '',
            '📊 Das Level-System läuft ab jetzt wieder mit **1× XP**.'
        ].join('\n'),
        0xE67E22
    );

    console.log(
        `[LEVEL EVENT] ${oldMultiplier}x XP Event automatisch beendet.`
    );
}

function startLevelEventChecker(
    client
) {
    if (checkerStarted) {
        return;
    }

    checkerStarted = true;

    console.log(
        '[LEVEL EVENT] Event-Checker gestartet.'
    );

    /*
     * Jede Minute prüfen.
     */
    setInterval(
        async () => {
            try {
                await checkLevelEvent(
                    client
                );
            } catch (error) {
                console.error(
                    '[LEVEL EVENT] Fehler beim Prüfen:',
                    error
                );
            }
        },
        60 * 1000
    );

    /*
     * Direkt beim Start prüfen.
     */
    checkLevelEvent(client)
        .catch(error => {
            console.error(
                '[LEVEL EVENT] Fehler beim Startcheck:',
                error
            );
        });
}

module.exports = {
    startLevelEventChecker,
    sendLevelEventMessage
};