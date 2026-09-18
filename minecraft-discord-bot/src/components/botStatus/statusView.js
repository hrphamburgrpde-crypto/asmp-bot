const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize
} = require('discord.js');

const os = require('os');
const formatUptime = require('../../utils/formatUptime');

function createBotStatusView(client, apiLatency = null) {
    const websocketPing = Math.round(client.ws.ping);

    const memory = process.memoryUsage();

    const usedMemory = (
        memory.rss / 1024 / 1024
    ).toFixed(2);

    const totalMemory = (
        os.totalmem() / 1024 / 1024 / 1024
    ).toFixed(2);

    const uptime = formatUptime(client.uptime);

    const updatedAt = Math.floor(Date.now() / 1000);

    const apiLatencyText =
        apiLatency === null
            ? 'Wird gemessen...'
            : `${apiLatency} ms`;

    return new ContainerBuilder()
        .setAccentColor(0x57F287)

        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    [
                        '# 🟢 Bot Status',
                        '',
                        '**Der Bot läuft ohne Probleme.**'
                    ].join('\n')
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
                    [
                        '### 📡 Verbindung',
                        `**WebSocket Ping:** \`${websocketPing} ms\``,
                        `**API Latenz:** \`${apiLatencyText}\``
                    ].join('\n')
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
                    [
                        '### ⚙️ System',
                        `**Uptime:** \`${uptime}\``,
                        `**RAM:** \`${usedMemory} MB\``,
                        `**System RAM:** \`${totalMemory} GB\``,
                        `**Node.js:** \`${process.version}\``,
                        `**Plattform:** \`${process.platform}\``
                    ].join('\n')
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
                    [
                        `-# Zuletzt aktualisiert: <t:${updatedAt}:F>`,
                        '-# Automatische Aktualisierung: alle 60 Sekunden'
                    ].join('\n')
                )
        );
}

module.exports = createBotStatusView;