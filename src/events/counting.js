const {
    Events,
    ContainerBuilder,
    TextDisplayBuilder,
    MessageFlags
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const {
    addCountingCorrect
} = require('../utils/achievements');

const {
    handleNewAchievements
} = require('../utils/achievementDM');

const DATA_DIR =
    path.join(
        process.cwd(),
        'data'
    );

const DATA_FILE =
    path.join(
        DATA_DIR,
        'counting.json'
    );

/* =========================================================
   DATEI SICHERSTELLEN
========================================================= */

function ensureDataFile() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(
            DATA_DIR,
            {
                recursive: true
            }
        );
    }

    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(
            DATA_FILE,
            '{}',
            'utf8'
        );
    }
}

/* =========================================================
   COUNTING LADEN
========================================================= */

function loadCounting() {
    ensureDataFile();

    try {
        const data =
            fs.readFileSync(
                DATA_FILE,
                'utf8'
            );

        if (!data.trim()) {
            return {};
        }

        return JSON.parse(data);

    } catch (error) {
        console.error(
            '[COUNTING] Fehler beim Lesen von counting.json:',
            error
        );

        return {};
    }
}

/* =========================================================
   COUNTING SPEICHERN
========================================================= */

function saveCounting(data) {
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
   EVENT
========================================================= */

module.exports = {
    name: Events.MessageCreate,

    async execute(message) {

        /* ================================================
           BOTS IGNORIEREN
        ================================================ */

        if (message.author.bot) {
            return;
        }

        /* ================================================
           NUR SERVER
        ================================================ */

        if (!message.guild) {
            return;
        }

        /* ================================================
           COUNTING-DATEN LADEN
        ================================================ */

        const data =
            loadCounting();

        const guildData =
            data[message.guild.id];

        /* ================================================
           COUNTING NICHT EINGERICHTET
        ================================================ */

        if (!guildData) {
            return;
        }

        /* ================================================
           FALSCHER KANAL
        ================================================ */

        if (
            message.channel.id !==
            guildData.channelId
        ) {
            return;
        }

        /* ================================================
           NUR REINE ZAHLEN ERLAUBEN
        ================================================ */

        const content =
            message.content.trim();

        if (
            !/^\d+$/.test(content)
        ) {
            try {
                await message.delete();
            } catch {}

            return;
        }

        /* ================================================
           ZAHL UMWANDELN
        ================================================ */

        const number =
            Number(content);

        /* ================================================
           UNGÜLTIGE / ZU GROSSE ZAHL
        ================================================ */

        if (
            !Number.isSafeInteger(number) ||
            number < 0
        ) {
            try {
                await message.delete();
            } catch {}

            return;
        }

        /* ================================================
           ERWARTETE ZAHL
        ================================================ */

        const expectedNumber =
            Number(
                guildData.currentNumber || 0
            ) + 1;

        /* ================================================
           GLEICHER USER ZWEIMAL HINTEREINANDER
        ================================================ */

        if (
            guildData.lastUserId ===
            message.author.id
        ) {

            try {
                await message.delete();
            } catch {}

            const warning =
                await message.channel
                    .send({
                        content:
                            `❌ ${message.author} Du darfst nicht zweimal hintereinander zählen!`
                    })
                    .catch(
                        () => null
                    );

            if (warning) {
                setTimeout(
                    () => {
                        warning
                            .delete()
                            .catch(
                                () => {}
                            );
                    },
                    5000
                );
            }

            return;
        }

        /* ================================================
           FALSCHE ZAHL
        ================================================ */

        if (
            number !==
            expectedNumber
        ) {

            try {
                await message.delete();
            } catch {}

            /* Counter zurücksetzen */
            guildData.currentNumber = 0;
            guildData.lastUserId = null;

            saveCounting(data);

            /* Fehler-Panel */

            const container =
                new ContainerBuilder()
                    .addTextDisplayComponents(
                        new TextDisplayBuilder()
                            .setContent(
                                [
                                    '# ❌ Falsch gezählt!',
                                    '',
                                    `👤 ${message.author}`,
                                    '',
                                    `🔢 Erwartet wurde **${expectedNumber}**.`,
                                    `Du hast **${number}** geschrieben.`,
                                    '',
                                    '🔄 Der Counter wurde auf **0** zurückgesetzt.',
                                    '',
                                    '🍎 Die nächste Zahl ist **1**.'
                                ].join('\n')
                            )
                    );

            const warning =
                await message.channel
                    .send({
                        components: [
                            container
                        ],
                        flags:
                            MessageFlags.IsComponentsV2
                    })
                    .catch(
                        () => null
                    );

            /* Fehlermeldung nach 7 Sekunden löschen */

            if (warning) {
                setTimeout(
                    () => {
                        warning
                            .delete()
                            .catch(
                                () => {}
                            );
                    },
                    7000
                );
            }

            return;
        }

        /* ================================================
           RICHTIGE ZAHL
        ================================================ */

        guildData.currentNumber =
            number;

        guildData.lastUserId =
            message.author.id;

        /* ================================================
           SERVER-REKORD
        ================================================ */

        if (
            number >
            Number(
                guildData.record || 0
            )
        ) {

            guildData.record =
                number;

            guildData.recordUserId =
                message.author.id;
        }

        /* Counting-Daten speichern */

        saveCounting(data);

        /* ================================================
           ACHIEVEMENT:
           ZAHLEN BEGABT
        ================================================ */

        try {

            const achievementResult =
                addCountingCorrect(
                    message.guild.id,
                    message.author.id
                );

            if (
                achievementResult
                    .newlyUnlocked &&
                achievementResult
                    .newlyUnlocked.length > 0
            ) {

                await handleNewAchievements(
                    message.client,
                    message.guild.id,
                    message.author.id,
                    achievementResult
                        .newlyUnlocked
                );
            }

        } catch (error) {

            console.error(
                '[COUNTING] Achievement konnte nicht verarbeitet werden:',
                error
            );
        }

        /* ================================================
           ✅ REAKTION
        ================================================ */

        try {

            await message.react(
                '✅'
            );

        } catch (error) {

            console.error(
                '[COUNTING] ✅ Reaktion konnte nicht gesetzt werden:',
                error.message
            );
        }
    }
};