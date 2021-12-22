# Garden > State

This is what will pull the data via `telnet` and relay it to the [UI](../ui/README.md).

![So Much Storage!](https://media.giphy.com/media/26tk1WuO7IIaSV0je/giphy.gif)

---

## Requirements

Not an exact science yet this originally ran in productio with:

* Debian 10 (Buster)
* Redis 5.0.3
* NodeJS 14.15.5
* npm 6.14.11

While local testing was:

* macOS 11.6 (Big Sur)
* Redis 6.2.4
* NodeJS 14.4.0
* npm 6.14.5

So anything around there should work. Pretty much Linux/FreeBSD along with recent versions of Redis and NodeJS will get
the job done.

## Installing

Just need to run `npm i` to install the always large `node_modules` directory and then you're all set to go.

---

## Commands

There is a very minimal amount of commands to run.

### Install `npm i`

Installs all `node_module` dependencies.

### Start `npm start`

Starts the server at `PORT=5303`

### Start Observing `npm run observer:start`

Will start observing the top 8 boards and filling the Redis queues with the latest moves.

### Start Observing `npm run observer:restart`

Maybe somthing happened to the observers, this will reset them.

### Stop Observing `npm run observer:stop`

The opposite of starting the observers; this stops them.

### Test `npm t`

*TODO(JM): Will look to mock socket.io, SQL, Redis, and the Lichess.org API yet my plate is currently full outside of
this project*
