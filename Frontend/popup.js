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


// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", async () => {
  const cardsContainer = document.getElementById("cards");

  chrome.tabs.query({}, tabs => {
    const filteredTabs = tabs.filter(tab => isSupported(tab.url));

    filteredTabs.forEach(tab => {
      const provider = getProvider(tab.url);
      if (!provider) return;

      const card = createCard(provider, tab.id, tab.title, tab.url);
      cardsContainer.appendChild(card);

      updateSavedCount(tab.url);
    });
  });
});


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

      <button class="inject-btn" style="background:${provider.color}">
        Inject
      </button>
  `;


  // ----- Inject Button -----
  card.querySelector(".inject-btn").addEventListener("click", () => {
    const message = {
      action: "inject",
      provider: provider.label,
      url: tabUrl
    };

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
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
