const { contextBridge } = require("electron");

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
  }
});
