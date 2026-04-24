const { app, BrowserWindow, Menu, ipcMain, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");

let mainWindow;
let backendProcess;
const BACKEND_URL = "http://127.0.0.1:5555";

const isDev = !app.isPackaged;

// Configure auto-updater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;

async function waitForBackend(maxAttempts = 30) {
  const http = require("http");

  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`${BACKEND_URL}/health`, (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            reject();
          }
        });
        req.on("error", reject);
        req.setTimeout(1000, () => {
          req.destroy();
          reject();
        });
      });
      console.log("Backend is ready");
      return true;
    } catch (error) {
      // Backend not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error("Backend failed to start within timeout");
}

function getPythonPath() {
  // In packaged app, Python is bundled
  if (app.isPackaged) {
    const bundledPython = path.join(
      process.resourcesPath,
      "python",
      "bin",
      "python3"
    );
    if (fs.existsSync(bundledPython)) {
      return bundledPython;
    }
  }

  // Fallback to system Python
  return "python3";
}

function startBackend() {
  const projectRoot = app.isPackaged
    ? process.resourcesPath
    : path.join(__dirname, "..");
  const backendDir = path.join(projectRoot, "backend");

  const pythonCmd = getPythonPath();

  backendProcess = spawn(pythonCmd, ["server.py"], {
    cwd: backendDir,
    stdio: ["ignore", "pipe", "pipe"],
    detached: false
  });

  backendProcess.stdout.on("data", (data) => {
    console.log(`[Backend] ${data}`);
  });

  backendProcess.stderr.on("data", (data) => {
    console.error(`[Backend Error] ${data}`);
  });

  backendProcess.on("error", (err) => {
    console.error("Failed to start backend:", err);
  });

  backendProcess.on("exit", (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    },
    icon: path.join(__dirname, "..", "assets", "icon.png")
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function setupAutoUpdater() {
  autoUpdater.on("update-available", (info) => {
    console.log("Update available:", info.version);
    mainWindow?.webContents.send("update-available", info);
  });

  autoUpdater.on("update-not-available", () => {
    console.log("No update available");
    mainWindow?.webContents.send("update-not-available");
  });

  autoUpdater.on("error", (error) => {
    console.error("Update error:", error);
    mainWindow?.webContents.send("update-error", error.message);
  });

  autoUpdater.on("download-progress", (progressObj) => {
    mainWindow?.webContents.send("update-progress", {
      bytesPerSecond: progressObj.bytesPerSecond,
      percent: progressObj.percent,
      transferred: progressObj.transferred,
      total: progressObj.total
    });
  });

  autoUpdater.on("update-downloaded", () => {
    console.log("Update downloaded");
    mainWindow?.webContents.send("update-downloaded");
  });

  // Check for updates every hour
  if (!isDev) {
    setInterval(() => {
      autoUpdater.checkForUpdates();
    }, 60 * 60 * 1000);

    // Initial check
    setTimeout(() => {
      autoUpdater.checkForUpdates();
    }, 2000);
  }
}

// IPC Handlers
ipcMain.handle("check-for-updates", async () => {
  return await autoUpdater.checkForUpdates();
});

ipcMain.handle("download-update", async () => {
  autoUpdater.downloadUpdate();
});

ipcMain.handle("install-update", () => {
  autoUpdater.quitAndInstall();
});

ipcMain.handle("get-version", () => {
  return app.getVersion();
});

app.on("ready", async () => {
  try {
    startBackend();
    await waitForBackend();
    createWindow();
    setupAutoUpdater();
  } catch (error) {
    console.error("Failed to start app:", error);
    dialog.showErrorBox(
      "Startup Error",
      "Failed to start Trawl backend. Please check your Python installation."
    );
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (backendProcess) {
    try {
      process.kill(-backendProcess.pid);
    } catch (e) {
      console.error("Error killing backend:", e);
    }
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

const menu = Menu.buildFromTemplate([
  {
    label: "Trawl",
    submenu: [
      { label: "Quit", accelerator: "CmdOrCtrl+Q", click: () => app.quit() }
    ]
  },
  {
    label: "Edit",
    submenu: [
      { label: "Undo", accelerator: "CmdOrCtrl+Z", role: "undo" },
      { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", role: "redo" },
      { type: "separator" },
      { label: "Cut", accelerator: "CmdOrCtrl+X", role: "cut" },
      { label: "Copy", accelerator: "CmdOrCtrl+C", role: "copy" },
      { label: "Paste", accelerator: "CmdOrCtrl+V", role: "paste" }
    ]
  }
]);

Menu.setApplicationMenu(menu);
