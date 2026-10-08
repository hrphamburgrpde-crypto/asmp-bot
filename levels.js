const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'levels.json');

const MESSAGE_XP = Number(process.env.LEVEL_MESSAGE_XP || 10);
const VOICE_XP = Number(process.env.LEVEL_VOICE_XP || 5);

const DAILY_MESSAGE_LIMIT = Number(
    process.env.LEVEL_DAILY_MESSAGE_LIMIT || 100
);

const DAILY_VOICE_MINUTES = Number(
    process.env.LEVEL_DAILY_VOICE_MINUTES || 480
);

function ensureDataFile() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, {
            recursive: true
        });
    }

    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(
            DATA_FILE,
            '{}',
            'utf8'
        );
    }
}

function loadLevels() {
    ensureDataFile();

    try {
        const content = fs.readFileSync(
            DATA_FILE,
            'utf8'
        );

        if (!content.trim()) {
            return {};
        }

        return JSON.parse(content);
    } catch (error) {
        console.error(
            '[LEVELS] levels.json konnte nicht gelesen werden:',
            error
        );

        return {};
    }
}

function saveLevels(data) {
    ensureDataFile();

    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(data, null, 4),
        'utf8'
    );
}

function getToday() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(
        now.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
        now.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/*
 * Benötigte Gesamt-XP für ein Level.
 *
 * Level 1 = 0 XP
 * Level 2 = 100 XP
 * Level 3 = 282 XP
 * Level 4 = 519 XP
 * usw.
 */
function getRequiredTotalXp(level) {
    if (level <= 1) {
        return 0;
    }

    return Math.floor(
        100 * Math.pow(level - 1, 1.5)
    );
}

function getLevelFromXp(xp) {
    let level = 1;

    while (
        getRequiredTotalXp(level + 1) <= xp
    ) {
        level++;

        if (level >= 1000) {
            break;
        }
    }

    return level;
}

function getUserData(guildId, userId) {
    const data = loadLevels();

    if (!data[guildId]) {
        data[guildId] = {};
    }

    if (!data[guildId][userId]) {
        data[guildId][userId] = {
            xp: 0,
            level: 1,
            daily: {
                date: getToday(),
                messages: 0,
                voiceMinutes: 0
            }
        };
    }

    const user = data[guildId][userId];

    if (
        !user.daily ||
        user.daily.date !== getToday()
    ) {
        user.daily = {
            date: getToday(),
            messages: 0,
            voiceMinutes: 0
        };
    }

    return {
        data,
        user
    };
}

function ensureUser(guildId, userId) {
    const result = getUserData(
        guildId,
        userId
    );

    saveLevels(result.data);

    return result.user;
}

function getUserLevelData(guildId, userId) {
    const result = getUserData(
        guildId,
        userId
    );

    saveLevels(result.data);

    return result.user;
}

function addXp(
    guildId,
    userId,
    amount,
    source
) {
    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        return {
            added: 0,
            levelUp: false
        };
    }

    const result = getUserData(
        guildId,
        userId
    );

    const user = result.user;

    if (source === 'message') {
        if (
            user.daily.messages >=
            DAILY_MESSAGE_LIMIT
        ) {
            saveLevels(result.data);

            return {
                added: 0,
                levelUp: false,
                limited: true,
                reason: 'message'
            };
        }

        user.daily.messages++;
    }

    if (source === 'voice') {
        if (
            user.daily.voiceMinutes >=
            DAILY_VOICE_MINUTES
        ) {
            saveLevels(result.data);

            return {
                added: 0,
                levelUp: false,
                limited: true,
                reason: 'voice'
            };
        }

        user.daily.voiceMinutes++;
    }

    const oldLevel = getLevelFromXp(
        Number(user.xp) || 0
    );

    user.xp =
        Number(user.xp || 0) +
        Number(amount);

    const newLevel = getLevelFromXp(
        user.xp
    );

    user.level = newLevel;

    saveLevels(result.data);

    return {
        added: Number(amount),
        levelUp: newLevel > oldLevel,
        oldLevel,
        newLevel,
        xp: user.xp,
        user
    };
}

function getProgress(user) {
    const level = getLevelFromXp(
        Number(user.xp) || 0
    );

    const currentLevelXp =
        getRequiredTotalXp(level);

    const nextLevelXp =
        getRequiredTotalXp(level + 1);

    const progressXp =
        Math.max(
            0,
            user.xp - currentLevelXp
        );

    const neededXp =
        Math.max(
            1,
            nextLevelXp - currentLevelXp
        );

    const percentage = Math.min(
        100,
        Math.floor(
            (progressXp / neededXp) * 100
        )
    );

    return {
        level,
        currentLevelXp,
        nextLevelXp,
        progressXp,
        neededXp,
        percentage
    };
}

function getTopUsers(
    guildId,
    limit = 10
) {
    const data = loadLevels();

    if (!data[guildId]) {
        return [];
    }

    return Object.entries(
        data[guildId]
    )
        .map(([userId, user]) => ({
            userId,
            xp: Number(user.xp) || 0,
            level: getLevelFromXp(
                Number(user.xp) || 0
            )
        }))
        .sort((a, b) => b.xp - a.xp)
        .slice(0, limit);
}

module.exports = {
    MESSAGE_XP,
    VOICE_XP,
    DAILY_MESSAGE_LIMIT,
    DAILY_VOICE_MINUTES,
    getToday,
    getRequiredTotalXp,
    getLevelFromXp,
    getUserLevelData,
    ensureUser,
    addXp,
    getProgress,
    getTopUsers
};