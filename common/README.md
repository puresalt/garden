# Garden > Common

This is our local storage for config files, look up lists, and shared code for the other modules.

![Helps to find common ground!](https://media.giphy.com/media/fYpxZDUh47g0haTGsr/giphy.gif)

---

## Config

This is the only real thing that needs to be touched. It holds all of our environments and their respective data.
Starting with [./config/default.json](./config/default.json) the values will then be overwritten by either 
[./config/development.json](./config/development.json) or [./config/production.json](./config/production.json)
depending on `process.env.NODE_ENV`; if it is set to `production` or `prod` it will use the associated production file
otherwise default to development. After that it will then overwrite the combined config with
[./config/runtime.json](./config/runtime.json) which is for all data that shouldn't be stored in a repo such as private
keys. Finally, in a similar fashion to the runtime.json, config can be overwritten by `process.env.GARDEN_CONFIG` which
if it exists expects the data to be in a JSON format.

---

## Source

There is [./react](./react) for shared `React.js` components between [Admin]() and [Stream](). In particular the
[Chessground](./react/Chessboard.js) component is defined here for creating our interactive chessboards. The other
source folder of interest is [./src](./src) which exposes data lookups, config, and helper functions for all of the
other modules.

---

## Commands

Nothing, this is a dependency for the other modules and source is use as needed.
