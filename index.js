"use strict";

const path = require("path");
const { spawn } = require("child_process");
const { app } = require("electron");
const chokidar = require("chokidar");

const createHardWatcher = dirs => {
  chokidar.watch(dirs.main).on("change", () => app.exit(0));
};

const createSoftWatcher = dirs => {
  const browserWindows = [];
  chokidar
    .watch(dirs.root, { ignored: [dirs.main, /node_modules|[/\\]\./] })
    .on("change", () =>
      browserWindows.forEach(bw => bw.webContents.reloadIgnoringCache())
    );
  app.on("browser-window-created", (event, bw) => {
    browserWindows.push(bw);
    bw.on("closed", () => {
      let i = browserWindows.indexOf(bw);
      browserWindows.splice(i, 1);
    });
  });
};

exports.watch = function watch(dirs) {
  createHardWatcher(dirs);
  createSoftWatcher(dirs);
};

let webpackPluginStarted = false;

exports.ElectronWatcherWebpackPlugin = function ElectronWatcherWebpackPlugin({
  root,
  main,
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

            const { pid } = spawn(
              nodemon || path.resolve(root, "node_modules", ".bin", "nodemon"),
              [
                "-w",
                main,
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
