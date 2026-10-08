const {
    SlashCommandBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
    MessageFlags
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const LEVELS_FILE = path.join(DATA_DIR, 'levels.json');
const ACHIEVEMENTS_FILE = path.join(DATA_DIR, 'achievements.json');

const PAGE_SIZE = 10;
const MAX_RANK = 1000;

/* =========================================================
   DATEIEN
========================================================= */

function loadJson(file) {
    try {
        if (!fs.existsSync(file)) {
            return {};
        }

        const raw = fs.readFileSync(file, 'utf8');

        if (!raw.trim()) {
            return {};
        }

        return JSON.parse(raw);

    } catch (error) {
        console.error(
            `[LEADERBOARD] Fehler beim Lesen von ${file}:`,
            error
        );

        return {};
    }
}

/* =========================================================
   XP
========================================================= */

function getXpFromUserData(userData) {
    if (!userData || typeof userData !== 'object') {
        return 0;
    }

    const possibleValues = [
        userData.xp,
        userData.totalXp,
        userData.totalXP,
        userData.experience,
        userData.experiencePoints,
        userData.stats?.xp,
        userData.stats?.totalXp,
        userData.stats?.totalXP,
        userData.progress?.xp
    ];

    for (const value of possibleValues) {
        const number = Number(value);

        if (Number.isFinite(number)) {
            return Math.max(0, number);
        }
    }

    return 0;
}

function getXpLeaderboard(guildId) {
    const data = loadJson(LEVELS_FILE);

    const guildData = data[guildId];

    if (!guildData || typeof guildData !== 'object') {
        return [];
    }

    const users = [];

    for (const [userId, userData] of Object.entries(guildData)) {
        const xp = getXpFromUserData(userData);

        users.push({
            userId,
            value: xp
        });
    }

    users.sort((a, b) => {
        if (b.value !== a.value) {
            return b.value - a.value;
        }

        return a.userId.localeCompare(b.userId);
    });

    return users;
}

/* =========================================================
   ACHIEVEMENTS
========================================================= */

function getAchievementCount(userData) {
    if (!userData || typeof userData !== 'object') {
        return 0;
    }

    if (
        userData.achievements &&
        typeof userData.achievements === 'object'
    ) {
        return Object.keys(userData.achievements).length;
    }

    return 0;
}

function getAchievementLeaderboard(guildId) {
    const data = loadJson(ACHIEVEMENTS_FILE);

    const guildData = data[guildId];

    if (!guildData || typeof guildData !== 'object') {
        return [];
    }

    const users = [];

    for (const [userId, userData] of Object.entries(guildData)) {
        const achievementCount = getAchievementCount(userData);

        users.push({
            userId,
            value: achievementCount
        });
    }

    users.sort((a, b) => {
        if (b.value !== a.value) {
            return b.value - a.value;
        }

        return a.userId.localeCompare(b.userId);
    });

    return users;
}

/* =========================================================
   PLATZIERUNG
========================================================= */

function getOwnPlacement(leaderboard, userId) {
    const index = leaderboard.findIndex(
        entry => entry.userId === userId
    );

    if (index === -1) {
        return null;
    }

    return index + 1;
}

/* =========================================================
   ZAHLEN FORMATIEREN
========================================================= */

function formatNumber(number) {
    return Number(number || 0).toLocaleString('de-DE');
}

/* =========================================================
   USER NAME
========================================================= */

async function getDisplayName(guild, userId) {
    /*
     * Erst Cache verwenden.
     * Dadurch werden unnötige API-Requests vermieden.
     */

    const cachedMember = guild.members.cache.get(userId);

    if (cachedMember) {
        return (
            cachedMember.displayName ||
            cachedMember.user.globalName ||
            cachedMember.user.username ||
            `User ${userId}`
        );
    }

    try {
        const member = await guild.members.fetch(userId);

        return (
            member.displayName ||
            member.user.globalName ||
            member.user.username ||
            `User ${userId}`
        );

    } catch {
        try {
            const user = await guild.client.users.fetch(userId);

            return (
                user.globalName ||
                user.username ||
                `User ${userId}`
            );

        } catch {
            return `User ${userId}`;
        }
    }
}

/* =========================================================
   RANG ICON
========================================================= */

function getRankIcon(rank) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';

    return `**${rank}.**`;
}

/* =========================================================
   LEADERBOARD ANZEIGEN
========================================================= */

async function buildLeaderboard(
    interaction,
    type,
    page,
    ownerId
) {
    const guild = interaction.guild;

    let leaderboard;

    if (type === 'achievements') {
        leaderboard = getAchievementLeaderboard(guild.id);
    } else {
        leaderboard = getXpLeaderboard(guild.id);
    }

    /*
     * Eigene Platzierung wird immer aus der
     * vollständigen Liste berechnet.
     */

    const ownPlacement = getOwnPlacement(
        leaderboard,
        ownerId
    );

    /*
     * Maximal werden die Top 1000 angezeigt.
     */

    const maximumPageCount = Math.max(
        1,
        Math.ceil(
            Math.min(
                leaderboard.length,
                MAX_RANK
            ) / PAGE_SIZE
        )
    );

    page = Math.max(
        1,
        Math.min(
            page,
            maximumPageCount
        )
    );

    const startIndex = (page - 1) * PAGE_SIZE;

    const pageEntries = leaderboard.slice(
        startIndex,
        startIndex + PAGE_SIZE
    );

    /* =====================================================
       CONTAINER
    ===================================================== */

    const container = new ContainerBuilder();

    const title =
        type === 'achievements'
            ? '🏆 Achievement Leaderboard'
            : '⭐ XP Leaderboard';

    const description =
        type === 'achievements'
            ? 'Die Spieler mit den meisten freigeschalteten Achievements.'
            : 'Die Spieler mit den meisten XP.';

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `# ${title}\n${description}`
        )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    /* =====================================================
       SPIELER
    ===================================================== */

    if (pageEntries.length === 0) {
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                '### Noch keine Daten vorhanden.'
            )
        );

    } else {
        for (let i = 0; i < pageEntries.length; i++) {
            const entry = pageEntries[i];

            const rank = startIndex + i + 1;

            const name = await getDisplayName(
                guild,
                entry.userId
            );

            let valueText;

            if (type === 'achievements') {
                valueText =
                    `🏆 **${formatNumber(entry.value)} Achievements**`;
            } else {
                valueText =
                    `⭐ **${formatNumber(entry.value)} XP**`;
            }

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `${getRankIcon(rank)} ${name}\n${valueText}`
                )
            );

            if (i !== pageEntries.length - 1) {
                container.addSeparatorComponents(
                    new SeparatorBuilder()
                );
            }
        }
    }

    /* =====================================================
       SEITE
    ===================================================== */

    container.addSeparatorComponents(
        new SeparatorBuilder()
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `📄 **Seite ${page} / ${maximumPageCount}**`
        )
    );

    /* =====================================================
       EIGENE PLATZIERUNG
    ===================================================== */

    let ownText;

    if (ownPlacement) {
        const ownEntry = leaderboard.find(
            entry => entry.userId === ownerId
        );

        if (type === 'achievements') {
            ownText =
                `👤 **Deine Platzierung: #${ownPlacement}** — ${formatNumber(ownEntry?.value || 0)} Achievements`;
        } else {
            ownText =
                `👤 **Deine Platzierung: #${ownPlacement}** — ${formatNumber(ownEntry?.value || 0)} XP`;
        }

    } else {
        ownText =
            '👤 **Deine Platzierung:** Noch nicht im Leaderboard';
    }

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            ownText
        )
    );

    /* =====================================================
       HINWEIS
    ===================================================== */

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `\n> 📊 Angezeigt werden die Plätze **1–${MAX_RANK}**.`
        )
    );

    /* =====================================================
       SELECT MENU
    ===================================================== */

    const selectMenu =
        new StringSelectMenuBuilder()
            .setCustomId(
                `leaderboard_type_${ownerId}`
            )
            .setPlaceholder(
                'Leaderboard auswählen'
            )
            .addOptions(
                {
                    label: 'XP Leaderboard',
                    description: 'Nach XP sortieren',
                    value: 'xp',
                    emoji: '⭐',
                    default: type === 'xp'
                },
                {
                    label: 'Achievement Leaderboard',
                    description: 'Nach Anzahl der Achievements sortieren',
                    value: 'achievements',
                    emoji: '🏆',
                    default: type === 'achievements'
                }
            );

    const selectRow =
        new ActionRowBuilder()
            .addComponents(
                selectMenu
            );

    /* =====================================================
       BUTTONS
    ===================================================== */

    const firstButton =
        new ButtonBuilder()
            .setCustomId(
                `leaderboard_first_${ownerId}`
            )
            .setEmoji('⏮️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page <= 1);

    const previousButton =
        new ButtonBuilder()
            .setCustomId(
                `leaderboard_previous_${ownerId}`
            )
            .setEmoji('◀️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page <= 1);

    const nextButton =
        new ButtonBuilder()
            .setCustomId(
                `leaderboard_next_${ownerId}`
            )
            .setEmoji('▶️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(
                page >= maximumPageCount
            );

    const lastButton =
        new ButtonBuilder()
            .setCustomId(
                `leaderboard_last_${ownerId}`
            )
            .setEmoji('⏭️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(
                page >= maximumPageCount
            );

    const buttonRow =
        new ActionRowBuilder()
            .addComponents(
                firstButton,
                previousButton,
                nextButton,
                lastButton
            );

    return {
        components: [
            container,
            selectRow,
            buttonRow
        ],
        maximumPageCount
    };
}

/* =========================================================
   COMMAND
========================================================= */

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription(
            'Zeigt das XP- oder Achievement-Leaderboard an.'
        ),

    async execute(interaction) {

        /*
         * WICHTIG:
         * Das Leaderboard kann durch die Discord-Member-Abfragen
         * länger als 3 Sekunden brauchen.
         *
         * Deshalb wird die Interaction sofort bestätigt.
         */

        await interaction.deferReply();

        const ownerId = interaction.user.id;

        let type = 'xp';
        let page = 1;

        const render = async () => {
            return await buildLeaderboard(
                interaction,
                type,
                page,
                ownerId
            );
        };

        /*
         * Jetzt darf die aufwendige Erstellung des
         * Leaderboards stattfinden.
         */

        const initial = await render();

        /*
         * Nach deferReply() wird mit editReply()
         * die eigentliche Nachricht erstellt.
         */

        const message =
            await interaction.editReply({
                components: initial.components,
                flags: MessageFlags.IsComponentsV2
            });

        /* =================================================
           COMPONENT COLLECTOR
        ================================================= */

        const collector =
            message.createMessageComponentCollector({
                time: 30 * 60 * 1000
            });

        collector.on(
            'collect',
            async componentInteraction => {

                /* =========================================
                   NUR ERSTELLER DARF BENUTZEN
                ========================================= */

                if (
                    componentInteraction.user.id !==
                    ownerId
                ) {
                    await componentInteraction.reply({
                        content:
                            '❌ Nur die Person, die dieses Leaderboard erstellt hat, kann es bedienen.',
                        flags:
                            MessageFlags.Ephemeral
                    });

                    return;
                }

                /* =========================================
                   SELECT MENU
                ========================================= */

                if (
                    componentInteraction.isStringSelectMenu()
                ) {
                    const value =
                        componentInteraction.values[0];

                    if (value === 'achievements') {
                        type = 'achievements';
                    } else {
                        type = 'xp';
                    }

                    page = 1;
                }

                /* =========================================
                   BUTTONS
                ========================================= */

                if (
                    componentInteraction.isButton()
                ) {
                    const customId =
                        componentInteraction.customId;

                    const leaderboard =
                        type === 'achievements'
                            ? getAchievementLeaderboard(
                                guildIdSafe(interaction)
                            )
                            : getXpLeaderboard(
                                guildIdSafe(interaction)
                            );

                    const maximumPageCount =
                        Math.max(
                            1,
                            Math.ceil(
                                Math.min(
                                    leaderboard.length,
                                    MAX_RANK
                                ) / PAGE_SIZE
                            )
                        );

                    if (
                        customId.startsWith(
                            `leaderboard_first_`
                        )
                    ) {
                        page = 1;
                    }

                    if (
                        customId.startsWith(
                            `leaderboard_previous_`
                        )
                    ) {
                        page = Math.max(
                            1,
                            page - 1
                        );
                    }

                    if (
                        customId.startsWith(
                            `leaderboard_next_`
                        )
                    ) {
                        page = Math.min(
                            maximumPageCount,
                            page + 1
                        );
                    }

                    if (
                        customId.startsWith(
                            `leaderboard_last_`
                        )
                    ) {
                        page = maximumPageCount;
                    }
                }

                /* =========================================
                   NEU RENDERN
                ========================================= */

                const updated =
                    await render();

                await componentInteraction.update({
                    components:
                        updated.components,
                    flags:
                        MessageFlags.IsComponentsV2
                });
            }
        );

        /* =================================================
           NACH 30 MINUTEN BUTTONS DEAKTIVIEREN
        ================================================= */

        collector.on(
            'end',
            async () => {
                try {
                    const disabled =
                        await render();

                    for (
                        const component
                        of disabled.components
                    ) {
                        if (
                            component.data?.components
                        ) {
                            for (
                                const child
                                of component.data.components
                            ) {
                                /*
                                 * Button
                                 */
                                if (
                                    child.type === 2
                                ) {
                                    child.disabled = true;
                                }

                                /*
                                 * Select Menu
                                 */
                                if (
                                    child.type === 3
                                ) {
                                    child.disabled = true;
                                }
                            }
                        }
                    }

                    await message.edit({
                        components:
                            disabled.components,
                        flags:
                            MessageFlags.IsComponentsV2
                    });

                } catch (error) {
                    console.error(
                        '[LEADERBOARD] Buttons konnten nicht deaktiviert werden:',
                        error
                    );
                }
            }
        );
    }
};

/* =========================================================
   HILFSFUNKTION
========================================================= */

function guildIdSafe(interaction) {
    return interaction.guild?.id;
}