# Garden

Welcome to our stream overlay for team Garden State Chess Club. Currently we are using this as a `Browser Source` in OBS
to handle all of the match data such as scores, opponents, rounds, and host information.

There is a lot of ground work to utilize the [Lichess.org API](https://lichess.org/api) to stream boards in real-time so
the streamer hosting an event would just have to have the source setup. However, Lichess.org does not return the last 3
moves of a live game so it messes with the clocks a little bit. E.g. the clock on the screen counts down from 30 to 15
seconds because the third move from now took the player 15 seconds to play, however the next move only took 1 second;
this ends up jumping the clock back up to 29 seconds after that third move is played. To compensation, the code waits a
little bit for a game to start as well as the on stream clock freezing until the game clock catches up.

![Would you care for a Segment?](https://media.giphy.com/media/l3q2Ph0I1osaagoQE/giphy.gif)

---

## Directory

* [Admin](./admin/README.md)
* [Common](./common/README.md)
* [State](./state/README.md)
* [Stream](./stream/README.md)

---

## Structure

There are three main components to this project (potentially a fourth, `Observer`). Flow goes from `Admin` to `State` to
`Stream` where all data is updated on the `Admin` side, pushed to `State` which stores data as necessary, and then
pushes relevant data to `Stream`.

### Admin *PORT 4002*

This is a `React.js` app that connects to `State` via `socket.io`. In production mode it relies on `Discord OAuth` to
gain access to the `/admin` endpoint. Locally it will start up as is without the authentication step. In both cases it
will start on port 4002 by default.

For more info: [`Admin` README.md](./admin/README.md)

### State *PORT 4003*

This is a `socket.io` app that uses `Express` as a fallback, otherwise it'll always return 403 in the browser. For
storing data it uses `MariaDB` and `Redis`. `MariaDB` can be substituted with `MySQL` and `MySQL-like` databases and has
a SQL file to execute for setting up the tables: [./state/schema.sql](./state/schema.sql).

For more info: [`State` README.md](./state/README.md)

### Stream *PORT 4004*

Another `React.js` app except this time it's completely static and only consumes data from `State`. No auth needed on
this project so it can just be served via the aptly named `serve`.

For more info: [`Stream` README.md](./stream/README.md)

### Common

This holds our combined config data at: [./common/config/*.json](./common/config) and expects a runtime config to exist
at: `./common/config/runtime.json`. In the runtime you can toss in any overwrites as necessary.

Besides config information, `Common` also holds some common submodules used by the different modules.

For more info: [`Common` README.md](./common/README.md)

---

## Installing `npm i`

Installing this is straightforward with `npm i`. It will pull all the `node_modules` needed by the base package as well
as all of the modules. On top of installing all of the required dependencies it will also generate the `React.js` files
for `Admin` and `Stream`. After installing just running `npm start` will start up a production version.

---

## Running `npm start`, `npm restart`, `npm stop`

Running the finished project relies on using `pm2` to start up `Admin`, `State`, and `Stream` at their respective ports.
Once started they can be accessed from the server at those ports and work in tandem.

---

## Testing

*TODO(JM): I need to figure out the recommended ways to test with `React.js`. It's my first time ever using it.*

---

## Developing

*TODO(JM): Style guide will most likely either be AirBnB or heavily influenced by it.*

---

## Issues

Please send bugs and feature requests via:
[https://github.com/puresalt/garden/issues](https://github.com/puresalt/garden/issues)

---

## Credits

| Contributor     | Email        | Website            |
|-----------------|--------------|--------------------|
| John Mullanaphy | <hi@john.mu> | <https://john.mu/> |

---

## Acknowledgements

* **[States Chess Cup](https://stateschesscup.wordpress.com/)** for creating the league where this overlay is used and
    giving me a reason to finally test out `React.js`
* **[Lichess.org](https://lichess.org)** for open sourcing a bunch of easy to use components.
* **[https://github.com/grantmiiller](grantmiiller)** for some `React.js` insights in real-time when I looked for some
    help or direction.

---

## License

The `Garden` source code is licensed under the Open Software License (OSL 3.0) - see the [./LICENSE](./LICENSE) file for
further details.

---
