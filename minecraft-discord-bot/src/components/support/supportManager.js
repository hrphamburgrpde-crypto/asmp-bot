const fs = require('fs');
const path = require('path');

const {
    ChannelType,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const {
    joinVoiceChannel,
    getVoiceConnection,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    NoSubscriberBehavior,
    StreamType
} = require('@discordjs/voice');

const ffmpegPath = require('ffmpeg-static');

const {
    createSupportPanel
} = require('./supportView');


/*
 * ==========================================
 * DATEIEN
 * ==========================================
 */

const dataDirectory =
    path.join(
        __dirname,
        '../../../data'
    );

const stateFile =
    path.join(
        dataDirectory,
        'support.json'
    );

const musicDirectory =
    path.join(
        __dirname,
        '../../../assets'
    );


/*
 * ==========================================
 * SUPPORT STATE
 * ==========================================
 */

function ensureDataDirectory() {

    if (!fs.existsSync(dataDirectory)) {

        fs.mkdirSync(
            dataDirectory,
            {
                recursive: true
            }
        );
    }
}


function loadState() {

    ensureDataDirectory();

    if (!fs.existsSync(stateFile)) {

        return {
            open: false,
            guildId: null,
            waitingRoomId: null,
            waitingUsers: {}
        };
    }

    try {

        const data =
            JSON.parse(
                fs.readFileSync(
                    stateFile,
                    'utf8'
                )
            );

        return {

            open:
                data.open ?? false,

            guildId:
                data.guildId ?? null,

            waitingRoomId:
                data.waitingRoomId ?? null,

            waitingUsers:
                data.waitingUsers ?? {}

        };

    } catch (error) {

        console.error(
            '[SUPPORT] support.json konnte nicht gelesen werden:',
            error
        );

        return {
            open: false,
            guildId: null,
            waitingRoomId: null,
            waitingUsers: {}
        };
    }
}


function saveState(state) {

    ensureDataDirectory();

    fs.writeFileSync(

        stateFile,

        JSON.stringify(
            state,
            null,
            4
        )

    );
}


/*
 * ==========================================
 * SUPPORT CHANNELS / ROLE
 * ==========================================
 */

function getWaitingRoom(guild) {

    const channelId =
        process.env.SUPPORT_WAITING_VOICE_ID;

    if (!channelId) {

        throw new Error(
            'SUPPORT_WAITING_VOICE_ID fehlt in der .env.'
        );
    }

    const channel =
        guild.channels.cache.get(
            channelId
        );

    if (
        !channel ||
        channel.type !==
            ChannelType.GuildVoice
    ) {

        throw new Error(
            'Der Support-Warteraum wurde nicht gefunden.'
        );
    }

    return channel;
}


function getTeamRole(guild) {

    const roleId =
        process.env.SUPPORT_TEAM_ROLE_ID;

    if (!roleId) {

        throw new Error(
            'SUPPORT_TEAM_ROLE_ID fehlt in der .env.'
        );
    }

    const role =
        guild.roles.cache.get(
            roleId
        );

    if (!role) {

        throw new Error(
            'Die Support-Team-Rolle wurde nicht gefunden.'
        );
    }

    return role;
}


function getCasesChannel(guild) {

    const channelId =
        process.env.SUPPORT_CASES_CHANNEL_ID;

    if (!channelId) {

        throw new Error(
            'SUPPORT_CASES_CHANNEL_ID fehlt in der .env.'
        );
    }

    const channel =
        guild.channels.cache.get(
            channelId
        );

    if (
        !channel ||
        !channel.isTextBased()
    ) {

        throw new Error(
            'Der Support-Fälle-Kanal wurde nicht gefunden.'
        );
    }

    return channel;
}


function isSupporter(member) {

    const roleId =
        process.env.SUPPORT_TEAM_ROLE_ID;

    return Boolean(

        member &&
        roleId &&
        member.roles.cache.has(
            roleId
        )

    );
}


/*
 * ==========================================
 * MUSIK
 * ==========================================
 */

const musicPlayers =
    new Map();


const musicQueues =
    new Map();


/*
 * ==========================================
 * MUSIKDATEIEN LADEN
 * ==========================================
 */

function getMusicFiles() {

    if (
        !fs.existsSync(
            musicDirectory
        )
    ) {

        fs.mkdirSync(

            musicDirectory,

            {
                recursive: true
            }

        );

        console.log(
            '[SUPPORT MUSIC] assets-Ordner wurde erstellt.'
        );

        return [];
    }


    const files =
        fs.readdirSync(
            musicDirectory
        )
        .filter(
            file =>
                file
                    .toLowerCase()
                    .endsWith('.mp3')
        )
        .map(
            file =>
                path.join(
                    musicDirectory,
                    file
                )
        );


    return files;
}


/*
 * ==========================================
 * PLAYLIST MISCHEN
 * ==========================================
 */

function shuffleArray(array) {

    const shuffled =
        [...array];


    for (
        let i =
            shuffled.length - 1;

        i > 0;

        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );


        [
            shuffled[i],
            shuffled[j]
        ] = [

            shuffled[j],
            shuffled[i]

        ];
    }


    return shuffled;
}


/*
 * ==========================================
 * NEUE MUSIKRUNDE
 * ==========================================
 */

function createMusicQueue() {

    const files =
        getMusicFiles();


    if (
        files.length === 0
    ) {

        console.warn(
            '[SUPPORT MUSIC] Keine MP3-Dateien im assets-Ordner gefunden.'
        );

        return [];
    }


    const shuffled =
        shuffleArray(
            files
        );


    console.log(
        `[SUPPORT MUSIC] Neue Musikrunde mit ${shuffled.length} Song(s) erstellt.`
    );


    return shuffled;
}


/*
 * ==========================================
 * NÄCHSTEN SONG HOLEN
 * ==========================================
 */

function getNextSong(
    guild
) {

    let queue =
        musicQueues.get(
            guild.id
        );


    if (
        !queue ||
        queue.length === 0
    ) {

        queue =
            createMusicQueue();
    }


    if (
        queue.length === 0
    ) {

        return null;
    }


    const song =
        queue.shift();


    musicQueues.set(

        guild.id,

        queue

    );


    return song;
}


/*
 * ==========================================
 * MUSIK STARTEN
 * ==========================================
 */

function startSupportMusic(
    guild,
    connection
) {

    if (!ffmpegPath) {

        console.error(
            '[SUPPORT MUSIC] ffmpeg-static konnte FFmpeg nicht finden.'
        );

        return;
    }


    stopSupportMusic(
        guild
    );


    musicQueues.set(

        guild.id,

        createMusicQueue()

    );


    const firstSong =
        getNextSong(
            guild
        );


    if (!firstSong) {

        console.warn(
            '[SUPPORT MUSIC] Keine MP3-Dateien vorhanden.'
        );

        return;
    }


    const player =
        createAudioPlayer({

            behaviors: {

                noSubscriber:
                    NoSubscriberBehavior.Play

            }

        });


    musicPlayers.set(

        guild.id,

        {
            player,
            connection
        }

    );


    /*
     * AudioPlayer mit der Discord-Voice-Verbindung verbinden.
     */

    connection.subscribe(
        player
    );


    playSong(

        guild,

        player,

        firstSong

    );


    player.on(

        AudioPlayerStatus.Idle,

        () => {

            const current =
                musicPlayers.get(
                    guild.id
                );


            if (
                !current ||
                current.player !==
                    player
            ) {

                return;
            }


            const nextSong =
                getNextSong(
                    guild
                );


            if (!nextSong) {

                console.warn(
                    '[SUPPORT MUSIC] Keine weiteren Songs gefunden.'
                );

                return;
            }


            playSong(

                guild,

                player,

                nextSong

            );

        }

    );


    player.on(

        'error',

        error => {

            console.error(
                '[SUPPORT MUSIC ERROR]',
                error
            );


            setTimeout(
                () => {

                    const current =
                        musicPlayers.get(
                            guild.id
                        );


                    if (
                        !current ||
                        current.player !==
                            player
                    ) {

                        return;
                    }


                    const nextSong =
                        getNextSong(
                            guild
                        );


                    if (
                        nextSong
                    ) {

                        playSong(

                            guild,

                            player,

                            nextSong

                        );

                    }

                },
                1000
            );

        }

    );


    console.log(
        '[SUPPORT MUSIC] Zufällige Musik gestartet.'
    );
}


/*
 * ==========================================
 * SONG ABSPIELEN
 * ==========================================
 */

function playSong(
    guild,
    player,
    songPath
) {

    try {

        if (!fs.existsSync(songPath)) {

            console.warn(
                `[SUPPORT MUSIC] Datei nicht gefunden: ${songPath}`
            );

            return;
        }


        console.log(
            `[SUPPORT MUSIC] Starte: ${path.basename(songPath)}`
        );


        const resource =
            createAudioResource(

                songPath,

                {
                    inputType:
                        StreamType.Arbitrary,

                    inlineVolume:
                        false

                }

            );


        player.play(
            resource
        );


        console.log(
            `[SUPPORT MUSIC] AudioPlayer gestartet: ${path.basename(songPath)}`
        );


    } catch (error) {

        console.error(
            '[SUPPORT MUSIC PLAY ERROR]',
            error
        );

    }
}


/*
 * ==========================================
 * MUSIK STOPPEN
 * ==========================================
 */

function stopSupportMusic(
    guild
) {

    const current =
        musicPlayers.get(
            guild.id
        );


    if (current) {

        try {

            current.player.stop();

        } catch {}

    }


    musicPlayers.delete(
        guild.id
    );


    musicQueues.delete(
        guild.id
    );


    console.log(
        '[SUPPORT MUSIC] Musik gestoppt.'
    );
}


/*
 * ==========================================
 * BOT IN WARTERAUM
 * ==========================================
 */

function joinWaitingRoom(
    guild,
    waitingRoom
) {

    const existing =
        getVoiceConnection(
            guild.id
        );


    if (existing) {

        stopSupportMusic(
            guild
        );

        existing.destroy();
    }


    const connection =
        joinVoiceChannel({

            channelId:
                waitingRoom.id,

            guildId:
                guild.id,

            adapterCreator:
                guild.voiceAdapterCreator,

            selfDeaf:
                true,

            selfMute:
                false

        });


    connection.on(

        'error',

        error => {

            console.error(
                '[SUPPORT VOICE ERROR]',
                error
            );

        }

    );


    const startMusicWhenReady = () => {

        const currentConnection =
            getVoiceConnection(
                guild.id
            );


        if (
            currentConnection !==
            connection
        ) {

            return;
        }


        console.log(
            '[SUPPORT VOICE] Voice-Verbindung ist bereit.'
        );


        startSupportMusic(

            guild,

            connection

        );

    };


    if (
        connection.state.status ===
        'ready'
    ) {

        startMusicWhenReady();

    } else {

        const onStateChange =
            (
                oldState,
                newState
            ) => {

                if (
                    newState.status ===
                    'ready'
                ) {

                    connection.off(
                        'stateChange',
                        onStateChange
                    );


                    startMusicWhenReady();

                }

            };


        connection.on(

            'stateChange',

            onStateChange

        );

    }


    console.log(
        `[SUPPORT] Bot ist Warteraum beigetreten: ${waitingRoom.name}`
    );


    return connection;
}


/*
 * ==========================================
 * BOT AUS WARTERAUM
 * ==========================================
 */

function leaveWaitingRoom(
    guild
) {

    stopSupportMusic(
        guild
    );


    const connection =
        getVoiceConnection(
            guild.id
        );


    if (connection) {

        connection.destroy();

        console.log(
            '[SUPPORT] Bot hat den Warteraum verlassen.'
        );
    }
}


/*
 * ==========================================
 * SUPPORT ÖFFNEN
 * ==========================================
 */

async function openSupport(
    interaction
) {

    if (
        !isSupporter(
            interaction.member
        )
    ) {

        return interaction.reply({

            content:
                '❌ Nur das Support-Team kann den Support öffnen.',

            flags:
                MessageFlags.Ephemeral

        });
    }


    const guild =
        interaction.guild;


    const waitingRoom =
        getWaitingRoom(
            guild
        );


    await waitingRoom.permissionOverwrites.edit(

        guild.roles.everyone,

        {
            Connect: true
        }

    );


    const state =
        loadState();


    state.open =
        true;


    state.guildId =
        guild.id;


    state.waitingRoomId =
        waitingRoom.id;


    saveState(
        state
    );


    joinWaitingRoom(

        guild,

        waitingRoom

    );


    await updatePanel(

        interaction,

        true

    );


    console.log(
        `[SUPPORT] Support geöffnet von ${interaction.user.tag}.`
    );
}


/*
 * ==========================================
 * SUPPORT SCHLIESSEN
 * ==========================================
 */

async function closeSupport(
    interaction
) {

    if (
        !isSupporter(
            interaction.member
        )
    ) {

        return interaction.reply({

            content:
                '❌ Nur das Support-Team kann den Support schließen.',

            flags:
                MessageFlags.Ephemeral

        });
    }


    const guild =
        interaction.guild;


    const waitingRoom =
        getWaitingRoom(
            guild
        );


    await waitingRoom.permissionOverwrites.edit(

        guild.roles.everyone,

        {
            Connect: false
        }

    );


    leaveWaitingRoom(
        guild
    );


    const state =
        loadState();


    state.open =
        false;


    state.waitingUsers =
        {};


    saveState(
        state
    );


    await updatePanel(

        interaction,

        false

    );


    console.log(
        `[SUPPORT] Support geschlossen von ${interaction.user.tag}.`
    );
}


/*
 * ==========================================
 * PANEL AKTUALISIEREN
 * ==========================================
 */

async function updatePanel(
    interaction,
    isOpen
) {

    const components = [

        createSupportPanel(
            isOpen
        )

    ];


    if (
        interaction.message &&
        interaction.message.editable
    ) {

        await interaction.message.edit({

            components,

            flags:
                MessageFlags.IsComponentsV2

        });


        if (
            !interaction.replied &&
            !interaction.deferred
        ) {

            await interaction.deferUpdate();

        }


        return;
    }


    if (
        !interaction.replied &&
        !interaction.deferred
    ) {

        await interaction.reply({

            components,

            flags:
                MessageFlags.IsComponentsV2 |
                MessageFlags.Ephemeral

        });
    }
}


/*
 * ==========================================
 * SUPPORT-FALL PANEL
 * ==========================================
 */

function createCasePanel(
    member,
    waitingSince,
    role
) {

    return new ContainerBuilder()

        .setAccentColor(
            0x5865F2
        )

        .addTextDisplayComponents(

            new TextDisplayBuilder()

                .setContent(

                    [

                        `${role}`,

                        '',

                        '# 🎧 Neuer Support-Fall',

                        '',

                        `👤 **Spieler:** ${member}`,

                        `🕐 **Wartet seit:** <t:${Math.floor(waitingSince / 1000)}:R>`,

                        '',

                        'Ein Spieler wartet im Support-Warteraum.',

                        'Ein Supporter kann den Fall übernehmen.'

                    ].join('\n')

                )

        )

        .addSeparatorComponents(

            new SeparatorBuilder()

                .setSpacing(
                    SeparatorSpacingSize.Small
                )

                .setDivider(
                    true
                )

        )

        .addActionRowComponents(

            new ActionRowBuilder()

                .addComponents(

                    new ButtonBuilder()

                        .setCustomId(
                            `support_take_${member.id}`
                        )

                        .setLabel(
                            'Übernehmen'
                        )

                        .setEmoji(
                            '🎧'
                        )

                        .setStyle(
                            ButtonStyle.Primary
                        )

                )

        );
}


/*
 * ==========================================
 * USER BETRITT WARTERAUM
 * ==========================================
 */

async function handleVoiceJoin(
    oldState,
    newState
) {

    const member =
        newState.member;


    if (!member) {
        return;
    }


    if (
        member.user.bot
    ) {

        return;
    }


    const waitingRoomId =
        process.env.SUPPORT_WAITING_VOICE_ID;


    if (
        newState.channelId !==
        waitingRoomId
    ) {

        return;
    }


    const state =
        loadState();


    if (
        !state.open
    ) {

        return;
    }


    if (
        state.waitingUsers[
            member.id
        ]
    ) {

        return;
    }


    const waitingSince =
        Date.now();


    state.waitingUsers[
        member.id
    ] = {

        joinedAt:
            waitingSince,

        guildId:
            member.guild.id,

        channelId:
            waitingRoomId

    };


    saveState(
        state
    );


    const casesChannel =
        getCasesChannel(
            member.guild
        );


    const role =
        getTeamRole(
            member.guild
        );


    const message =
        await casesChannel.send({

            components: [

                createCasePanel(

                    member,

                    waitingSince,

                    role

                )

            ],

            flags:
                MessageFlags.IsComponentsV2

        });


    state.waitingUsers[
        member.id
    ].caseMessageId =
        message.id;


    state.waitingUsers[
        member.id
    ].caseChannelId =
        casesChannel.id;


    saveState(
        state
    );


    console.log(
        `[SUPPORT] ${member.user.tag} wartet auf Support.`
    );
}


/*
 * ==========================================
 * USER VERLÄSST WARTERAUM
 * ==========================================
 */

async function handleVoiceLeave(
    oldState,
    newState
) {

    const member =
        oldState.member;


    if (!member) {
        return;
    }


    if (
        member.user.bot
    ) {

        return;
    }


    const waitingRoomId =
        process.env.SUPPORT_WAITING_VOICE_ID;


    if (
        oldState.channelId !==
        waitingRoomId
    ) {

        return;
    }


    if (
        newState.channelId ===
        waitingRoomId
    ) {

        return;
    }


    const state =
        loadState();


    const waitingUser =
        state.waitingUsers[
            member.id
        ];


    if (!waitingUser) {

        return;
    }


    delete state.waitingUsers[
        member.id
    ];


    saveState(
        state
    );


    try {

        const casesChannel =
            member.guild.channels.cache.get(
                waitingUser.caseChannelId
            );


        if (
            casesChannel
        ) {

            const caseMessage =
                await casesChannel.messages.fetch(
                    waitingUser.caseMessageId
                );


            if (
                caseMessage
            ) {

                await caseMessage.edit({

                    components: [

                        new ContainerBuilder()

                            .setAccentColor(
                                0x808080
                            )

                            .addTextDisplayComponents(

                                new TextDisplayBuilder()

                                    .setContent(

                                        [

                                            '# 🎧 Support-Fall',

                                            '',

                                            `👤 **Spieler:** ${member}`,

                                            '',

                                            '⚪ Der Spieler wartet nicht mehr im Support-Warteraum.'

                                        ].join('\n')

                                    )

                            )

                    ],

                    flags:
                        MessageFlags.IsComponentsV2

                });

            }
        }

    } catch (error) {

        console.error(
            '[SUPPORT] Fall konnte nicht aktualisiert werden:',
            error.message
        );
    }


    console.log(
        `[SUPPORT] ${member.user.tag} hat den Warteraum verlassen.`
    );
}


/*
 * ==========================================
 * SUPPORT-FALL ÜBERNEHMEN
 * ==========================================
 */

async function takeSupportCase(
    interaction,
    targetUserId
) {

    if (
        !isSupporter(
            interaction.member
        )
    ) {

        return interaction.reply({

            content:
                '❌ Nur das Support-Team kann Support-Fälle übernehmen.',

            flags:
                MessageFlags.Ephemeral

        });
    }


    const guild =
        interaction.guild;


    const supporter =
        interaction.member;


    const supporterChannel =
        supporter.voice.channel;


    if (!supporterChannel) {

        return interaction.reply({

            content:
                '❌ Du musst dich zuerst in einen Support-Voice-Channel begeben.',

            flags:
                MessageFlags.Ephemeral

        });
    }


    if (
        supporterChannel.id ===
        process.env.SUPPORT_WAITING_VOICE_ID
    ) {

        return interaction.reply({

            content:
                '❌ Du kannst einen Fall nicht aus dem Warteraum übernehmen. Bitte gehe in deinen Support-Call.',

            flags:
                MessageFlags.Ephemeral

        });
    }


    const state =
        loadState();


    const waitingUser =
        state.waitingUsers[
            targetUserId
        ];


    if (!waitingUser) {

        return interaction.reply({

            content:
                '❌ Dieser Spieler wartet nicht mehr im Support.',

            flags:
                MessageFlags.Ephemeral

        });
    }


    const target =
        await guild.members.fetch(
            targetUserId
        ).catch(
            () => null
        );


    if (!target) {

        return interaction.reply({

            content:
                '❌ Der Spieler konnte nicht gefunden werden.',

            flags:
                MessageFlags.Ephemeral

        });
    }


    if (
        target.voice.channelId !==
        process.env.SUPPORT_WAITING_VOICE_ID
    ) {

        delete state.waitingUsers[
            targetUserId
        ];


        saveState(
            state
        );


        return interaction.reply({

            content:
                '❌ Der Spieler befindet sich nicht mehr im Warteraum.',

            flags:
                MessageFlags.Ephemeral

        });
    }


    try {

        await target.voice.setChannel(

            supporterChannel,

            'Support-Fall übernommen'

        );

    } catch (error) {

        console.error(
            '[SUPPORT MOVE ERROR]',
            error
        );


        return interaction.reply({

            content:
                '❌ Der Spieler konnte nicht in deinen Support-Channel verschoben werden. Prüfe meine Move-Members-Berechtigung.',

            flags:
                MessageFlags.Ephemeral

        });
    }


    delete state.waitingUsers[
        targetUserId
    ];


    saveState(
        state
    );


    try {

        const casesChannel =
            guild.channels.cache.get(
                waitingUser.caseChannelId
            );


        if (
            casesChannel
        ) {

            const caseMessage =
                await casesChannel.messages.fetch(
                    waitingUser.caseMessageId
                );


            await caseMessage.edit({

                components: [

                    new ContainerBuilder()

                        .setAccentColor(
                            0x57F287
                        )

                        .addTextDisplayComponents(

                            new TextDisplayBuilder()

                                .setContent(

                                    [

                                        '# 🎧 Support-Fall übernommen',

                                        '',

                                        `👤 **Spieler:** ${target}`,

                                        `🎧 **Supporter:** ${supporter}`,

                                        `📍 **Support-Channel:** ${supporterChannel}`,

                                        '',

                                        '🟢 Der Spieler wurde erfolgreich zum Supporter verschoben.'

                                    ].join('\n')

                                )

                        )

                ],

                flags:
                    MessageFlags.IsComponentsV2

            });

        }

    } catch (error) {

        console.error(
            '[SUPPORT CASE UPDATE ERROR]',
            error
        );
    }


    await interaction.reply({

        content:
            `✅ ${target} wurde zu ${supporterChannel} verschoben.`,

        flags:
            MessageFlags.Ephemeral

    });


    console.log(
        `[SUPPORT] ${supporter.user.tag} hat ${target.user.tag} übernommen.`
    );
}


/*
 * ==========================================
 * SUPPORT NACH BOT-NEUSTART
 * ==========================================
 */

async function restoreSupport(
    client
) {

    const state =
        loadState();


    if (
        !state.open
    ) {

        return;
    }


    if (
        !state.guildId
    ) {

        return;
    }


    try {

        const guild =
            await client.guilds.fetch(
                state.guildId
            );


        const waitingRoom =
            getWaitingRoom(
                guild
            );


        await waitingRoom.permissionOverwrites.edit(

            guild.roles.everyone,

            {
                Connect: true
            }

        );


        joinWaitingRoom(

            guild,

            waitingRoom

        );


        console.log(
            '[SUPPORT] Geöffneter Support nach Neustart wiederhergestellt.'
        );

    } catch (error) {

        console.error(
            '[SUPPORT RESTORE ERROR]',
            error
        );
    }
}


/*
 * ==========================================
 * EXPORT
 * ==========================================
 */

module.exports = {

    openSupport,

    closeSupport,

    handleVoiceJoin,

    handleVoiceLeave,

    takeSupportCase,

    restoreSupport,

    isSupporter

};