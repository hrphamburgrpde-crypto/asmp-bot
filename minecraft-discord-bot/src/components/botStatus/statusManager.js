const fs = require('fs');
const path = require('path');

const {
    MessageFlags
} = require('discord.js');

const createBotStatusView = require('./statusView');

const dataDirectory = path.join(
    __dirname,
    '../../../data'
);

const statusFile = path.join(
    dataDirectory,
    'bot-status.json'
);

let updateInterval = null;

function ensureDataDirectory() {
    if (!fs.existsSync(dataDirectory)) {
        fs.mkdirSync(dataDirectory, {
            recursive: true
        });
    }
}

function saveStatusMessage(
    channelId,
    messageId
) {
    ensureDataDirectory();

    fs.writeFileSync(
        statusFile,
        JSON.stringify(
            {
                channelId,
                messageId
            },
            null,
            4
        )
    );
}

function loadStatusMessage() {
    ensureDataDirectory();

    if (!fs.existsSync(statusFile)) {
        return null;
    }

    try {
        return JSON.parse(
            fs.readFileSync(
                statusFile,
                'utf8'
            )
        );
    } catch (error) {
        console.error(
            '[BOT STATUS] Status-Datei konnte nicht gelesen werden:',
            error
        );

        return null;
    }
}

function saveMessage(message) {
    saveStatusMessage(
        message.channelId,
        message.id
    );
}

async function updateStatusMessage(client) {
    const savedStatus =
        loadStatusMessage();

    if (!savedStatus) {
        return;
    }

    try {
        const channel =
            await client.channels.fetch(
                savedStatus.channelId
            );

        if (!channel) {
            console.warn(
                '[BOT STATUS] Channel nicht gefunden.'
            );

            return;
        }

        const message =
            await channel.messages.fetch(
                savedStatus.messageId
            );

        if (!message) {
            console.warn(
                '[BOT STATUS] Status-Nachricht nicht gefunden.'
            );

            return;
        }

        /*
         * API-Latenz messen
         */

        const startedAt = Date.now();

        await message.edit({
            components: [
                createBotStatusView(client)
            ],
            flags: MessageFlags.IsComponentsV2
        });

        const apiLatency =
            Date.now() - startedAt;

        /*
         * Status mit gemessener API-Latenz
         * aktualisieren.
         */

        await message.edit({
            components: [
                createBotStatusView(
                    client,
                    apiLatency
                )
            ],
            flags: MessageFlags.IsComponentsV2
        });

        console.log(
            `[BOT STATUS] Aktualisiert (${apiLatency} ms API).`
        );

    } catch (error) {
        console.error(
            '[BOT STATUS] Aktualisierung fehlgeschlagen:',
            error.message
        );
    }
}

function startStatusUpdater(client) {
    if (updateInterval) {
        clearInterval(updateInterval);
    }

    /*
     * Sofort aktualisieren.
     */

    updateStatusMessage(client);

    /*
     * Danach jede Minute.
     */

    updateInterval = setInterval(() => {
        updateStatusMessage(client);
    }, 60 * 1000);

    console.log(
        '[BOT STATUS] Automatische Aktualisierung gestartet.'
    );
}

module.exports = {
    saveMessage,
    loadStatusMessage,
    updateStatusMessage,
    startStatusUpdater
};