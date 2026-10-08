const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ContainerBuilder,
    TextDisplayBuilder,
    MessageFlags
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'counting.json');

function ensureDataFile() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, '{}', 'utf8');
    }
}

function loadCounting() {
    ensureDataFile();

    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');

        if (!data.trim()) {
            return {};
        }

        return JSON.parse(data);
    } catch (error) {
        console.error(
            '[COUNTING] counting.json konnte nicht gelesen werden:',
            error
        );

        return {};
    }
}

function saveCounting(data) {
    ensureDataFile();

    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(data, null, 4),
        'utf8'
    );
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('counting')
        .setDescription('Verwalte das Counting-System.')
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator.toString()
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription(
                    'Richtet den aktuellen Kanal als Counting-Kanal ein.'
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('rekord')
                .setDescription(
                    'Zeigt den aktuellen Server-Counting-Rekord.'
                )
        ),

    async execute(interaction) {
        const subcommand =
            interaction.options.getSubcommand();

        /* =========================================
           REKORD
        ========================================= */

        if (subcommand === 'rekord') {
            const data = loadCounting();

            const guildData =
                data[interaction.guild.id];

            if (!guildData) {
                return interaction.reply({
                    content:
                        '❌ Für diesen Server wurde noch kein Counting-System eingerichtet.',
                    flags: MessageFlags.Ephemeral
                });
            }

            const record =
                Number(guildData.record || 0);

            const recordUserId =
                guildData.recordUserId || null;

            let recordText =
                `# 🏆 Counting-Rekord\n\n` +
                `🔢 **${record.toLocaleString('de-DE')}**`;

            if (recordUserId) {
                recordText +=
                    `\n👑 Aufgestellt von <@${recordUserId}>`;
            }

            recordText +=
                '\n\n🍎 Wer schafft es, den Rekord zu brechen?';

            const container =
                new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                            .setContent(recordText)
                    );

            return interaction.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        /* =========================================
           SETUP
        ========================================= */

        if (subcommand === 'setup') {
            if (
                !interaction.memberPermissions?.has(
                    PermissionFlagsBits.Administrator
                )
            ) {
                return interaction.reply({
                    content:
                        '❌ Dafür benötigst du Administrator-Rechte.',
                    flags: MessageFlags.Ephemeral
                });
            }

            const data = loadCounting();

            data[interaction.guild.id] = {
                channelId: interaction.channel.id,
                currentNumber: 0,
                lastUserId: null,
                record: 0,
                recordUserId: null
            };

            saveCounting(data);

            const container =
                new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                            .setContent(
                                [
                                    '# 🔢 Counting eingerichtet',
                                    '',
                                    'Dieser Kanal wurde erfolgreich als Counting-Kanal eingerichtet.',
                                    '',
                                    '🔢 **Start:** 1',
                                    '❌ Bei einer falschen Zahl wird der Counter zurückgesetzt.',
                                    '👤 Derselbe User darf nicht zweimal hintereinander zählen.',
                                    '🏆 Der Server-Rekord wird automatisch gespeichert.',
                                    '',
                                    '🍎 Viel Spaß beim Zählen!'
                                ].join('\n')
                            )
                    );

            await interaction.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }
    }
};