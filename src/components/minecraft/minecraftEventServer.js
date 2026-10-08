const http = require('http');

const {
    logMinecraftEvent
} = require('./minecraftLogger');


function startMinecraftEventServer(
    client
) {

    const port =
        Number(
            process.env.MINECRAFT_EVENT_PORT ||
            8082
        );


    const secret =
        process.env.MINECRAFT_BRIDGE_SECRET;


    const server =
        http.createServer(
            async (
                req,
                res
            ) => {

                if (
                    req.method !==
                    'POST'
                ) {

                    res.writeHead(
                        405
                    );

                    return res.end();

                }


                if (
                    req.url !==
                    '/minecraft/event'
                ) {

                    res.writeHead(
                        404
                    );

                    return res.end();

                }


                const authorization =
                    req.headers.authorization;


                if (
                    authorization !==
                    `Bearer ${secret}`
                ) {

                    res.writeHead(
                        401
                    );

                    return res.end(
                        JSON.stringify({
                            error:
                                'Unauthorized'
                        })
                    );

                }


                let body =
                    '';


                req.on(
                    'data',
                    chunk => {
                        body += chunk;
                    }
                );


                req.on(
                    'end',
                    async () => {

                        try {

                            const data =
                                JSON.parse(
                                    body
                                );


                            await logMinecraftEvent(

                                client,

                                {

                                    type:
                                        data.type,

                                    player:
                                        data.player,

                                    message:
                                        data.message

                                }

                            );


                            res.writeHead(

                                200,

                                {
                                    'Content-Type':
                                        'application/json'
                                }

                            );


                            res.end(

                                JSON.stringify({

                                    success:
                                        true

                                })

                            );

                        } catch (error) {

                            console.error(
                                '[MINECRAFT EVENT ERROR]',
                                error
                            );


                            res.writeHead(
                                400
                            );


                            res.end(

                                JSON.stringify({

                                    success:
                                        false,

                                    error:
                                        error.message

                                })

                            );

                        }

                    }
                );

            }
        );


    server.listen(

        port,

        '0.0.0.0',

        () => {

            console.log(
                `[MINECRAFT] Event-Server läuft auf Port ${port}.`
            );

        }

    );


    return server;

}


module.exports = {

    startMinecraftEventServer

};