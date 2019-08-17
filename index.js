"use strict";

const path = require("path");
const { spawn } = require("child_process");
const { app } = require("electron");
const chokidar = require("chokidar");

const createHardWatcher = options => {
  chokidar
    .watch(options.hard, { ignored: [/node_modules|[/\\]\./] })
    .on("change", () => {
      return app.exit(0);
    });
};

const createSoftWatcher = options => {
  const browserWindows = [];
  chokidar
    .watch(options.soft, { ignored: [/node_modules|[/\\]\./] })
    .on("change", () => {
      browserWindows.forEach(bw => bw.webContents.reloadIgnoringCache());
    });
  app.on("browser-window-created", (event, bw) => {
    browserWindows.push(bw);
    bw.on("closed", () => {
      browserWindows.splice(browserWindows.indexOf(bw), 1);
    });
  });
};

exports.watch = function watch(options) {
  const isDev =
    "ELECTRON_IS_DEV" in process.env
      ? parseInt(process.env.ELECTRON_IS_DEV, 10) === 1
      : !(require("electron").app || require("electron").remote.app).isPackaged;
  if (options.forceWatch === true || isDev) {
    createHardWatcher(options);
    createSoftWatcher(options);
  }
};

let webpackPluginStarted = false;

exports.ElectronWatcherWebpackPlugin = function ElectronWatcherWebpackPlugin({
  root,
  watch,
  once = true,
  nodemon = undefined,
  electron = undefined,
  options = undefined
}) {
  return {
    apply(compiler) {
      compiler.hooks.done.tap("ElectronWatcherWebpackPlugin", () => {
        try {
          if (!webpackPluginStarted) {
            if (once) {
              webpackPluginStarted = true;
            }
            const watchers = [];
            watch.forEach(w => {
              watchers.push("--watch");
              watchers.push(w);
            });
            const { pid } = spawn(
              nodemon || path.resolve(root, "node_modules", ".bin", "nodemon"),
              [
                ...watchers,
                "-x",
                (electron ||
                  path.resolve(root, "node_modules", ".bin", "electron")) + " ."
              ],
              {
                cwd: root,
                stdio: "inherit",
                env: process.env,
                ...options
              }
            );

            function exitHandler(options) {
              if (options.cleanup && pid) {
                process.kill(pid);
              }
              if (options.exit) {
                process.exit(0);
              }
            }

            process.on("exit", exitHandler.bind(null, { cleanup: true }));
            process.on("SIGINT", exitHandler.bind(null, { exit: true }));
            process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
            process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));
            process.on(
              "uncaughtException",
              exitHandler.bind(null, { exit: true })
            );
          }
        } catch (error) {
          console.error(error);
        }
      });
    }
  };
};
