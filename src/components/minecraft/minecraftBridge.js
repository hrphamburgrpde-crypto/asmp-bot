const http = require('http');
const https = require('https');


/*
 * ==========================================
 * MINECRAFT BRIDGE
 * ==========================================
 */

function isMinecraftEnabled() {

    return (
        String(
            process.env.MINECRAFT_ENABLED
        ).toLowerCase() === 'true'
    );

}


function getBridgeUrl() {

    return process.env.MINECRAFT_BRIDGE_URL;

}


function getSecret() {

    return process.env.MINECRAFT_BRIDGE_SECRET;

}


/*
 * ==========================================
 * HTTP REQUEST
 * ==========================================
 */

function request(
    method,
    endpoint,
    body = null
) {

    return new Promise(
        (resolve, reject) => {

            const baseUrl =
                getBridgeUrl();


            if (!baseUrl) {

                const error =
                    new Error(
                        'MINECRAFT_BRIDGE_URL fehlt in der .env.'
                    );

                error.code =
                    'MC-BRIDGE-CONFIG';

                return reject(error);

            }


            const secret =
                getSecret();


            if (!secret) {

                const error =
                    new Error(
                        'MINECRAFT_BRIDGE_SECRET fehlt in der .env.'
                    );

                error.code =
                    'MC-BRIDGE-SECRET';

                return reject(error);

            }


            let url;

            try {

                url =
                    new URL(
                        endpoint,
                        baseUrl
                    );

            } catch {

                const error =
                    new Error(
                        'Ungültige Minecraft-Bridge-URL.'
                    );

                error.code =
                    'MC-BRIDGE-URL';

                return reject(error);

            }


            const payload =
                body
                    ? JSON.stringify(body)
                    : '';


            const client =
                url.protocol === 'https:'
                    ? https
                    : http;


            const req =
                client.request(

                    url,

                    {

                        method,

                        headers: {

                            Authorization:
                                `Bearer ${secret}`,

                            'Content-Type':
                                'application/json',

                            'Content-Length':
                                Buffer.byteLength(
                                    payload
                                )

                        },

                        timeout:
                            10000

                    },

                    response => {

                        let data = '';


                        response.on(
                            'data',
                            chunk => {

                                data +=
                                    chunk.toString();

                            }
                        );


                        response.on(
                            'end',
                            () => {

                                let result = {};


                                try {

                                    result =
                                        data
                                            ? JSON.parse(data)
                                            : {};

                                } catch {

                                    result = {
                                        raw: data
                                    };

                                }


                                if (
                                    response.statusCode >= 200 &&
                                    response.statusCode < 300
                                ) {

                                    resolve(result);

                                    return;

                                }


                                const error =
                                    new Error(

                                        result.error ||
                                        result.message ||
                                        `Minecraft Bridge HTTP ${response.statusCode}`

                                    );


                                error.code =
                                    result.code ||
                                    `MC-BRIDGE-${response.statusCode}`;


                                error.statusCode =
                                    response.statusCode;


                                reject(error);

                            }
                        );

                    }

                );


            req.on(
                'error',
                error => {

                    error.code =
                        error.code ||
                        'MC-BRIDGE-CONNECTION';

                    reject(error);

                }
            );


            req.on(
                'timeout',
                () => {

                    req.destroy();


                    const error =
                        new Error(
                            'Minecraft Bridge antwortet nicht.'
                        );

                    error.code =
                        'MC-BRIDGE-TIMEOUT';


                    reject(error);

                }
            );


            if (payload) {

                req.write(payload);

            }


            req.end();

        }
    );

}


/*
 * ==========================================
 * MINECRAFT COMMAND
 * ==========================================
 */

async function executeMinecraftCommand(
    command
) {

    if (
        !isMinecraftEnabled()
    ) {

        const error =
            new Error(
                'Minecraft-System ist deaktiviert.'
            );

        error.code =
            'MC-DISABLED';

        throw error;

    }


    return request(
        'POST',
        '/command',
        {
            command
        }
    );

}


/*
 * ==========================================
 * SPIELER INFORMATIONEN
 * ==========================================
 *
 * Erwarteter Bridge-Endpoint:
 *
 * GET /player/baum
 *
 * oder:
 *
 * GET /player/UUID
 *
 * ==========================================
 */

async function getMinecraftPlayer(
    player
) {

    if (
        !isMinecraftEnabled()
    ) {

        const error =
            new Error(
                'Minecraft-System ist deaktiviert.'
            );

        error.code =
            'MC-DISABLED';

        throw error;

    }


    if (!player) {

        const error =
            new Error(
                'Kein Minecraft-Spieler angegeben.'
            );

        error.code =
            'MC-PLAYER-EMPTY';

        throw error;

    }


    const encodedPlayer =
        encodeURIComponent(
            String(player).trim()
        );


    return request(
        'GET',
        `/player/${encodedPlayer}`
    );

}


/*
 * ==========================================
 * MINECRAFT STATUS
 * ==========================================
 */

async function getMinecraftStatus() {

    if (
        !isMinecraftEnabled()
    ) {

        return {

            enabled: false,

            online: false

        };

    }


    try {

        return await request(
            'GET',
            '/status'
        );

    } catch (error) {

        return {

            enabled: true,

            online: false,

            error:
                error.message,

            code:
                error.code

        };

    }

}


/*
 * ==========================================
 * EXPORT
 * ==========================================
 */

module.exports = {

    isMinecraftEnabled,

    executeMinecraftCommand,

    getMinecraftPlayer,

    getMinecraftStatus

};