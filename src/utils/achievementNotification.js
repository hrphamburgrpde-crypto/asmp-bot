const {
    ContainerBuilder,
    TextDisplayBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SeparatorBuilder,
    MessageFlags
} = require('discord.js');

const {
    getUserSettings,
    setUserSettings
} = require('./achievements');

/* =========================================================
   PANEL ERSTELLEN
========================================================= */

function buildSettingsPanel(
    guildId,
    userId,
    settings
) {
    const container =
        new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        [
                            '# 🔔 Achievement-Benachrichtigungen',
                            '',
                            'Du hast gerade dein erstes Achievement seit dem Update freigeschaltet!',
                            '',
                            'Hier kannst du einstellen, ob du zukünftig bei neuen Achievements benachrichtigt werden möchtest.',
                            '',
                            `🔔 **Achievement-DMs:** ${settings.achievementNotifications ? 'Aktiviert' : 'Deaktiviert'}`,
                            `📢 **Ping in der DM:** ${settings.achievementPings ? 'Aktiviert' : 'Deaktiviert'}`
                        ].join('\n')
                    )
            )
            .addSeparatorComponents(
                new SeparatorBuilder()
            );

    const notificationButton =
        new ButtonBuilder()
            .setCustomId(
                `achievement_notifications_${guildId}_${userId}`
            )
            .setLabel(
                settings.achievementNotifications
                    ? '🔔 DMs AN'
                    : '🔕 DMs AUS'
            )
            .setStyle(
                settings.achievementNotifications
                    ? ButtonStyle.Success
                    : ButtonStyle.Secondary
            );

    const pingButton =
        new ButtonBuilder()
            .setCustomId(
                `achievement_pings_${guildId}_${userId}`
            )
            .setLabel(
                settings.achievementPings
                    ? '📢 Ping AN'
                    : '🔕 Ping AUS'
            )
            .setStyle(
                settings.achievementPings
                    ? ButtonStyle.Success
                    : ButtonStyle.Secondary
            );

    const row =
        new ActionRowBuilder()
            .addComponents(
                notificationButton,
                pingButton
            );

    return {
        container,
        row
    };
}

/* =========================================================
   PANEL AN USER SENDEN
========================================================= */

async function sendAchievementSettingsPanel(
    client,
    guildId,
    userId
) {
    try {
        const user =
            await client.users.fetch(
                userId
            );

        const settings =
            getUserSettings(
                guildId,
                userId
            );

        const panel =
            buildSettingsPanel(
                guildId,
                userId,
                settings
            );

        await user.send({
            components: [
                panel.container,
                panel.row
            ],
            flags:
                MessageFlags.IsComponentsV2
        });

        return true;

    } catch (error) {

        console.log(
            `[ACHIEVEMENT] Einstellungs-Panel an ${userId} konnte nicht gesendet werden: ${error.message}`
        );

        return false;
    }
}

/* =========================================================
   BUTTON INTERAKTION
========================================================= */

async function handleAchievementSettingsInteraction(
    interaction
) {
    const customId =
        interaction.customId;

    const isNotificationButton =
        customId.startsWith(
            'achievement_notifications_'
        );

    const isPingButton =
        customId.startsWith(
            'achievement_pings_'
        );

    if (
        !isNotificationButton &&
        !isPingButton
    ) {
        return false;
    }

    const prefix =
        isNotificationButton
            ? 'achievement_notifications_'
            : 'achievement_pings_';

    const values =
        customId
            .replace(prefix, '')
            .split('_');

    /*
     * User-ID und Guild-ID bestehen nur aus Zahlen.
     * Deshalb können wir die letzten beiden Werte nehmen.
     */

    const userId =
        values[values.length - 1];

    const guildId =
        values
            .slice(0, -1)
            .join('_');

    /* =========================================
       NUR DER EIGENTÜMER DARF ÄNDERN
    ========================================= */

    if (
        interaction.user.id !==
        userId
    ) {
        await interaction.reply({
            content:
                '❌ Dieses Einstellungs-Panel gehört nicht dir.',
            flags:
                MessageFlags.Ephemeral
        });

        return true;
    }

    /* =========================================
       EINSTELLUNGEN LADEN
    ========================================= */

    const currentSettings =
        getUserSettings(
            guildId,
            userId
        );

    const newSettings = {
        achievementNotifications:
            currentSettings.achievementNotifications,

        achievementPings:
            currentSettings.achievementPings,

        notificationPanelShown:
            currentSettings.notificationPanelShown
    };

    /* =========================================
       DM EIN/AUS
    ========================================= */

    if (
        isNotificationButton
    ) {
        newSettings.achievementNotifications =
            !newSettings.achievementNotifications;
    }

    /* =========================================
       PING EIN/AUS
    ========================================= */

    if (
        isPingButton
    ) {
        newSettings.achievementPings =
            !newSettings.achievementPings;
    }

    /* =========================================
       SPEICHERN
    ========================================= */

    setUserSettings(
        guildId,
        userId,
        newSettings
    );

    /* =========================================
       PANEL NEU AUFBAUEN
       NICHT ALTE COMPONENTS + NEUE ROW!
    ========================================= */

    const panel =
        buildSettingsPanel(
            guildId,
            userId,
            newSettings
        );

    await interaction.update({
        components: [
            panel.container,
            panel.row
        ],
        flags:
            MessageFlags.IsComponentsV2
    });

    return true;
}

module.exports = {
    sendAchievementSettingsPanel,
    handleAchievementSettingsInteraction
};