# Garden > State

This is our go between for [Admin](../admin/README.md) and [Stream](../stream/README.md) applications. It will receive
data from Admin and store it as necessary in SQL or Redis depending on the data and emit all changes to our Stream. It
will also reply on get requests from both the Admin and Stream to retrieve relevant data.

![So Much Storage!](https://media.giphy.com/media/26tk1WuO7IIaSV0je/giphy.gif)

---

## Installing

Outside of the usual `npm i` there isn't much else to do except for importing [./schema.sql](./schema.sql) into whichever database you
use. The table structure is simple enough that any `MySQL-like` database should be able to handle it although I used
`MariaDB` for my build. Tried to keep the dependencies as simple as possible so Redis is the only other system
dependency.

---

## Commands

There are very minimal amount of commands to run.

### Install `npm i`

Installs all `node_module` dependencies.

### Start `npm start`

Starts the server at `PORT=4003`

### Test `npm t`

*TODO(JM): Will look to mock socket.io, SQL, Redis, and the Lichess.org API yet my plate is currently full outside of
this project*
