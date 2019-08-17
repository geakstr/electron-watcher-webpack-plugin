## Installation

```shell
npm install electron-watcher-webpack-plugin --save
```

## Usage

Add to `webpack.config.js` plugins array:

```javascript
const path = require("path");
const { ElectronWatcherWebpackPlugin } = require("electron-watcher-webpack-plugin");
// ...
module.exports = {
  // ...
  plugins: [
    // ...
    new ElectronWatcherWebpackPlugin({
      // Absolute path to directory where node_modules placed. Required
      root: __dirname,
      // List of globs to watch for hard reload. Required
      watch: [path.resolve(__dirname, "./src/main")],
      // Launch electron only once. Default: true. Optional
      once: true,
      // Absolute path to nodemon executable. Default: root/node_modules/.bin/nodemon. Optional
      nodemon: path.resolve(__dirname, "node_modules", ".bin", "nodemon"),
      // Absolute path to electron executable. Default: root/node_modules/.bin/electron. Optional
      electron: path.resolve(__dirname, "node_modules", ".bin", "electron"),
      // Options to pass to `spawn` process. Optional
      options: {
        cwd: path.resolve(__dirname, "..")
      }
    }),
    // ...
  ];
  // ...
}
```

And watch files changes inside `main.js`:

```javascript
const { app, BrowserWindow } = require("electron");
// ...
require("electron-watcher-webpack-plugin").watch({
  // List of globs for hard refresh
  hard: [path.resolve(__dirname, "../main")],
  // List of globs for soft refresh
  soft: [path.resolve(__dirname, "../renderer")]
  // Watching enabled only in dev environment, but you can force watching anytime. Default: false. Optional
  forceWatch: false
});
// ...
```
