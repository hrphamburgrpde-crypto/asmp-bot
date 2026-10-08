const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(
    process.cwd(),
    'data'
);

const DATA_FILE = path.join(
    DATA_DIR,
    'level-event.json'
);

function getDefaultEvent() {
    return {
        active: false,
        multiplier: 1,
        startedAt: null,
        expiresAt: null
    };
}

function ensureFile() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, {
            recursive: true
        });
    }

    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(
            DATA_FILE,
            JSON.stringify(
                getDefaultEvent(),
                null,
                4
            ),
            'utf8'
        );
    }
}

function loadEvent() {
    ensureFile();

    try {
        const content =
            fs.readFileSync(
                DATA_FILE,
                'utf8'
            );

        if (!content.trim()) {
            return getDefaultEvent();
        }

        return JSON.parse(content);
    } catch (error) {
        console.error(
            '[LEVEL EVENT] level-event.json konnte nicht gelesen werden:',
            error
        );

        return getDefaultEvent();
    }
}

function saveEvent(event) {
    ensureFile();

    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(
            event,
            null,
            4
        ),
        'utf8'
    );
}

function startXpEvent(
    durationMinutes,
    multiplier
) {
    const event = {
        active: true,
        multiplier: Number(multiplier),
        startedAt: Date.now(),
        expiresAt:
            Date.now() +
            Number(durationMinutes) *
                60 *
                1000
    };

    saveEvent(event);

    return event;
}

function stopXpEvent() {
    const event = {
        active: false,
        multiplier: 1,
        startedAt: null,
        expiresAt: null
    };

    saveEvent(event);

    return event;
}

function getEventStatus() {
    return loadEvent();
}

function getCurrentMultiplier() {
    const event =
        loadEvent();

    if (
        !event.active ||
        !event.expiresAt
    ) {
        return 1;
    }

    if (
        Date.now() >=
        Number(event.expiresAt)
    ) {
        /*
         * Hier NICHT direkt die Ablaufmeldung senden.
         * Das übernimmt der Event-Checker.
         */
        return 1;
    }

    return Number(
        event.multiplier || 1
    );
}

function isEventExpired() {
    const event =
        loadEvent();

    if (
        !event.active ||
        !event.expiresAt
    ) {
        return false;
    }

    return (
        Date.now() >=
        Number(event.expiresAt)
    );
}

module.exports = {
    startXpEvent,
    stopXpEvent,
    getEventStatus,
    getCurrentMultiplier,
    isEventExpired
};