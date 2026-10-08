const {
    PermissionFlagsBits
} = require('discord.js');

async function getOrCreateLevelRole(
    guild,
    level
) {
    const roleName = `Level ${level}`;

    let role = guild.roles.cache.find(
        existingRole =>
            existingRole.name === roleName
    );

    if (role) {
        return role;
    }

    try {
        role = await guild.roles.create({
            name: roleName,
            reason:
                `Automatische Level-Rolle für Level ${level}`
        });

        console.log(
            `[LEVEL] Rolle erstellt: ${roleName}`
        );

        return role;
    } catch (error) {
        console.error(
            `[LEVEL] Rolle ${roleName} konnte nicht erstellt werden:`,
            error
        );

        return null;
    }
}

async function updateLevelRole(
    member,
    level
) {
    if (!member?.guild) {
        return null;
    }

    const guild = member.guild;

    const botMember =
        guild.members.me;

    if (!botMember) {
        return null;
    }

    if (
        !botMember.permissions.has(
            PermissionFlagsBits.ManageRoles
        )
    ) {
        console.error(
            '[LEVEL] Bot besitzt keine ManageRoles-Berechtigung.'
        );

        return null;
    }

    const levelRole =
        await getOrCreateLevelRole(
            guild,
            level
        );

    if (!levelRole) {
        return null;
    }

    /*
     * Alle vorhandenen Level-Rollen entfernen.
     */
    const oldRoles =
        member.roles.cache.filter(
            role =>
                /^Level \d+$/.test(
                    role.name
                )
        );

    for (const role of oldRoles.values()) {
        if (
            role.id === levelRole.id
        ) {
            continue;
        }

        try {
            await member.roles.remove(
                role,
                'Alte Level-Rolle entfernen'
            );
        } catch (error) {
            console.error(
                `[LEVEL] Alte Rolle ${role.name} konnte nicht entfernt werden:`,
                error
            );
        }
    }

    /*
     * Neue Level-Rolle vergeben.
     */
    try {
        if (
            !member.roles.cache.has(
                levelRole.id
            )
        ) {
            await member.roles.add(
                levelRole,
                `Level ${level} erreicht`
            );
        }
    } catch (error) {
        console.error(
            `[LEVEL] Level-Rolle ${level} konnte nicht vergeben werden:`,
            error
        );
    }

    return levelRole;
}

module.exports = {
    getOrCreateLevelRole,
    updateLevelRole
};