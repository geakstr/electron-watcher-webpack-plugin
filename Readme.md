## Installation

```shell
npm install electron-watcher-webpack-plugin --save-dev
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
      // Absolute path to project root (where package.json placed). Required
      electron: path.resolve(__dirname, "./node_modules/.bin/electron"),
      // Absolute path to electron main process directory or file. Required
      main: path.resolve(__dirname, "./src/main"),
      // Launch electron only once. Default: true. Optional
      once: true,
      // Absolute path to nodemon executable. Default: project_root/node_modules/.bin/nodemon. Optional
      nodemon: path.resolve(__dirname, "node_modules", ".bin", "nodemon"),
      // Absolute path to electron executable. Default: project_root/node_modules/.bin/electron. Optional
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
  // Absolute path to main process code directory. Required
  main: __dirname,
  // Absolute path to all application process code root directory. Required
  root: path.resolve(__dirname, "../"),
  // Watching enabled only in dev environment. You can force watching. Default: false. Optional
  forceWatch: false
});
// ...
```
