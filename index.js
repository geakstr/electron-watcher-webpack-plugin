"use strict";

const electron = require("electron");
const chokidar = require("chokidar");
const { spawn } = require("child_process");
const http = require("http");

const DEFAULT_HTTP_PORT = 58334;

exports.watch = (options = {}) => {
  const app = electron.app || electron.remote.app;

  const isEnvSet = "ELECTRON_IS_DEV" in process.env;
  const getFromEnv = parseInt(process.env.ELECTRON_IS_DEV, 10) === 1;

  const isDev = isEnvSet ? getFromEnv : !app.isPackaged;

  if (!isDev) {
    return;
  }

  const { port = DEFAULT_HTTP_PORT } = options;
  httpget(`http://localhost:${port}/options`).then(options => {
    let reloading = false;

    const splited = options.main.split("/");
    const cwd = splited.slice(0, splited.length - 1).join("/");
    const mainFileName = splited[splited.length - 1];

    const watcher = chokidar.watch(cwd, {
      cwd,
      disableGlobbing: true,
      ignored: [/(^|[/\\])\../, "node_modules", "**/*.map"].concat(
        options.ignore || []
      )
    });

    if (options.debug) {
      watcher.on("ready", () => {
        if (options.debug) {
          console.log(
            "[electron-watcher-webpack-plugin] watched paths:",
            watcher.getWatched()
          );
        }
      });
    }

    electron.app.on("quit", () => {
      if (!reloading) {
        httpget(`http://localhost:${port}/exit`);
      }
    });

    watcher.on("change", fileName => {
      if (options.debug) {
        console.log(
          "[electron-watcher-webpack-plugin] file changed:",
          fileName
        );
      }
      reloading = true;
      if (mainFileName === fileName) {
        httpget(`http://localhost:${port}/reload`)
          .then(() => {
            reloading = false;
          })
          .catch(error => {
            console.error("[electron-watcher-webpack-plugin]", error);
            reloading = false;
          });
      } else {
        if (!options.skipRenderer) {
          for (const win of electron.BrowserWindow.getAllWindows()) {
            win.webContents.reloadIgnoringCache();
          }
        }
      }
    });
  });
};

exports.ElectronWatcherWebpackPlugin = function(options) {
  let started = false;

  return {
    apply(compiler) {
      compiler.hooks.done.tap("ElectronWatcherWebpackPlugin", () => {
        if (!started) {
          started = true;
          startHttpServer(options);
        }
      });
    }
  };
};

const openElectron = ({ main, electron, argv = [] }) => {
  const args = argv.concat([main]);
  const child = spawn(electron, args, {
    detached: true,
    stdio: "inherit"
  });
  child.unref();
  return child.pid;
};

const startHttpServer = (options = {}) => {
  let pid = null;
  const requestHandler = (request, response) => {
    if (request.url === "/options") {
      if (options.debug) {
        console.log(`[electron-watcher-webpack-plugin] http get /options`);
      }
      response.end(JSON.stringify(options, null, 2));
    } else if (request.url === "/reload") {
      if (options.debug) {
        console.log(`[electron-watcher-webpack-plugin] http get /reload`);
      }
      process.kill(pid);
      pid = openElectron(options);
      if (options.debug) {
        console.log(
          `[electron-watcher-webpack-plugin] reloaded with pid=${pid}`
        );
      }
      response.end();
    } else if (request.url === "/exit") {
      if (options.debug) {
        console.log(`[electron-watcher-webpack-plugin] http get /exit`);
      }
      response.end();
      process.exit(0);
    }
  };

  const { port = DEFAULT_HTTP_PORT } = options;
  http.createServer(requestHandler).listen(port, err => {
    if (err) {
      return console.error("[electron-watcher-webpack-plugin]", err);
    }
    pid = openElectron(options);
    if (options.debug) {
      console.log(
        `[electron-watcher-webpack-plugin] running on http port=${port}, pid=${pid}`
      );
    }
  });

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
  process.on("uncaughtException", exitHandler.bind(null, { exit: true }));
};

const httpget = url => {
  return new Promise((resolve, reject) => {
    http
      .get(url, response => {
        let data = "";
        response.on("data", chunk => (data += chunk));
        response.on("end", () => resolve(JSON.parse(data)));
      })
      .on("error", err => reject(err));
  });
};
