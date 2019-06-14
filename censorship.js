"use strict"

const Matrix = require("matrix-js-sdk")
const Config = require('./config.js')

const USAGE = `Usage: node ./censorship.js <room name> <timeline filter function>

    Redact all events matching the filter from room. Filter is a js
    function that takes a single MatrixEvent.

    Example filter functions:

    me => me.event.type === "m.room.power_levels"
    me => me.event.sender === "@cjb:matrix.org"

    See here for the MatrixEvent API:
    http://matrix-org.github.io/matrix-js-sdk/0.10.7/module-models_event.html
`

async function main(args = process.argv.slice(2)) {
    if (args.length !== 2) {
        console.log(USAGE)
        process.exit(2)
    }

    const roomName = args[0]
    // slightly safer eval.
    const filter = new Function(`return ${args[1]}`)()

    try {
        const client = await getClient()
        const room = await getRoom(client, roomName)
        const { timeline } = await client.scrollback(room, Config.historyLimit)

        // Apply filter function, then also filter events that have already been redacted.
        const toRedact = timeline.filter(filter)
            .filter(me => !('redacted_because' in me.event))

        if (toRedact.length == 0) {
            console.log("No unredacted messages match filter.")
        } else {
            console.log(`Redacting ${toRedact.length} events...`)
            await redactFromTimeline(client, room.roomId, toRedact)
            console.log(`Done`)
        }

        client.stopClient()
        process.exit()
    } catch (e) {
        console.error(e)
        client.stopClient()
        process.exit(1)
    }
}

/**
 * Create a client with the details from config.js
 */
async function getClient() {
    const client = Matrix.createClient({
        baseUrl: 'https://' + Config.userName.split(':')[1],
        accessToken: Config.accessToken,
        userId: Config.userName
    })
    return new Promise((resolve, reject) => {
        client.once('sync', (state, prevState, data) => {
            if (state === 'ERROR') reject(data)
            if (state === 'PREPARED') resolve(client)
        })
        client.startClient()
    })
}

/** get a room from an alias */
async function getRoom(client, name) {
    return client.getRoom((await client.getRoomIdForAlias(name)).room_id)
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * redact all events in toRedact (an iterable of MatrixEvents)
 */
async function redactFromTimeline(client, room, toRedact) {
    let results = []
    for (const mEvent of toRedact) {
        while (true) {
            try {
                results.push(await client.redactEvent(room, mEvent.event.event_id))
                process.stdout.write(`\r${results.length}/${toRedact.length}`)
                break
            } catch (e) {
                process.stdout.write('.')
                await sleep(e.data.retry_after_ms + 100)
            }
        }
    }
    process.stdout.write('\n')
    return results
}

process.on('unhandledRejection', error => {
    console.error('unhandledRejection:', error)
})

main()
