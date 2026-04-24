const { invoke } = window.__TAURI__.tauri;

const BACKEND_URL = "http://127.0.0.1:5555";
const STATUS_POLL_INTERVAL = 500;

let isScraing = false;
let currentResults = [];
let statusPollInterval = null;
let updateInfo = null;

const urlInput = document.getElementById("urlInput");
const scrapeBtn = document.getElementById("scrapeBtn");
const depthInput = document.getElementById("depthInput");
const maxPagesInput = document.getElementById("maxPagesInput");
const scrollInput = document.getElementById("scrollInput");
const extractLinksInput = document.getElementById("extractLinksInput");
const extractTextInput = document.getElementById("extractTextInput");
const extractStructuredInput = document.getElementById("extractStructuredInput");
const resultsBody = document.getElementById("resultsBody");
const statusText = document.getElementById("statusText");
const progressBar = document.getElementById("progressBar");
const progressFill = document.getElementById("progressFill");
const exportSection = document.getElementById("exportSection");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const exportJsonBtn = document.getElementById("exportJsonBtn");
const copyBtn = document.getElementById("copyBtn");
const updateNotification = document.getElementById("updateNotification");
const updateMessage = document.getElementById("updateMessage");
const downloadUpdateBtn = document.getElementById("downloadUpdateBtn");
const dismissUpdateBtn = document.getElementById("dismissUpdateBtn");
const checkUpdateBtn = document.getElementById("checkUpdateBtn");
const versionText = document.getElementById("versionText");

// Event Listeners
scrapeBtn.addEventListener("click", startScrape);
exportCsvBtn.addEventListener("click", exportAsCSV);
exportJsonBtn.addEventListener("click", exportAsJSON);
copyBtn.addEventListener("click", copyToClipboard);
checkUpdateBtn.addEventListener("click", checkForUpdates);
downloadUpdateBtn.addEventListener("click", downloadUpdate);
dismissUpdateBtn.addEventListener("click", dismissUpdate);

// Initialize
initializeApp();

async function startScrape() {
  const url = urlInput.value.trim();

  if (!url) {
    statusText.textContent = "Please enter a valid URL";
    return;
  }

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    statusText.textContent = "URL must start with http:// or https://";
    return;
  }

  isScraing = true;
  scrapeBtn.disabled = true;
  progressBar.style.display = "flex";
  exportSection.style.display = "none";
  resultsBody.innerHTML = "";
  currentResults = [];

  const mode = document.querySelector('input[name="mode"]:checked').value;
  const depth = parseInt(depthInput.value);
  const maxPages = parseInt(maxPagesInput.value);
  const scroll = scrollInput.checked;

  const extract = [];
  if (extractLinksInput.checked) extract.push("links");
  if (extractTextInput.checked) extract.push("text");
  if (extractStructuredInput.checked) extract.push("structured");

  try {
    statusText.textContent = "Starting scrape...";
    progressFill.style.width = "0%";

    const config = {
      url,
      mode,
      depth,
      max_pages: maxPages,
      scroll,
      extract
    };

    // Start polling for status
    startStatusPolling();

    // Start scraping
    const response = await fetch(`${BACKEND_URL}/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(config)
    });

    if (!response.ok) {
      throw new Error(`Scrape failed: ${response.statusText}`);
    }

    const result = await response.json();
    currentResults = result.pages;
    updateTable(result.pages);
    statusText.textContent = `Completed: ${result.count} pages in ${result.duration_seconds}s`;
    progressBar.style.display = "none";
    exportSection.style.display = "flex";
  } catch (error) {
    statusText.textContent = `Error: ${error.message}`;
    console.error(error);
  } finally {
    isScraing = false;
    scrapeBtn.disabled = false;
    if (statusPollInterval) {
      clearInterval(statusPollInterval);
    }
  }
}

function startStatusPolling() {
  statusPollInterval = setInterval(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/status`);
      const status = await response.json();
      if (status.current > 0 && status.total > 0) {
        const percent = Math.round((status.current / status.total) * 100);
        progressFill.style.width = percent + "%";
        statusText.textContent = `Scraping: ${status.current} / ${status.total} pages... ${status.message}`;
      }
    } catch (error) {
      console.error("Error polling status:", error);
    }
  }, STATUS_POLL_INTERVAL);
}

function updateTable(pages) {
  if (pages.length === 0) {
    resultsBody.innerHTML =
      '<tr class="empty-row"><td colspan="4">No results found</td></tr>';
    return;
  }

  resultsBody.innerHTML = pages
    .map(
      (page) => `
    <tr>
      <td class="col-url"><a href="${page.url}" target="_blank" title="${page.url}">${new URL(page.url).pathname || page.url}</a></td>
      <td class="col-title">${escapeHtml(page.title || "—")}</td>
      <td class="col-links">${page.links?.length || 0}</td>
      <td class="col-text">${escapeHtml((page.text || "").substring(0, 100))}...</td>
    </tr>
  `
    )
    .join("");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function exportAsCSV() {
  if (currentResults.length === 0) {
    alert("No data to export");
    return;
  }

  const headers = ["URL", "Title", "Link Count", "Text Preview"];
  const rows = currentResults.map((page) => [
    page.url,
    page.title || "",
    page.links?.length || 0,
    (page.text || "").substring(0, 100)
  ]);

  const csv = [
    headers.map((h) => `"${h}"`).join(","),
    ...rows.map((row) =>
      row
        .map((cell) => {
          if (typeof cell === "string") {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(",")
    )
  ].join("\n");

  downloadFile(csv, "trawl_results.csv", "text/csv");
}

function exportAsJSON() {
  if (currentResults.length === 0) {
    alert("No data to export");
    return;
  }

  const json = JSON.stringify(currentResults, null, 2);
  downloadFile(json, "trawl_results.json", "application/json");
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function copyToClipboard() {
  if (currentResults.length === 0) {
    alert("No data to copy");
    return;
  }

  const json = JSON.stringify(currentResults, null, 2);
  navigator.clipboard
    .writeText(json)
    .then(() => {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = "Copied!";
      setTimeout(() => {
        copyBtn.textContent = originalText;
      }, 2000);
    })
    .catch((err) => {
      console.error("Failed to copy:", err);
      alert("Failed to copy to clipboard");
    });
}

function dismissUpdate() {
  updateNotification.style.display = "none";
  updateInfo = null;
}

async function checkForUpdates() {
  try {
    checkUpdateBtn.disabled = true;
    checkUpdateBtn.textContent = "Checking...";

    // TODO: Implement update check with Tauri updater
    checkUpdateBtn.textContent = "No updates";
    setTimeout(() => {
      checkUpdateBtn.textContent = versionText.textContent;
      checkUpdateBtn.disabled = false;
    }, 2000);
  } catch (error) {
    console.error("Check for updates error:", error);
    checkUpdateBtn.textContent = "Check failed";
    setTimeout(() => {
      checkUpdateBtn.textContent = versionText.textContent;
      checkUpdateBtn.disabled = false;
    }, 2000);
  }
}

function downloadUpdate() {
  // TODO: Implement update download
  console.log("Download update");
}

async function initializeApp() {
  try {
    const version = await invoke("check_version");
    versionText.textContent = `v${version}`;
  } catch (error) {
    console.error("Error getting version:", error);
  }

  // Start the backend
  try {
    await invoke("start_backend");
  } catch (error) {
    console.error("Error starting backend:", error);
  }
}
