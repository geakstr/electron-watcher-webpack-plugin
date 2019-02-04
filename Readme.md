## Installation

```shell
npm install electron-watcher-webpack-plugin --save-dev
```

## Usage

Add to webpack config plugins array:

```javascript
const path = require("path");
const ElectronWatcherWebpackPlugin = require("electron-watcher-webpack-plugin");
// ...
module.exports = {
  // ...
  plugins: [
    // ...
    new ElectronWatcherWebpackPlugin({
      // absolute path to electron main process file (required)
      main: path.resolve(__dirname, "src/main.js"),
      // absolute path to electron (required)
      electron: path.resolve(__dirname, "./node_modules/.bin/electron"),
      // skip renderers processes (optional)
      // for example when serve renderer pages with webpack-dev-server
      skipRenderer: false,
      // debug logs (optional)
      debug: false
    }),
    // ...
  ];
  // ...
}
```
