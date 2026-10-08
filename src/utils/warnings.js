const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'warnings.json');

function ensureDataFile() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, '{}', 'utf8');
    }
}

function loadWarnings() {
    ensureDataFile();

    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');

        if (!data.trim()) {
            return {};
        }

        return JSON.parse(data);
    } catch (error) {
        console.error(
            '[WARNINGS] warnings.json konnte nicht gelesen werden:',
            error
        );

        return {};
    }
}

function saveWarnings(data) {
    ensureDataFile();

    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(data, null, 4),
        'utf8'
    );
}

function getUserWarnings(guildId, userId) {
    const data = loadWarnings();

    if (!data[guildId]) {
        return [];
    }

    if (!data[guildId][userId]) {
        return [];
    }

    return data[guildId][userId].warnings || [];
}

function addWarning(guildId, userId, warning) {
    const data = loadWarnings();

    if (!data[guildId]) {
        data[guildId] = {};
    }

    if (!data[guildId][userId]) {
        data[guildId][userId] = {
            warnings: []
        };
    }

    data[guildId][userId].warnings.push(warning);

    saveWarnings(data);

    return warning;
}

function removeWarning(guildId, userId, warningId) {
    const data = loadWarnings();

    if (!data[guildId]) {
        return null;
    }

    if (!data[guildId][userId]) {
        return null;
    }

    const warnings = data[guildId][userId].warnings || [];

    const index = warnings.findIndex(
        warning => Number(warning.id) === Number(warningId)
    );

    if (index === -1) {
        return null;
    }

    const removedWarning = warnings[index];

    warnings.splice(index, 1);

    data[guildId][userId].warnings = warnings;

    saveWarnings(data);

    return removedWarning;
}

function getNextWarningId(guildId, userId) {
    const warnings = getUserWarnings(guildId, userId);

    if (warnings.length === 0) {
        return 1;
    }

    const highestId = Math.max(
        ...warnings.map(warning => Number(warning.id) || 0)
    );

    return highestId + 1;
}

function getAllWarnings() {
    return loadWarnings();
}

module.exports = {
    loadWarnings,
    saveWarnings,
    getUserWarnings,
    addWarning,
    removeWarning,
    getNextWarningId,
    getAllWarnings
};