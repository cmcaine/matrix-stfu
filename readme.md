# Matrix STFU

Spam / Trolling Filtration Utility

![the title says it all](https://raw.github.com/xwiki-labs/matrix-stfu/master/stfu.jpg)

Mass remove everything which was said by a particular user in a particular room.

Now with **censorship** too, in case you have more complex filtering requirements.

## How to use

1. `cp ./config.example.js ./config.js`
2. Edit config.js to make it use your username and access token, you can also change how far into history STFU will search (number of events).
3. `node ./stfu.js <matrix_room_name> <matrix_handle>`

For example, in case cjd is saying silly stuff in the Matrix HQ room, and you're an admin there, you can delete all of it.

    node ./stfu.js '#matrix:matrix.org' '@cjd:matrix.org'

## How to use censorship.js

Steps 1 and 2 as above.

Then `node censorship.js <matrix_room_name> <filter function for each matrix event>`

For example, in case cjd is saying silly stuff in the Matrix HQ room, and you're an admin there, you can delete all of it.

    node censorship.js '#matrix:matrix.org' 'me => me.event.sender === "@cjd:matrix.org"'

Or if people are sharing spoilers and you want to delete all trace:

    node censorship.js '#tridactyl:matrix.org' 'me => me.getContent().body && me.getContent().body.includes("rosebud")'

The function you provide will be used to filter all the events in the room that are not already redacted. Events matching the filter will be redacted by this script.

[Reference for the MatrixEvent class](http://matrix-org.github.io/matrix-js-sdk/2.0.0/module-models_event.html)
