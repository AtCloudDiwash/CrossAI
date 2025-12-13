// ---------- PROVIDERS ----------
const PROVIDERS = {
  chatgpt: {
    match: ["chat.openai.com", "chatgpt.com"],
    label: "ChatGPT",
    color: "#643CF5",
    icon: "assets/chatgpt.svg"
  },
  claude: {
    match: ["claude.ai"],
    label: "Claude",
    color: "#643CF5",
    icon: "assets/claude.svg"
  },
  gemini: {
    match: ["gemini.google.com"],
    label: "Gemini",
    color: "#643CF5",
    icon: "assets/gemini.svg"
  }
};


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

// function checkSummaryExists(tabUrl) {
//   return new Promise(resolve => {
//     const key = tabUrl + " last_summary";
//     chrome.storage.local.get([key], result => {
//       resolve(!!result[key]);
//     });
//   });
// }


// ---------- UPDATE UI COUNTERS ----------
async function updateSavedCount(tabUrl) {
  const count = await getStoredCount(tabUrl);
  const safeId = safeIdFromUrl(tabUrl);

  const el = document.querySelector(`#${safeId}`);
  if (el) {
    el.textContent = `You have saved ${count} context`;
  }
}

function setSavedCount(tabUrl, count = 0) {
  const safeId = safeIdFromUrl(tabUrl);

  const el = document.querySelector(`#${safeId}`);
  if (el) {
    el.textContent = `You have saved ${count} context`;
  }
}

async function updateSummaryButton(tabUrl) {
  // const hasSummary = await checkSummaryExists(tabUrl);
  const summaryBtnId = safeIdFromUrlForSummary(tabUrl);
  const btn = document.querySelector(`#${summaryBtnId}`);

  // if (btn) {
  //   if (hasSummary) {
  //     btn.textContent = "Inject last summary";
  //   } else {
  //     btn.textContent = "Prepare summary";
  //   }
  // }
}


// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", async () => {
  const cardsContainer = document.getElementById("cards");

  chrome.tabs.query({}, tabs => {
    const filteredTabs = tabs.filter(tab => isSupported(tab.url));

    filteredTabs.forEach(async (tab) => {
      const provider = getProvider(tab.url);
      if (!provider) return;

      const card = createCard(provider, tab.id, tab.title, tab.url);
      cardsContainer.appendChild(card);

      await updateSavedCount(tab.url);
      await updateSummaryButton(tab.url);
    });
  });
});


// ---------- LISTEN FOR CONTENT.JS MESSAGES ----------
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.action === "summaryPrepared") {
//     updateSummaryButton(message.url);
//   }
// });


// ---------- HELPERS ----------
function isSupported(url) {
  return Object.values(PROVIDERS).some(provider =>
    provider.match.some(domain => url.includes(domain))
  );
}

function getProvider(url) {
  return Object.values(PROVIDERS).find(provider =>
    provider.match.some(domain => url.includes(domain))
  );
}


// ---------- CARD CREATOR ----------
function createCard(provider, tabId, tabTitle, tabUrl) {
  const safeId = safeIdFromUrl(tabUrl);
  const summarySafeId = safeIdFromUrlForSummary(tabUrl);
  const rawSafeId = safeIdFromUrlForRaw(tabUrl);
  const lastSummarySafeId = safeIdFromUrlForLastSummary(tabUrl);

  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
      <div class="left">
        <div class="row">
          <img class="icon" src="${provider.icon}" alt="${provider.label}" />
          <span>${tabTitle}</span>
        </div>
        <span class="clear">Clear all</span>
        <span id="${safeId}">You have saved 0 context</span>
      </div>

      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
        <button class="inject-btn" id="${summarySafeId}" style="background:${provider.color}">
          Prepare & Inject
        </button>
        <div style="display: flex; gap: 12px;">
          <span class="last-summary" id="${lastSummarySafeId}" style="text-decoration: underline; cursor: pointer; font-size: 12px; opacity: 0.7;">last summary</span>
          <span class="inject-raw" id="${rawSafeId}" style="text-decoration: underline; cursor: pointer; font-size: 12px; opacity: 0.7;">Inject raw</span>
        </div>
      </div>
  `;


    // ----- Action Triggering Mechanism (goest to content.js) -----


  // ----- Inject/Summary Button -----
card.querySelector(`#${summarySafeId}`).addEventListener("click", (e) => {
    const btn = e.currentTarget;
    const originalText = btn.textContent;

    // If already disabled, do nothing
    if (btn.disabled) return;

    // Disable the button immediately
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

    // Send message to content.js
    chrome.tabs.sendMessage(tabId, { action: "prepareSummary", url: tabUrl }, (response) => {
        if (response && response.success) {
            setTimeout(() => {
            msgSpan.textContent = "Summary injected successfully ✅";
            msgSpan.style.color = "#4caf50"; // green
            }, 1000);
        } else {
            setTimeout(() => { 
            msgSpan.textContent = "Experiencing error, try again ❌";
            msgSpan.style.color = "#f44336"; // red
            }, 1000);
        }

        // Restore button after 2 seconds
        setTimeout(() => {
            btn.disabled = false;
            btn.textContent = originalText;
            btn.style.opacity = "1";
        }, 2000);
    });
});



  // ----- Prepare New -----
  card.querySelector(`#${lastSummarySafeId}`).addEventListener("click", () => {
    const message = {
      action: "injectLastSummary",
      url: tabUrl
    };

    chrome.tabs.sendMessage(tabId, message);
  });


  // ----- Inject Raw -----
  card.querySelector(`.inject-raw`).addEventListener("click", () => {
    const message = {
      action: "injectRaw",
      url: tabUrl
    };

      chrome.tabs.query({active: true, currentWindow: true}, tabs => {
      chrome.tabs.sendMessage(tabs[0].id, message);
  });
  });


  // ----- Clear Button -----
  card.querySelector(".clear").addEventListener("click", () => {
    chrome.tabs.sendMessage(tabId, { action: "clear", payload: { url: tabUrl } });
    setSavedCount(tabUrl, 0);
  });

  return card;
}