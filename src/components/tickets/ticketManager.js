const fs = require('fs');
const path = require('path');

const {
    ChannelType,
    PermissionFlagsBits,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize
} = require('discord.js');

const createTicketView =
    require('./ticketView');

const createPriorityPanel =
    require('./ticketPriority');

const createFeedbackView =
    require('./feedbackView');

const dataDirectory = path.join(
    __dirname,
    '../../../data'
);

const ticketsFile = path.join(
    dataDirectory,
    'tickets.json'
);

const feedbackFile = path.join(
    dataDirectory,
    'feedback.json'
);

const ticketTypes = {
    support: {
        name: 'support',
        label: 'Support'
    },

    technical: {
        name: 'technical',
        label: 'Technischer Support'
    },

    report: {
        name: 'report',
        label: 'Spieler melden'
    }
};

const priorities = {
    high: {
        level: 3,
        emoji: '🔴',
        label: 'Hoch'
    },

    medium: {
        level: 2,
        emoji: '🟡',
        label: 'Mittel'
    },

    low: {
        level: 1,
        emoji: '🟢',
        label: 'Niedrig'
    }
};


/*
 * ==============================
 * DATEI-SYSTEM
 * ==============================
 */

function ensureDataDirectory() {
    if (!fs.existsSync(dataDirectory)) {
        fs.mkdirSync(dataDirectory, {
            recursive: true
        });
    }
}

function loadTickets() {
    ensureDataDirectory();

    if (!fs.existsSync(ticketsFile)) {
        return {};
    }

    try {
        return JSON.parse(
            fs.readFileSync(
                ticketsFile,
                'utf8'
            )
        );
    } catch (error) {
        console.error(
            '[TICKETS] tickets.json konnte nicht gelesen werden:',
            error
        );

        return {};
    }
}

function saveTickets(tickets) {
    ensureDataDirectory();

    fs.writeFileSync(
        ticketsFile,
        JSON.stringify(
            tickets,
            null,
            4
        )
    );
}

function loadFeedback() {
    ensureDataDirectory();

    if (!fs.existsSync(feedbackFile)) {
        return {};
    }

    try {
        return JSON.parse(
            fs.readFileSync(
                feedbackFile,
                'utf8'
            )
        );
    } catch (error) {
        console.error(
            '[FEEDBACK] feedback.json konnte nicht gelesen werden:',
            error
        );

        return {};
    }
}

function saveFeedback(feedback) {
    ensureDataDirectory();

    fs.writeFileSync(
        feedbackFile,
        JSON.stringify(
            feedback,
            null,
            4
        )
    );
}

function getTicketData(channelId) {
    const tickets = loadTickets();

    return tickets[channelId] || null;
}

function saveTicketData(
    channelId,
    data
) {
    const tickets = loadTickets();

    tickets[channelId] = {
        ...tickets[channelId],
        ...data
    };

    saveTickets(tickets);
}

function deleteTicketData(channelId) {
    const tickets = loadTickets();

    delete tickets[channelId];

    saveTickets(tickets);
}


/*
 * ==============================
 * HILFSFUNKTIONEN
 * ==============================
 */

function isSupportMember(interaction) {
    const supportRoleId =
        process.env.TICKET_SUPPORT_ROLE_ID;

    if (!supportRoleId) {
        return false;
    }

    return interaction.member.roles.cache.has(
        supportRoleId
    );
}

function getPriorityEmoji(priority) {
    return (
        priorities[priority]?.emoji ||
        priorities.medium.emoji
    );
}

function getPriorityLevel(priority) {
    return (
        priorities[priority]?.level ||
        priorities.medium.level
    );
}


/*
 * ==============================
 * TICKET SORTIERUNG
 * ==============================
 */

async function reorderTickets(
    guild,
    categoryId
) {
    const category =
        guild.channels.cache.get(
            categoryId
        );

    if (!category) {
        return;
    }

    const tickets =
        category.children.cache
            .filter(channel =>
                channel.type ===
                    ChannelType.GuildText &&
                channel.topic?.startsWith(
                    'ticket:'
                )
            )
            .map(channel => ({
                channel,

                priority:
                    getPriorityLevel(
                        getTicketData(
                            channel.id
                        )?.priority ||
                        'medium'
                    )
            }))
            .sort((a, b) => {

                if (
                    b.priority !==
                    a.priority
                ) {
                    return (
                        b.priority -
                        a.priority
                    );
                }

                return (
                    a.channel.rawPosition -
                    b.channel.rawPosition
                );
            });

    if (!tickets.length) {
        return;
    }

    const positions =
        tickets.map(
            (ticket, index) => ({
                channel:
                    ticket.channel.id,

                position:
                    index
            })
        );

    await guild.channels.setPositions(
        positions
    );
}


/*
 * ==============================
 * TICKET-NACHRICHT AKTUALISIEREN
 * ==============================
 */

async function updateTicketMessage(
    channel,
    user,
    type,
    claimedBy,
    closed,
    priority
) {
    const messages =
        await channel.messages.fetch({
            limit: 100
        });

    const botUser =
        channel.client.user;

    const botMessages =
        messages
            .filter(message =>
                message.author.id ===
                    botUser.id &&
                message.components.length > 0
            )
            .sort(
                (a, b) =>
                    a.createdTimestamp -
                    b.createdTimestamp
            );

    const botMessage =
        botMessages.first();

    if (!botMessage) {
        return channel.send({
            components: [
                createTicketView(
                    user,
                    type,
                    claimedBy,
                    closed,
                    priority
                )
            ],
            flags:
                MessageFlags.IsComponentsV2
        });
    }

    await botMessage.edit({
        components: [
            createTicketView(
                user,
                type,
                claimedBy,
                closed,
                priority
            )
        ],
        flags:
            MessageFlags.IsComponentsV2
    });

    return botMessage;
}


/*
 * ==============================
 * FEEDBACK-REQUEST SPEICHERN
 * ==============================
 */

function getFeedbackData(ticketId) {
    const feedback =
        loadFeedback();

    return feedback[ticketId] || null;
}

function saveFeedbackRequest(
    ticketId,
    data
) {
    const feedback =
        loadFeedback();

    feedback[ticketId] = {
        ...feedback[ticketId],
        ...data
    };

    saveFeedback(feedback);
}


/*
 * ==============================
 * FEEDBACK-DM
 * ==============================
 */

async function sendFeedbackRequest(
    user,
    channel,
    claimedBy
) {
    const existing =
        getFeedbackData(
            channel.id
        );

    /*
     * Bereits Feedback abgegeben?
     */

    if (
        existing?.submitted
    ) {
        console.log(
            `[FEEDBACK] ${channel.name} wurde bereits bewertet.`
        );

        return;
    }

    /*
     * Bereits Bewertungsanfrage gesendet?
     */

    if (
        existing?.feedbackMessageId
    ) {
        console.log(
            `[FEEDBACK] Bewertungsanfrage für ${channel.name} existiert bereits.`
        );

        return;
    }

    const claimedText =
        claimedBy
            ? claimedBy
            : null;

    try {

        const feedbackMessage =
            await user.send({
                components: [
                    createFeedbackView(
                        channel.id,
                        channel.name,
                        claimedText,
                        false
                    )
                ],
                flags:
                    MessageFlags.IsComponentsV2
            });

        saveFeedbackRequest(
            channel.id,
            {
                ownerId:
                    user.id,

                ticketName:
                    channel.name,

                claimedById:
                    claimedBy?.id ||
                    null,

                claimedByTag:
                    claimedBy?.tag ||
                    'Niemand',

                feedbackMessageId:
                    feedbackMessage.id,

                submitted:
                    false,

                createdAt:
                    Date.now()
            }
        );

        console.log(
            `[FEEDBACK] Bewertungsanfrage an ${user.tag} gesendet.`
        );

    } catch (error) {

        console.error(
            `[FEEDBACK] DM an ${user.tag} konnte nicht gesendet werden:`,
            error.message
        );
    }
}


/*
 * ==============================
 * TICKET ERSTELLEN
 * ==============================
 */

async function createTicket(
    interaction,
    type
) {
    const guild =
        interaction.guild;

    const user =
        interaction.user;

    const categoryId =
        process.env.TICKET_CATEGORY_ID;

    const supportRoleId =
        process.env.TICKET_SUPPORT_ROLE_ID;

    if (
        !categoryId ||
        !supportRoleId
    ) {
        throw new Error(
            'TICKET_CATEGORY_ID oder TICKET_SUPPORT_ROLE_ID fehlt in der .env.'
        );
    }

    const category =
        guild.channels.cache.get(
            categoryId
        );

    if (
        !category ||
        category.type !==
            ChannelType.GuildCategory
    ) {
        throw new Error(
            'Die TICKET_CATEGORY_ID ist ungültig.'
        );
    }

    const supportRole =
        guild.roles.cache.get(
            supportRoleId
        );

    if (!supportRole) {
        throw new Error(
            'Die TICKET_SUPPORT_ROLE_ID wurde nicht gefunden.'
        );
    }

    const existingTicket =
        guild.channels.cache.find(
            channel =>
                channel.type ===
                    ChannelType.GuildText &&
                channel.topic ===
                    `ticket:${user.id}`
        );

    if (existingTicket) {
        return interaction.reply({
            content:
                `❌ Du hast bereits ein Ticket: ${existingTicket}`,
            flags:
                MessageFlags.Ephemeral
        });
    }

    const ticketType =
        ticketTypes[type] ||
        ticketTypes.support;

    const username =
        user.username
            .toLowerCase()
            .replace(
                /[^a-z0-9-]/g,
                ''
            )
            .slice(0, 40);

    const channelName =
        `${priorities.medium.emoji}-${ticketType.name}-${username}`;

    const channel =
        await guild.channels.create({
            name: channelName,

            type: ChannelType.GuildText,

            parent: category.id,

            topic:
                `ticket:${user.id}`,

            permissionOverwrites: [
                {
                    id:
                        guild.roles
                            .everyone.id,

                    deny: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory
                    ]
                },

                {
                    id: user.id,

                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.AttachFiles
                    ]
                },

                {
                    id: supportRole.id,

                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.AttachFiles,
                        PermissionFlagsBits.ManageMessages
                    ]
                }
            ]
        });

    saveTicketData(
        channel.id,
        {
            ownerId:
                user.id,

            type,

            priority:
                'medium',

            claimedBy:
                null,

            closed:
                false,

            createdAt:
                Date.now()
        }
    );

    await channel.send({
        components: [
            createTicketView(
                user,
                type,
                null,
                false,
                'medium'
            )
        ],
        flags:
            MessageFlags.IsComponentsV2
    });

    await interaction.reply({
        content:
            `✅ Dein Ticket wurde erstellt: ${channel}`,
        flags:
            MessageFlags.Ephemeral
    });

    await reorderTickets(
        guild,
        category.id
    );

    console.log(
        `[TICKET] ${channel.name} erstellt für ${user.tag}.`
    );
}


/*
 * ==============================
 * PRIORITÄT
 * ==============================
 */

async function showPriorityPanel(
    interaction
) {
    if (!isSupportMember(interaction)) {
        return interaction.reply({
            content:
                '❌ Nur das Support-Team kann die Priorität ändern.',
            flags:
                MessageFlags.Ephemeral
        });
    }

    const data =
        getTicketData(
            interaction.channel.id
        );

    if (!data) {
        return interaction.reply({
            content:
                '❌ Ticket-Daten wurden nicht gefunden.',
            flags:
                MessageFlags.Ephemeral
        });
    }

    await interaction.reply({
        components: [
            createPriorityPanel(
                data.priority ||
                'medium'
            )
        ],
        flags:
            MessageFlags.IsComponentsV2 |
            MessageFlags.Ephemeral
    });
}

async function setTicketPriority(
    interaction,
    priority
) {
    if (!isSupportMember(interaction)) {
        return interaction.reply({
            content:
                '❌ Nur das Support-Team kann die Priorität ändern.',
            flags:
                MessageFlags.Ephemeral
        });
    }

    if (!priorities[priority]) {
        return interaction.reply({
            content:
                '❌ Ungültige Priorität.',
            flags:
                MessageFlags.Ephemeral
        });
    }

    const channel =
        interaction.channel;

    const data =
        getTicketData(
            channel.id
        );

    if (!data) {
        return interaction.reply({
            content:
                '❌ Ticket-Daten wurden nicht gefunden.',
            flags:
                MessageFlags.Ephemeral
        });
    }

    const owner =
        await interaction.client.users.fetch(
            data.ownerId
        );

    const claimedBy =
        data.claimedBy
            ? await interaction.client.users.fetch(
                data.claimedBy
            )
            : null;

    saveTicketData(
        channel.id,
        {
            priority
        }
    );

    const baseName =
        channel.name.replace(
            /^(🔴|🟡|🟢)-/,
            ''
        );

    await channel.setName(
        `${getPriorityEmoji(priority)}-${baseName}`
    );

    await updateTicketMessage(
        channel,
        owner,
        data.type,
        claimedBy,
        data.closed || false,
        priority
    );

    await reorderTickets(
        interaction.guild,
        process.env.TICKET_CATEGORY_ID
    );

    await interaction.update({
        components: [
            createPriorityPanel(
                priority
            )
        ],
        flags:
            MessageFlags.IsComponentsV2 |
            MessageFlags.Ephemeral
    });
}


/*
 * ==============================
 * CLAIM
 * ==============================
 */

async function claimTicket(
    interaction
) {
    if (!isSupportMember(interaction)) {
        return interaction.reply({
            content:
                '❌ Nur das Support-Team kann Tickets übernehmen.',
            flags:
                MessageFlags.Ephemeral
        });
    }

    const channel =
        interaction.channel;

    const data =
        getTicketData(
            channel.id
        );

    if (!data) {
        return interaction.reply({
            content:
                '❌ Ticket-Daten wurden nicht gefunden.',
            flags:
                MessageFlags.Ephemeral
        });
    }

    if (data.closed) {
        return interaction.reply({
            content:
                '❌ Dieses Ticket ist geschlossen.',
            flags:
                MessageFlags.Ephemeral
        });
    }

    if (data.claimedBy) {
        return interaction.reply({
            content:
                '❌ Dieses Ticket wurde bereits übernommen.',
            flags:
                MessageFlags.Ephemeral
        });
    }

    saveTicketData(
        channel.id,
        {
            claimedBy:
                interaction.user.id
        }
    );

    const owner =
        await interaction.client.users.fetch(
            data.ownerId
        );

    await updateTicketMessage(
        channel,
        owner,
        data.type,
        interaction.user,
        false,
        data.priority ||
            'medium'
    );

    await interaction.reply({
        content:
            `👤 ${interaction.user} hat das Ticket übernommen.`
    });
}


/*
 * ==============================
 * SCHLIESSEN
 * ==============================
 */

async function closeTicket(
    interaction
) {
    if (!isSupportMember(interaction)) {
        return interaction.reply({
            content:
                '❌ Nur das Support-Team kann Tickets schließen.',
            flags:
                MessageFlags.Ephemeral
        });
    }

    const channel =
        interaction.channel;

    const data =
        getTicketData(
            channel.id
        );

    if (!data) {
        return interaction.reply({
            content:
                '❌ Ticket-Daten wurden nicht gefunden.',
            flags:
                MessageFlags.Ephemeral
        });
    }

    if (data.closed) {
        return interaction.reply({
            content:
                '❌ Dieses Ticket ist bereits geschlossen.',
            flags:
                MessageFlags.Ephemeral
        });
    }

    /*
     * Ersteller sperren.
     */

    await channel.permissionOverwrites.edit(
        data.ownerId,
        {
            ViewChannel: false,
            SendMessages: false,
            ReadMessageHistory: false
        }
    );

    /*
     * Ticket schließen.
     */

    saveTicketData(
        channel.id,
        {
            closed:
                true
        }
    );

    const owner =
        await interaction.client.users.fetch(
            data.ownerId
        );

    const claimedBy =
        data.claimedBy
            ? await interaction.client.users.fetch(
                data.claimedBy
            )
            : null;

    /*
     * Ticket-Panel aktualisieren.
     */

    await updateTicketMessage(
        channel,
        owner,
        data.type,
        claimedBy,
        true,
        data.priority ||
            'medium'
    );

    await interaction.reply({
        content:
            '🔒 Das Ticket wurde geschlossen.'
    });

    /*
     * Bewertungsanfrage senden.
     */

    await sendFeedbackRequest(
        owner,
        channel,
        claimedBy
    );
}


/*
 * ==============================
 * WIEDER ÖFFNEN
 * ==============================
 */

async function reopenTicket(
    interaction
) {
    if (!isSupportMember(interaction)) {
        return interaction.reply({
            content:
                '❌ Nur das Support-Team kann Tickets wieder öffnen.',
            flags:
                MessageFlags.Ephemeral
        });
    }

    const channel =
        interaction.channel;

    const data =
        getTicketData(
            channel.id
        );

    if (!data) {
        return interaction.reply({
            content:
                '❌ Ticket-Daten wurden nicht gefunden.',
            flags:
                MessageFlags.Ephemeral
        });
    }

    if (!data.closed) {
        return interaction.reply({
            content:
                '❌ Dieses Ticket ist bereits geöffnet.',
            flags:
                MessageFlags.Ephemeral
        });
    }

    await channel.permissionOverwrites.edit(
        data.ownerId,
        {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
            AttachFiles: true
        }
    );

    saveTicketData(
        channel.id,
        {
            closed:
                false
        }
    );

    const owner =
        await interaction.client.users.fetch(
            data.ownerId
        );

    const claimedBy =
        data.claimedBy
            ? await interaction.client.users.fetch(
                data.claimedBy
            )
            : null;

    await updateTicketMessage(
        channel,
        owner,
        data.type,
        claimedBy,
        false,
        data.priority ||
            'medium'
    );

    await reorderTickets(
        interaction.guild,
        process.env.TICKET_CATEGORY_ID
    );

    await interaction.reply({
        content:
            '🔓 Das Ticket wurde wieder geöffnet.'
    });
}


/*
 * ==============================
 * LÖSCHEN
 * ==============================
 */

async function deleteTicket(
    interaction
) {
    if (!isSupportMember(interaction)) {
        return interaction.reply({
            content:
                '❌ Nur das Support-Team kann Tickets löschen.',
            flags:
                MessageFlags.Ephemeral
        });
    }

    const channel =
        interaction.channel;

    const data =
        getTicketData(
            channel.id
        );

    if (!data) {
        return interaction.reply({
            content:
                '❌ Ticket-Daten wurden nicht gefunden.',
            flags:
                MessageFlags.Ephemeral
        });
    }

    await interaction.reply({
        content:
            '🗑️ Ticket wird in 5 Sekunden gelöscht.'
    });

    setTimeout(
        async () => {

            try {

                deleteTicketData(
                    channel.id
                );

                await channel.delete(
                    'Ticket wurde vom Support gelöscht.'
                );

            } catch (error) {

                console.error(
                    '[TICKET DELETE ERROR]',
                    error
                );

            }

        },
        5000
    );
}


/*
 * ==============================
 * FEEDBACK ABSENDEN
 * ==============================
 */

async function submitFeedback(
    interaction,
    stars,
    ticketId,
    comment
) {
    const feedbackChannelId =
        process.env.FEEDBACK_CHANNEL_ID;

    if (!feedbackChannelId) {
        throw new Error(
            'FEEDBACK_CHANNEL_ID fehlt in der .env.'
        );
    }

    /*
     * Feedback-Daten laden.
     */

    const feedback =
        loadFeedback();

    const existing =
        feedback[ticketId];

    /*
     * Sicherheitsprüfung:
     * Existiert dieses Feedback bereits?
     */

    if (
        existing?.submitted
    ) {
        return interaction.reply({
            content:
                '❌ Für dieses Ticket wurde bereits eine Bewertung abgegeben.',
            flags:
                MessageFlags.Ephemeral
        });
    }

    /*
     * Prüfen, ob der User der
     * ursprüngliche Ersteller ist.
     */

    if (
        existing?.ownerId &&
        existing.ownerId !==
            interaction.user.id
    ) {
        return interaction.reply({
            content:
                '❌ Du kannst dieses Ticket nicht bewerten.',
            flags:
                MessageFlags.Ephemeral
        });
    }

    const feedbackChannel =
        await interaction.client.channels.fetch(
            feedbackChannelId
        );

    if (
        !feedbackChannel ||
        !feedbackChannel.isTextBased()
    ) {
        throw new Error(
            'Der Feedback-Channel wurde nicht gefunden.'
        );
    }

    const starsText =
        '⭐'.repeat(stars);

    const cleanComment =
        comment?.trim()
            ? comment.trim()
            : 'Kein Kommentar angegeben.';

    const claimedByText =
        existing?.claimedByTag &&
        existing.claimedByTag !==
            'Niemand'
            ? existing.claimedByTag
            : 'Niemand';

    /*
     * Feedback im Feedback-Channel.
     */

    const feedbackContainer =
        new ContainerBuilder()
            .setAccentColor(
                stars >= 4
                    ? 0x57F287
                    : stars === 3
                        ? 0xFEE75C
                        : 0xED4245
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        [
                            '# ⭐ Neues Ticket-Feedback',
                            '',
                            `**Bewertung:** ${starsText} (${stars}/5)`,
                            `**Benutzer:** ${interaction.user}`,
                            `**Benutzer-ID:** \`${interaction.user.id}\``,
                            '',
                            `🎫 **Ticket:** ${existing?.ticketName || 'Unbekannt'}`,
                            `👤 **Übernommen von:** ${claimedByText}`,
                            '',
                            '**Kommentar:**',
                            cleanComment
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
                        `-# Feedback eingereicht am <t:${Math.floor(Date.now() / 1000)}:F>`
                    )
            );

    await feedbackChannel.send({
        components: [
            feedbackContainer
        ],
        flags:
            MessageFlags.IsComponentsV2
    });

    /*
     * Feedback als abgeschlossen speichern.
     */

    feedback[ticketId] = {
        ...existing,

        submitted:
            true,

        stars,

        comment:
            cleanComment,

        submittedBy:
            interaction.user.id,

        submittedAt:
            Date.now()
    };

    saveFeedback(
        feedback
    );

    /*
     * Bewertungs-DM deaktivieren.
     */

    if (
        existing?.feedbackMessageId
    ) {

        try {

            const dmChannel =
                interaction.channel;

            const originalMessage =
                await dmChannel.messages.fetch(
                    existing.feedbackMessageId
                );

            await originalMessage.edit({
                components: [
                    createFeedbackView(
                        ticketId,
                        existing.ticketName ||
                            'Unbekannt',
                        existing.claimedByTag &&
                            existing.claimedByTag !==
                                'Niemand'
                            ? existing.claimedByTag
                            : null,
                        true
                    )
                ],
                flags:
                    MessageFlags.IsComponentsV2
            });

        } catch (error) {

            console.error(
                '[FEEDBACK] Bewertungsnachricht konnte nicht deaktiviert werden:',
                error.message
            );
        }
    }

    /*
     * Bestätigung an den User.
     */

    await interaction.reply({
        content:
            '✅ Vielen Dank für dein Feedback! Du hast dieses Ticket bereits bewertet.',
        flags:
            MessageFlags.Ephemeral
    });

    console.log(
        `[FEEDBACK] ${interaction.user.tag}: ${stars}/5 | Ticket ${ticketId}`
    );
}


/*
 * ==============================
 * EXPORT
 * ==============================
 */

module.exports = {
    createTicket,
    showPriorityPanel,
    setTicketPriority,
    claimTicket,
    closeTicket,
    reopenTicket,
    deleteTicket,
    submitFeedback
};