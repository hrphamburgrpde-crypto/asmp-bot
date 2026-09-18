const { Rcon } = require('rcon-client');

async function sendMinecraftCommand(command) {
    const rcon = await Rcon.connect({
        host: process.env.RCON_HOST,
        port: Number(process.env.RCON_PORT),
        password: process.env.RCON_PASSWORD
    });

    try {
        const response = await rcon.send(command);

        return response;
    } finally {
        await rcon.end();
    }
}

module.exports = {
    sendMinecraftCommand
};