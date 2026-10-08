const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'achievements.json');

const ACHIEVEMENTS = [
    // Bestehende Achievements
    {
        id: 'welcome',
        name: 'Willkommen auf ApfelSMP',
        description: 'Schreibe deine erste Nachricht auf dem Server.',
        image: 'willkommen.png',
        type: 'messages',
        requirement: 1
    },
    {
        id: 'messages_50',
        name: '50 Nachrichten',
        description: 'Schreibe 50 Nachrichten.',
        image: '50_nachrichten.png',
        type: 'messages',
        requirement: 50
    },
    {
        id: 'messages_100',
        name: '100 Nachrichten',
        description: 'Schreibe 100 Nachrichten.',
        image: '100_nachrichten.png',
        type: 'messages',
        requirement: 100
    },
    {
        id: 'messages_1000',
        name: '1.000 Nachrichten',
        description: 'Schreibe 1.000 Nachrichten.',
        image: '1000_nachrichten.png',
        type: 'messages',
        requirement: 1000
    },
    {
        id: 'messages_2500',
        name: '2.500 Nachrichten',
        description: 'Schreibe 2.500 Nachrichten.',
        image: '2500_nachrichten.png',
        type: 'messages',
        requirement: 2500
    },
    {
        id: 'messages_5000',
        name: '5.000 Nachrichten',
        description: 'Schreibe 5.000 Nachrichten.',
        image: '5000_nachrichten.png',
        type: 'messages',
        requirement: 5000
    },
    {
        id: 'messages_10000',
        name: '10.000 Nachrichten',
        description: 'Schreibe 10.000 Nachrichten.',
        image: '10000_nachrichten.png',
        type: 'messages',
        requirement: 10000
    },
    {
        id: 'messages_25000',
        name: '25.000 Nachrichten',
        description: 'Schreibe 25.000 Nachrichten.',
        image: '25000_nachrichten.png',
        type: 'messages',
        requirement: 25000
    },
    {
        id: 'messages_50000',
        name: '50.000 Nachrichten',
        description: 'Schreibe 50.000 Nachrichten.',
        image: '50000_nachrichten.png',
        type: 'messages',
        requirement: 50000
    },
    {
        id: 'messages_75000',
        name: '75.000 Nachrichten',
        description: 'Schreibe 75.000 Nachrichten.',
        image: '75000_nachrichten.png',
        type: 'messages',
        requirement: 75000
    },
    {
        id: 'messages_100000',
        name: '100.000 Nachrichten',
        description: 'Schreibe 100.000 Nachrichten.',
        image: '100000_nachrichten.png',
        type: 'messages',
        requirement: 100000
    },

    // Voice
    {
        id: 'voice_10m',
        name: '10 Minuten Voice',
        description: 'Verbringe 10 Minuten im Voice.',
        image: '10_minuten_voice.png',
        type: 'voice',
        requirement: 10
    },
    {
        id: 'voice_30m',
        name: '30 Minuten Voice',
        description: 'Verbringe 30 Minuten im Voice.',
        image: '30_minuten_voice.png',
        type: 'voice',
        requirement: 30
    },
    {
        id: 'voice_1h',
        name: '1 Stunde Voice',
        description: 'Verbringe 1 Stunde im Voice.',
        image: '1_stunde_voice.png',
        type: 'voice',
        requirement: 60
    },
    {
        id: 'voice_3h',
        name: '3 Stunden Voice',
        description: 'Verbringe 3 Stunden im Voice.',
        image: '3_stunden_voice.png',
        type: 'voice',
        requirement: 180
    },
    {
        id: 'voice_6h',
        name: '6 Stunden Voice',
        description: 'Verbringe 6 Stunden im Voice.',
        image: '6_stunden_voice.png',
        type: 'voice',
        requirement: 360
    },
    {
        id: 'voice_12h',
        name: '12 Stunden Voice',
        description: 'Verbringe 12 Stunden im Voice.',
        image: '12_stunden_voice.png',
        type: 'voice',
        requirement: 720
    },
    {
        id: 'voice_24h',
        name: '24 Stunden Voice',
        description: 'Verbringe 24 Stunden im Voice.',
        image: '24_stunden_voice.png',
        type: 'voice',
        requirement: 1440
    },
    {
        id: 'voice_50h',
        name: '50 Stunden Voice',
        description: 'Verbringe 50 Stunden im Voice.',
        image: '50_stunden_voice.png',
        type: 'voice',
        requirement: 3000
    },
    {
        id: 'voice_100h',
        name: '100 Stunden Voice',
        description: 'Verbringe 100 Stunden im Voice.',
        image: '100_stunden_voice.png',
        type: 'voice',
        requirement: 6000
    },
    {
        id: 'voice_500h',
        name: '500 Stunden Voice',
        description: 'Verbringe 500 Stunden im Voice.',
        image: '500_stunden_voice.png',
        type: 'voice',
        requirement: 30000
    },
    {
        id: 'voice_1000h',
        name: '1.000 Stunden Voice',
        description: 'Verbringe 1.000 Stunden im Voice.',
        image: '1000_stunden_voice.png',
        type: 'voice',
        requirement: 60000
    },
    {
        id: 'voice_2500h',
        name: '2.500 Stunden Voice',
        description: 'Verbringe 2.500 Stunden im Voice.',
        image: '2500_stunden_voice.png',
        type: 'voice',
        requirement: 150000
    },

    // Neue Achievements
    {
        id: 'night_owl',
        name: 'Nachteule',
        description: 'Schreibe eine Nachricht genau um 00:00 Uhr.',
        image: 'nachteule.png',
        type: 'special'
    },
    {
        id: 'counting_1000',
        name: 'Zahlen Begabt',
        description: 'Zähle 1.000-mal erfolgreich im Counting-Kanal.',
        image: 'zahlen_begabt.png',
        type: 'special'
    },
    {
        id: 'goat_67',
        name: '67 Goat',
        description: 'Schreibe 10-mal exakt die Zahl 67.',
        image: '67_goat.png',
        type: 'special'
    },
    {
        id: 'cheesy_michael',
        name: 'Käsiger Michael Liebhaber',
        description: 'Pinge den Käsigen Michael mindestens einmal.',
        image: 'kaesiger_michael_liebhaber.png',
        type: 'special'
    }
];

const CHEESY_MICHAEL_ID = '1499538587002208316';

/* =========================================================
   DATEI
========================================================= */

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

function loadAchievements() {
    ensureDataFile();

    try {
        const raw =
            fs.readFileSync(
                DATA_FILE,
                'utf8'
            );

        if (!raw.trim()) {
            return {};
        }

        return JSON.parse(raw);

    } catch (error) {
        console.error(
            '[ACHIEVEMENTS] achievements.json konnte nicht gelesen werden:',
            error
        );

        return {};
    }
}

function saveAchievements(data) {
    ensureDataFile();

    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(
            data,
            null,
            4
        ),
        'utf8'
    );
}

/* =========================================================
   USER DATEN
========================================================= */

function createDefaultUserData() {
    return {
        stats: {
            messages: 0,
            voiceMinutes: 0,
            countingCorrect: 0,
            number67: 0
        },

        achievements: {},

        settings: {
            achievementNotifications: true,
            achievementPings: true,
            notificationPanelShown: false
        }
    };
}

function getUserData(guildId, userId) {
    const data = loadAchievements();

    if (!data[guildId]) {
        data[guildId] = {};
    }

    if (!data[guildId][userId]) {
        data[guildId][userId] =
            createDefaultUserData();

        saveAchievements(data);
    }

    const userData =
        data[guildId][userId];

    if (!userData.stats) {
        userData.stats = {};
    }

    if (!Number.isFinite(
        Number(userData.stats.messages)
    )) {
        userData.stats.messages = 0;
    }

    if (!Number.isFinite(
        Number(userData.stats.voiceMinutes)
    )) {
        userData.stats.voiceMinutes = 0;
    }

    if (!Number.isFinite(
        Number(userData.stats.countingCorrect)
    )) {
        userData.stats.countingCorrect = 0;
    }

    if (!Number.isFinite(
        Number(userData.stats.number67)
    )) {
        userData.stats.number67 = 0;
    }

    if (!userData.achievements) {
        userData.achievements = {};
    }

    if (!userData.settings) {
        userData.settings = {};
    }

    if (
        typeof userData.settings.achievementNotifications !==
        'boolean'
    ) {
        userData.settings.achievementNotifications = true;
    }

    if (
        typeof userData.settings.achievementPings !==
        'boolean'
    ) {
        userData.settings.achievementPings = true;
    }

    if (
        typeof userData.settings.notificationPanelShown !==
        'boolean'
    ) {
        userData.settings.notificationPanelShown = false;
    }

    saveAchievements(data);

    return userData;
}

/* =========================================================
   GETTER
========================================================= */

function getUserAchievements(
    guildId,
    userId
) {
    return getUserData(
        guildId,
        userId
    ).achievements;
}

function getUserStats(
    guildId,
    userId
) {
    return getUserData(
        guildId,
        userId
    ).stats;
}

function getUserSettings(
    guildId,
    userId
) {
    return getUserData(
        guildId,
        userId
    ).settings;
}

/* =========================================================
   SETTINGS
========================================================= */

function setUserSettings(
    guildId,
    userId,
    settings
) {
    const data =
        loadAchievements();

    if (!data[guildId]) {
        data[guildId] = {};
    }

    if (!data[guildId][userId]) {
        data[guildId][userId] =
            createDefaultUserData();
    }

    data[guildId][userId].settings = {
        ...data[guildId][userId].settings,
        ...settings
    };

    saveAchievements(data);

    return data[guildId][userId].settings;
}

/* =========================================================
   ACHIEVEMENT CHECK
========================================================= */

function hasAchievement(
    guildId,
    userId,
    achievementId
) {
    const userData =
        getUserData(
            guildId,
            userId
        );

    return Boolean(
        userData.achievements?.[achievementId]
    );
}

/* =========================================================
   ACHIEVEMENT FREISCHALTEN
========================================================= */

function unlockAchievement(
    guildId,
    userId,
    achievementId
) {
    const achievement =
        ACHIEVEMENTS.find(
            item =>
                item.id === achievementId
        );

    if (!achievement) {
        console.error(
            `[ACHIEVEMENTS] Achievement "${achievementId}" existiert nicht.`
        );

        return null;
    }

    const data =
        loadAchievements();

    if (!data[guildId]) {
        data[guildId] = {};
    }

    if (!data[guildId][userId]) {
        data[guildId][userId] =
            createDefaultUserData();
    }

    const userData =
        data[guildId][userId];

    if (!userData.achievements) {
        userData.achievements = {};
    }

    /*
     * Wenn das Achievement bereits vorhanden ist,
     * wird es nicht noch einmal vergeben.
     *
     * Wichtig:
     * Dein Reset-Script löscht den Eintrag vollständig.
     * Danach kann dieses Achievement wieder neu
     * freigeschaltet werden.
     */

    if (
        userData.achievements[achievementId]
    ) {
        return null;
    }

    const unlockedAt =
        new Date().toISOString();

    userData.achievements[achievementId] = {
        unlockedAt
    };

    saveAchievements(data);

    console.log(
        `[ACHIEVEMENTS] ${userId} hat "${achievement.name}" freigeschaltet.`
    );

    return {
        achievement,
        unlockedAt
    };
}

/* =========================================================
   NACHRICHTEN
========================================================= */

function addMessage(
    guildId,
    userId
) {
    const data =
        loadAchievements();

    if (!data[guildId]) {
        data[guildId] = {};
    }

    if (!data[guildId][userId]) {
        data[guildId][userId] =
            createDefaultUserData();
    }

    const userData =
        data[guildId][userId];

    userData.stats.messages =
        Number(
            userData.stats.messages || 0
        ) + 1;

    const newlyUnlocked = [];

    for (
        const achievement
        of ACHIEVEMENTS
    ) {
        if (
            achievement.type !==
            'messages'
        ) {
            continue;
        }

        if (
            userData.stats.messages >=
            achievement.requirement &&
            !userData.achievements[
                achievement.id
            ]
        ) {
            const unlockedAt =
                new Date().toISOString();

            userData.achievements[
                achievement.id
            ] = {
                unlockedAt
            };

            newlyUnlocked.push({
                achievement,
                unlockedAt
            });
        }
    }

    saveAchievements(data);

    return {
        total:
            userData.stats.messages,

        newlyUnlocked
    };
}

/* =========================================================
   VOICE
========================================================= */

function addVoiceMinute(
    guildId,
    userId
) {
    const data =
        loadAchievements();

    if (!data[guildId]) {
        data[guildId] = {};
    }

    if (!data[guildId][userId]) {
        data[guildId][userId] =
            createDefaultUserData();
    }

    const userData =
        data[guildId][userId];

    userData.stats.voiceMinutes =
        Number(
            userData.stats.voiceMinutes || 0
        ) + 1;

    const newlyUnlocked = [];

    for (
        const achievement
        of ACHIEVEMENTS
    ) {
        if (
            achievement.type !==
            'voice'
        ) {
            continue;
        }

        if (
            userData.stats.voiceMinutes >=
            achievement.requirement &&
            !userData.achievements[
                achievement.id
            ]
        ) {
            const unlockedAt =
                new Date().toISOString();

            userData.achievements[
                achievement.id
            ] = {
                unlockedAt
            };

            newlyUnlocked.push({
                achievement,
                unlockedAt
            });
        }
    }

    saveAchievements(data);

    return {
        total:
            userData.stats.voiceMinutes,

        newlyUnlocked
    };
}

/* =========================================================
   COUNTING
========================================================= */

function addCountingCorrect(
    guildId,
    userId
) {
    const data =
        loadAchievements();

    if (!data[guildId]) {
        data[guildId] = {};
    }

    if (!data[guildId][userId]) {
        data[guildId][userId] =
            createDefaultUserData();
    }

    const userData =
        data[guildId][userId];

    userData.stats.countingCorrect =
        Number(
            userData.stats.countingCorrect || 0
        ) + 1;

    const newlyUnlocked = [];

    if (
        userData.stats.countingCorrect >=
        1000 &&
        !userData.achievements.counting_1000
    ) {
        const unlockedAt =
            new Date().toISOString();

        userData.achievements.counting_1000 = {
            unlockedAt
        };

        newlyUnlocked.push({
            achievement:
                getAchievement(
                    'counting_1000'
                ),

            unlockedAt
        });
    }

    saveAchievements(data);

    return {
        total:
            userData.stats.countingCorrect,

        newlyUnlocked
    };
}

/* =========================================================
   67
========================================================= */

function add67(
    guildId,
    userId
) {
    const data =
        loadAchievements();

    if (!data[guildId]) {
        data[guildId] = {};
    }

    if (!data[guildId][userId]) {
        data[guildId][userId] =
            createDefaultUserData();
    }

    const userData =
        data[guildId][userId];

    userData.stats.number67 =
        Number(
            userData.stats.number67 || 0
        ) + 1;

    const newlyUnlocked = [];

    if (
        userData.stats.number67 >=
        10 &&
        !userData.achievements.goat_67
    ) {
        const unlockedAt =
            new Date().toISOString();

        userData.achievements.goat_67 = {
            unlockedAt
        };

        newlyUnlocked.push({
            achievement:
                getAchievement(
                    'goat_67'
                ),

            unlockedAt
        });
    }

    saveAchievements(data);

    return {
        total:
            userData.stats.number67,

        newlyUnlocked
    };
}

/* =========================================================
   SPECIAL ACHIEVEMENTS
========================================================= */

function unlockSpecial(
    guildId,
    userId,
    achievementId
) {
    /*
     * Special Achievements laufen alle
     * über dieselbe Freischaltlogik.
     *
     * Wenn der Eintrag vorher durch das
     * Reset-Script gelöscht wurde, kann
     * das Achievement erneut freigeschaltet
     * werden.
     */

    return unlockAchievement(
        guildId,
        userId,
        achievementId
    );
}

/* =========================================================
   ACHIEVEMENT GETTER
========================================================= */

function getAchievement(id) {
    return (
        ACHIEVEMENTS.find(
            achievement =>
                achievement.id === id
        ) || null
    );
}

function getAllAchievements() {
    return ACHIEVEMENTS;
}

function getUnlockedCount(
    guildId,
    userId
) {
    return Object.keys(
        getUserData(
            guildId,
            userId
        ).achievements
    ).length;
}

function getAllData() {
    return loadAchievements();
}

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
    ACHIEVEMENTS,
    CHEESY_MICHAEL_ID,

    loadAchievements,
    saveAchievements,

    getUserData,
    getUserAchievements,
    getUserStats,
    getUserSettings,
    setUserSettings,

    hasAchievement,
    unlockAchievement,
    unlockSpecial,

    addMessage,
    addVoiceMinute,
    addCountingCorrect,
    add67,

    getAchievement,
    getAllAchievements,
    getUnlockedCount,
    getAllData
};