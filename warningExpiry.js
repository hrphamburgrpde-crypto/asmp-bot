const {
    Client
} = require('discord.js');

const {
    getAllWarnings,
    saveWarnings
} = require('./warnings');

const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder
} = require('discord.js');

let expiryInterval = null;

async function sendExpiryDM(client, userId, warning) {
    try {
        const user = await client.users.fetch(userId);

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    '# ✅ Verwarnung abgelaufen'
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `Hallo **${user.username}**,`
                )
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `deine Verwarnung **#${warning.id}** auf **ApfelSMP** ist automatisch abgelaufen.`
                )
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `📝 **Grund:** ${warning.reason}\n` +
                    `📅 **Erstellt:** ${new Date(warning.createdAt).toLocaleString('de-DE')}\n` +
                    `⌛ **Abgelaufen:** ${new Date(warning.expiresAt).toLocaleString('de-DE')}`
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    'Diese Verwarnung ist nicht mehr aktiv und wird nicht mehr bei deiner aktuellen Verwarnungsanzahl berücksichtigt.'
                )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    '🍎 **ApfelSMP Moderation**'
                )
            );

        await user.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });

        console.log(
            `[WARNINGS] Ablauf-DM an ${user.tag} gesendet. Warnung #${warning.id}`
        );
    } catch (error) {
        console.error(
            `[WARNINGS] Ablauf-DM konnte nicht gesendet werden für ${userId}:`,
            error
        );
    }
}

async function checkExpiredWarnings(client) {
    const data = getAllWarnings();

    let changed = false;

    for (const guildId of Object.keys(data)) {
        const guildData = data[guildId];

        for (const userId of Object.keys(guildData)) {
            const userData = guildData[userId];

            if (!userData.warnings) {
                continue;
            }

            const activeWarnings = [];

            for (const warning of userData.warnings) {
                if (!warning.expiresAt) {
                    activeWarnings.push(warning);
                    continue;
                }

                const expiresAt = new Date(
                    warning.expiresAt
                ).getTime();

                if (expiresAt <= Date.now()) {
                    changed = true;

                    await sendExpiryDM(
                        client,
                        userId,
                        warning
                    );

                    console.log(
                        `[WARNINGS] Warnung #${warning.id} von ${userId} ist abgelaufen.`
                    );
                } else {
                    activeWarnings.push(warning);
                }
            }

            userData.warnings = activeWarnings;
        }
    }

    if (changed) {
        saveWarnings(data);
    }
}

function startWarningExpiryChecker(client) {
    if (expiryInterval) {
        return;
    }

    // Direkt beim Start prüfen
    checkExpiredWarnings(client);

    // Danach jede Minute prüfen
    expiryInterval = setInterval(() => {
        checkExpiredWarnings(client);
    }, 60 * 1000);

    console.log('[WARNINGS] Automatische Warnungs-Ablaufprüfung gestartet.');
}

module.exports = {
    startWarningExpiryChecker,
    checkExpiredWarnings
};