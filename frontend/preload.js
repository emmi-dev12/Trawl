const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  async scrape(config) {
    const response = await fetch("http://127.0.0.1:5555/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(config)
    });
    if (!response.ok) {
      throw new Error(`Scrape failed: ${response.statusText}`);
    }
    return response.json();
  },

  async getStatus() {
    const response = await fetch("http://127.0.0.1:5555/status");
    return response.json();
  },

  async stopScrape() {
    const response = await fetch("http://127.0.0.1:5555/stop", {
      method: "POST"
    });
    return response.json();
  },

  // Update API
  async checkForUpdates() {
    return await ipcRenderer.invoke("check-for-updates");
  },

  async downloadUpdate() {
    return await ipcRenderer.invoke("download-update");
  },

  async installUpdate() {
    return await ipcRenderer.invoke("install-update");
  },

  async getVersion() {
    return await ipcRenderer.invoke("get-version");
  },

  onUpdateAvailable(callback) {
    ipcRenderer.on("update-available", (_, info) => callback(info));
  },

  onUpdateNotAvailable(callback) {
    ipcRenderer.on("update-not-available", callback);
  },

  onUpdateProgress(callback) {
    ipcRenderer.on("update-progress", (_, data) => callback(data));
  },

  onUpdateDownloaded(callback) {
    ipcRenderer.on("update-downloaded", callback);
  },

  onUpdateError(callback) {
    ipcRenderer.on("update-error", (_, error) => callback(error));
  }
});
