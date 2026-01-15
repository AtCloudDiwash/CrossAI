// ---------- SAFE DOM ID ENCODER ----------
function safeIdFromUrl(url) {
  return "id_" + btoa(url).replace(/=/g, "");
}

function safeIdFromUrlForSummary(url) {
  return "summary_" + btoa(url).replace(/=/g, "");
}

function safeIdFromUrlForRaw(url) {
  return "raw_" + btoa(url).replace(/=/g, "");
}

function safeIdFromUrlForLastSummary(url) {
  return "last_summary_" + btoa(url).replace(/=/g, "");
}

// ---------- STORAGE ----------
function getStoredCount(tabUrl) {
  return new Promise(resolve => {
    chrome.storage.local.get([tabUrl], result => {
      const value = result[tabUrl];
      if (!value || !Array.isArray(value)) {
        resolve(0);
      } else {
        resolve(value.length);
      }
    });
  });
}

// ---------- UPDATE UI COUNTERS ----------
async function updateSavedCount(tabUrl) {
  try {
    let count = await getStoredCount(tabUrl);
    count = count !== null && count !== undefined ? count : 0;
    if(count != 0){
        const safeId = safeIdFromUrl(tabUrl);
        const el = document.querySelector(`#${safeId}`);
        console.log(el);

        if (el) {
          el.textContent = `You have saved ${count} context`;

        }
    }
  } catch (err) {
    console.error("Failed to update count for", tabUrl, err);
  }
}

function setSavedCount(tabUrl, count = 0) {
  try {
    const safeId = safeIdFromUrl(tabUrl);
    const el = document.querySelector(`#${safeId}`);
    if (el) {
      el.textContent = `You have saved ${count} context`;
    }
  } catch (err) {
    console.error("Failed to set count for", tabUrl, err);
  }
}

// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", async () => {
  const cardsContainer = document.getElementById("cards");

  try {
    chrome.tabs.query({}, tabs => {
      const filteredTabs = tabs.filter(tab => isSupported(tab.url));
      filteredTabs.forEach(async tab => {
        const provider = getProvider(tab.url);
        if (!provider) return;
        try {
          const card = createCard(provider, tab.id, tab.title, tab.url);
          cardsContainer.appendChild(card);
          await updateSavedCount(tab.url);
        } catch (err) {
          console.error("Failed to create card for tab", tab.url, err);
        }
      });
    });
  } catch (err) {
    console.error("Failed to query tabs:", err);
  }
});

// ---------- HELPERS ----------
function isSupported(url) {
    return Object.values(PLATFORM_CONFIG).some(provider =>
        provider.domains.some(domain => url.includes(domain))
      );
}

function getProvider(url) {
    return Object.values(PLATFORM_CONFIG).find(provider =>
        provider.domains.some(domain => url.includes(domain))
      );
}

// ---------- MESSAGE SENDING HELPERS ----------
/**
 * Send a message that expects a response (prepareSummary only)
 */
function sendMessageWithResponse(tabId, message) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Message error:", chrome.runtime.lastError.message);
        resolve({ success: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(response || { success: false });
    });
  });
}

/**
 * Send a fire-and-forget message (injectRaw, clear, injectLastSummary)
 * Silently logs errors, doesn't block on response
 */
function sendMessageFireAndForget(tabId, message) {
  chrome.tabs.sendMessage(tabId, message, (response) => {
    // Just consume the lastError to prevent console warnings
    if (chrome.runtime.lastError) {
      console.warn(
        `Content script may not be loaded on this tab: ${chrome.runtime.lastError.message}`
      );
    }
  });
}

// ---------- CARD CREATOR (Safe DOM Building) ----------
function createCard(provider, tabId, tabTitle, tabUrl) {
  const safeId = safeIdFromUrl(tabUrl);
  const summarySafeId = safeIdFromUrlForSummary(tabUrl);
  const rawSafeId = safeIdFromUrlForRaw(tabUrl);
  const lastSummarySafeId = safeIdFromUrlForLastSummary(tabUrl);

  // Create card container
  const card = document.createElement("div");
  card.className = "card";

  // Left section
  const left = document.createElement("div");
  left.className = "left";

  // Row (icon + title)
  const row = document.createElement("div");
  row.className = "row";

  const icon = document.createElement("img");
  icon.className = "icon";
  icon.src = provider.assets.icon;
  icon.alt = provider.label;

  const titleSpan = document.createElement("span");
  titleSpan.textContent = tabTitle; // ✅ Safe: textContent, not innerHTML

  row.appendChild(icon);
  row.appendChild(titleSpan);

  // Clear button
  const clearBtn = document.createElement("span");
  clearBtn.className = "clear";
  clearBtn.textContent = "Clear all";

  // Saved count
  const countSpan = document.createElement("span");
  countSpan.id = safeId;
  countSpan.textContent = "You have saved 0 context";

  left.appendChild(row);
  left.appendChild(clearBtn);
  left.appendChild(countSpan);

  // Right section (buttons)
  const right = document.createElement("div");
  right.style.display = "flex";
  right.style.flexDirection = "column";
  right.style.alignItems = "flex-end";
  right.style.gap = "8px";

  // Summarize & Inject button
  const summaryBtn = document.createElement("button");
  summaryBtn.className = "inject-btn";
  summaryBtn.id = summarySafeId;
  summaryBtn.textContent = "Summarize & Inject";
  summaryBtn.style.background = provider.color;

  // Sub-buttons container
  const subBtnsContainer = document.createElement("div");
  subBtnsContainer.style.display = "flex";
  subBtnsContainer.style.gap = "12px";

  const lastSummarySpan = document.createElement("span");
  lastSummarySpan.className = "last-summary";
  lastSummarySpan.id = lastSummarySafeId;
  lastSummarySpan.textContent = "last summary";
  lastSummarySpan.style.textDecoration = "underline";
  lastSummarySpan.style.cursor = "pointer";
  lastSummarySpan.style.fontSize = "12px";
  lastSummarySpan.style.opacity = "0.7";

  const injectRawSpan = document.createElement("span");
  injectRawSpan.className = "inject-raw";
  injectRawSpan.id = rawSafeId;
  injectRawSpan.textContent = "Inject raw";
  injectRawSpan.style.textDecoration = "underline";
  injectRawSpan.style.cursor = "pointer";
  injectRawSpan.style.fontSize = "12px";
  injectRawSpan.style.opacity = "0.7";

  subBtnsContainer.appendChild(lastSummarySpan);
  subBtnsContainer.appendChild(injectRawSpan);

  right.appendChild(summaryBtn);
  right.appendChild(subBtnsContainer);

  card.appendChild(left);
  card.appendChild(right);

  // ===== EVENT LISTENERS =====

  // ===== SUMMARIZE & INJECT (Async, expects response) =====
  summaryBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    const originalText = btn.textContent;

    if (btn.disabled) return;

    btn.disabled = true;
    btn.textContent = "Preparing...";
    btn.style.opacity = "0.6";

    // Create or clear message span
    let msgSpan = card.querySelector(".summary-message");
    if (!msgSpan) {
      msgSpan = document.createElement("span");
      msgSpan.className = "summary-message";
      msgSpan.style.fontSize = "12px";
      msgSpan.style.marginTop = "5px";
      btn.parentNode.appendChild(msgSpan);
    }
    msgSpan.textContent = "";

    // Get active tab
    try {
      const tabs = await new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, resolve);
      });

      if (!tabs[0]) {
        msgSpan.textContent = "No active tab found ❌";
        msgSpan.style.color = "#f44336";
        btn.disabled = false;
        btn.textContent = originalText;
        btn.style.opacity = "1";
        return;
      }

      // Send message and wait for response
      const response = await sendMessageWithResponse(tabs[0].id, {
        action: "prepareSummary",
        url: tabUrl
      });

      if (response.success) {
        setTimeout(() => {
          msgSpan.textContent = "Summary injected successfully ✅";
          msgSpan.style.color = "#4caf50";
        }, 1000);
      } else {
        setTimeout(() => {
          msgSpan.textContent = "Experiencing error, try again ❌";
          msgSpan.style.color = "#f44336";
        }, 1000);
      }

      // Restore button after 2 seconds
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = originalText;
        btn.style.opacity = "1";
      }, 2000);
    } catch (err) {
      console.error("Error in summarize button:", err);
      msgSpan.textContent = "Experiencing error, try again ❌";
      msgSpan.style.color = "#f44336";

      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = originalText;
        btn.style.opacity = "1";
      }, 2000);
    }
  });

  // ===== INJECT LAST SUMMARY (Fire and forget) =====
  lastSummarySpan.addEventListener("click", (e) => {
    e.stopPropagation();

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (!tabs[0]) {
        console.warn("No active tab found");
        return;
      }

      sendMessageFireAndForget(tabs[0].id, {
        action: "injectLastSummary",
        url: tabUrl
      });
    });
  });

  // ===== INJECT RAW (Fire and forget) =====
  injectRawSpan.addEventListener("click", (e) => {
    e.stopPropagation();

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (!tabs[0]) {
        console.warn("No active tab found");
        return;
      }

      sendMessageFireAndForget(tabs[0].id, {
        action: "injectRaw",
        url: tabUrl
      });
    });
  });

  // ===== CLEAR (Fire and forget, but update UI optimistically) =====
  clearBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    // Optimistically update UI immediately
    setSavedCount(tabUrl, 0);

    // Send fire-and-forget message to content.js
    sendMessageFireAndForget(tabId, {
      action: "clear",
      payload: { url: tabUrl }
    });
  });

  return card;
}