const {
    Events,
    ChannelType
} = require('discord.js');

const {
    VOICE_XP,
    addXp
} = require('../utils/levels');

const {
    getCurrentMultiplier
} = require('../utils/levelEvent');

const {
    handleLevelUp
} = require('../utils/levelNotifications');

const {
    addVoiceMinute
} = require('../utils/achievements');

const {
    sendAchievementDM
} = require('../utils/achievementDM');


/*
 * ==========================================
 * AKTIVE VOICE-USER
 * ==========================================
 */

const activeUsers = new Map();

let trackerStarted = false;


/*
 * ==========================================
 * PRÜFEN, OB VOICE ZÄHLT
 * ==========================================
 *
 * Jetzt zählt Voice auch alleine.
 *
 * Nicht gezählt werden:
 * - Bots
 * - AFK-Channel
 * - ungültige Channel
 *
 * ==========================================
 */

function isEligibleVoice(member) {

    if (!member) {
        return false;
    }


    /*
     * Bots bekommen keine XP
     */

    if (member.user?.bot) {
        return false;
    }


    const voice =
        member.voice;


    /*
     * Nicht in einem Voice
     */

    if (!voice?.channel) {
        return false;
    }


    /*
     * AFK-Channel zählt nicht
     */

    if (
        member.guild.afkChannelId &&
        voice.channelId ===
            member.guild.afkChannelId
    ) {
        return false;
    }


    /*
     * Nur normale Voice- und Stage-Channels
     */

    if (
        voice.channel.type !==
            ChannelType.GuildVoice &&
        voice.channel.type !==
            ChannelType.GuildStageVoice
    ) {
        return false;
    }


    /*
     * Alleine im Voice ist jetzt erlaubt.
     */

    return true;
}


/*
 * ==========================================
 * USER TRACKEN
 * ==========================================
 */

function trackUser(member) {

    if (!member) {
        return;
    }


    if (
        !isEligibleVoice(member)
    ) {
        return;
    }


    const key =
        `${member.guild.id}:${member.id}`;


    activeUsers.set(
        key,
        {
            guildId:
                member.guild.id,

            userId:
                member.id
        }
    );
}


/*
 * ==========================================
 * USER ENTFERNEN
 * ==========================================
 */

function untrackUser(member) {

    if (!member) {
        return;
    }


    const key =
        `${member.guild.id}:${member.id}`;


    activeUsers.delete(
        key
    );
}


/*
 * ==========================================
 * ALLE VOICE-USER SCANNEN
 * ==========================================
 */

function scanAllVoiceChannels(client) {

    activeUsers.clear();


    for (
        const guild
        of client.guilds.cache.values()
    ) {

        for (
            const channel
            of guild.channels.cache.values()
        ) {

            if (
                channel.type !==
                    ChannelType.GuildVoice &&
                channel.type !==
                    ChannelType.GuildStageVoice
            ) {
                continue;
            }


            /*
             * Jetzt werden ALLE echten User
             * im Voice getrackt.
             */

            const realUsers =
                channel.members.filter(
                    member =>
                        !member.user.bot
                );


            for (
                const member
                of realUsers.values()
            ) {

                if (
                    isEligibleVoice(member)
                ) {

                    trackUser(
                        member
                    );

                }

            }

        }

    }


    console.log(
        `[LEVEL] ${activeUsers.size} Voice-User werden aktuell getrackt.`
    );
}


/*
 * ==========================================
 * VOICE STATE EVENT
 * ==========================================
 */

module.exports = {

    name:
        Events.VoiceStateUpdate,


    async execute(
        oldState,
        newState,
        client
    ) {

        const member =
            newState.member ||
            oldState.member;


        if (!member) {
            return;
        }


        /*
         * Bots ignorieren
         */

        if (
            member.user.bot
        ) {
            return;
        }


        /*
         * User selbst aktualisieren
         */

        if (
            isEligibleVoice(member)
        ) {

            trackUser(
                member
            );

        } else {

            untrackUser(
                member
            );

        }

    },


    /*
     * ==========================================
     * VOICE-XP-TRACKER
     * ==========================================
     */

    startVoiceXpTracker(client) {

        if (
            trackerStarted
        ) {

            console.log(
                '[LEVEL] Voice-XP-Tracker läuft bereits.'
            );

            return;
        }


        trackerStarted =
            true;


        console.log(
            '[LEVEL] Voice-XP-Tracker gestartet.'
        );


        /*
         * Bereits laufende User erkennen
         */

        scanAllVoiceChannels(
            client
        );


        /*
         * Jede Minute
         */

        setInterval(

            async () => {

                /*
                 * Voice-Zustände erneut scannen
                 */

                scanAllVoiceChannels(
                    client
                );


                const entries =
                    Array.from(
                        activeUsers.values()
                    );


                for (
                    const entry
                    of entries
                ) {

                    try {

                        const guild =
                            client.guilds.cache.get(
                                entry.guildId
                            );


                        if (!guild) {

                            activeUsers.delete(
                                `${entry.guildId}:${entry.userId}`
                            );

                            continue;
                        }


                        const member =
                            await guild.members
                                .fetch(
                                    entry.userId
                                )
                                .catch(
                                    () => null
                                );


                        /*
                         * User nicht mehr im Voice
                         */

                        if (
                            !member ||
                            !isEligibleVoice(
                                member
                            )
                        ) {

                            activeUsers.delete(
                                `${entry.guildId}:${entry.userId}`
                            );

                            continue;
                        }


                        /*
                         * ==========================================
                         * ACHIEVEMENT-VOICE-ZEIT
                         * ==========================================
                         *
                         * Jede qualifizierte Minute zählt.
                         *
                         * Auch wenn der User alleine ist.
                         */

                        const achievementResult =
                            addVoiceMinute(
                                entry.guildId,
                                entry.userId
                            );


                        /*
                         * Neue Voice-Achievements?
                         */

                        if (
                            achievementResult
                                .newlyUnlocked
                                .length > 0
                        ) {

                            for (
                                const unlocked
                                of achievementResult
                                    .newlyUnlocked
                            ) {

                                await sendAchievementDM(
                                    client,
                                    entry.userId,
                                    unlocked.achievement,
                                    unlocked.unlockedAt
                                );

                            }

                        }


                        /*
                         * ==========================================
                         * VOICE XP
                         * ==========================================
                         */

                        const multiplier =
                            getCurrentMultiplier();


                        const xp =
                            VOICE_XP *
                            multiplier;


                        const result =
                            addXp(
                                entry.guildId,
                                entry.userId,
                                xp,
                                'voice'
                            );


                        /*
                         * Level-Up
                         */

                        if (
                            result.levelUp
                        ) {

                            await handleLevelUp(
                                guild,
                                entry.userId,
                                result.newLevel,
                                client
                            );

                        }


                    } catch (error) {

                        console.error(
                            '[LEVEL VOICE] Fehler:',
                            error
                        );

                    }

                }

            },

            60 * 1000

        );

    }

};