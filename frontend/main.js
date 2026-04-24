const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

let mainWindow;
let backendProcess;
const BACKEND_URL = "http://127.0.0.1:5555";

const isProduction = !process.argv.includes("--dev");

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

function startBackend() {
  const projectRoot = path.join(__dirname, "..");
  const backendDir = path.join(projectRoot, "backend");

  // Determine Python executable
  let pythonCmd = "python3";
  if (process.platform === "win32") {
    pythonCmd = "python";
  }

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

  if (!isProduction) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", async () => {
  try {
    startBackend();
    await waitForBackend();
    createWindow();
  } catch (error) {
    console.error("Failed to start app:", error);
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
