# Garden > Site

Just like our [Stream](../stream/README.md) overlay this just consumes data from [State](../state/README.md) and all of
the app content is a statically served React.js app. There are some extra models in relation to team info, match recaps,
and such nots.

![Increment that counter](https://media.giphy.com/media/xT5LMtFslKagWEgpbO/giphy.gif)

---

## Endpoints

There are two main endpoints, each with an alias to a shorthand for the most recent match.

### Index `/`

Like all indexes, has a bit of everything at a glance.

### Board Highlight `/match/:matchId/board/:boardNumber`, `/board/:boardNumber`

Just like the case with [Full Match](#full-match-matchmatchid-) the shorthand `/board/:boardNumber` will apply to the
most recent match. When a `:boardNumber` is supplied it will focus on one of the four boards in full size and hide the
other three (pending a new design).

---

## Commands

Commands are all the base `React.js` commands, just that `npm start` adds `PORT=4004` as a prefix. For more information
please refer to: <https://create-react-app.dev/docs/available-scripts/>

### Install `npm i`

Installs all `node_module` dependencies as well as runs `npm run build` to create the `./build` directory and final app.

### Build `npm run build`

Builds the `React.js` app into `./build`.

### Start `npm start`

Starts the development server for the project. This utilizes the `React.js` watch functionality so as files are edited
on the fly they will be reflected in the browser.

### Test `npm t`

*TODO(JM): Need to learn more about unit testing in `React.js`*

### Eject `npm run eject`

This is non-reversible (mostly) and will eject all of the code outside of build environment.
