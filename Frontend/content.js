console.log("Content.js loaded");

// ============================================================================
// PLATFORM DETECTION
// ============================================================================

function findPlatform(url) {
    if (url.includes("claude.ai")) {
        return "claude";
    } else if (url.includes("chatgpt.com")) {
        return "chatgpt";
    } else if (url.includes("gemini.google.com")) {
        return "gemini";
    }
    return null;
}

const AI_PLATFORM = findPlatform(window.location.href);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function extractRelevantTitle(text) {
    const responseIndex = text.indexOf("|Response->|");
    const beforeResponse = responseIndex !== -1 ? text.substring(0, responseIndex) : text;
    const skipped = beforeResponse.substring(0);
    
    if (skipped.length > 35) {
        return skipped.substring(0, 35) + "...";
    }
    return skipped;
}

function formatNode(userText, responseText) {
    return userText + " |Response->| " + responseText;
}

// ============================================================================
// CHROME STORAGE FUNCTIONS
// ============================================================================

function getStorage(url) {
    return new Promise(resolve => {
        chrome.storage.local.get([url], (result) => {
            const data = Array.isArray(result[url]) ? result[url] : [];
            resolve(data);
        });
    });
}

function getStoredSummary(url){
    const key = url+" last_summary"
    return new Promise(resolve=>{
        chrome.storage.local.get([key], (result)=>{
            const data = result[key] || null;
            resolve(data);
        });
    });
}

function deleteStorageForCurrentURL() {
    const url = window.location.href;
    console.log(url)
    return new Promise(resolve => {
        chrome.storage.local.remove(url, () => {
            console.log(`Deleted all stored data for URL: ${url}`);
            resolve(true);
        });
    });
}

function deleteStorage(url) {
  return new Promise((resolve) => {
    chrome.storage.local.remove(url, () => {
        console.log("All deleted from ", url);
      resolve(true);
    });
  });
}

function insertIntoChromeStorage(node) {
    const url = window.location.href;
    return new Promise(resolve => {
        chrome.storage.local.get([url], result => {
            const prev = Array.isArray(result[url]) ? result[url] : [];

            if (prev.includes(node)) {
                resolve(false);
                return;
            }
            const merged = [...prev, node];
            chrome.storage.local.set({ [url]: merged }, () => {
                console.log("Saved new node:", node.slice(0, 50) + "…");
                resolve(true);
            });
        });
    });
}

async function insertSummaryIntoChromeStorage(summary, url){
    const key = url+" last_summary"
    return new Promise(resolve => {
        chrome.storage.local.get([key], result => {
            const prev = Array.isArray(result[key]) ? result[key] : [];
            chrome.storage.local.set({ [key]: summary }, () => {
                console.log("Summary stored");
                resolve(true);
            });
        });
    });
}

function existsInChromeStorage(node) {
    const url = window.location.href;
    return new Promise(resolve => {
        chrome.storage.local.get([url], result => {
            const stored = Array.isArray(result[url]) ? result[url] : [];
            resolve(stored.includes(node));
        });
    });
}



// ============================================================================
// BACKEND REQUESTS
// ============================================================================
async function prepareSummary(url) {

    console.log("Getting you summary ........")
    // Fetch nodes from Chrome storage
    const nodes = await getStorage(url);

    if (!Array.isArray(nodes) || nodes.length === 0) {
        throw new Error("No nodes found in storage for this URL");
    }

    // Merge all nodes into a single string
    const mergedText = nodes.join("\n\n"); // double newline between nodes

    try {
        // Send to FastAPI endpoint
        const response = await fetch("http://127.0.0.1:8000/generate_echo", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text: mergedText })
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        // Assuming your FastAPI returns { "result": "..." }
        return data.result;

    } catch (error) {
        console.error("Error in prepareSummary:", error);
        throw error;
    }
}


// ============================================================================
// WAITING QUEUE CLASS
// ============================================================================

class WaitingQueue {
    constructor() {
        this.queue = [];
        this.prevQueueSig = "";
    }

    async add(nodesSet) {
        for (const node of nodesSet) {
            const exists = await existsInChromeStorage(node);
            if (!exists && !this.queue.includes(node)) {
                this.queue.push(node);
            }
        }
        return this.queue;
    }

    async releaseToStorage(node) {
        const saved = await insertIntoChromeStorage(node);
        if (saved) {
            this.queue = this.queue.filter(n => n !== node);
        }
        return saved;
    }

    async flush() {
        for (const node of [...this.queue]) {
            await this.releaseToStorage(node);
        }
    }

    getQueue() {
        return this.queue;
    }

    hasChanged() {
        const currentSig = JSON.stringify(this.queue);
        if (currentSig !== this.prevQueueSig) {
            this.prevQueueSig = currentSig;
            return true;
        }
        return false;
    }
}

// Initialize the waiting queue
const waitingQueueGPT = new WaitingQueue();  // This class is implementation of all the context that are on queue to be added in the bucket

// ============================================================================
// INPUT CONTROL FUNCTIONS
// ============================================================================

const blockEvent = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.returnValue = false;
};

const blockFocus = (e) => {
    e.preventDefault();
};

function getAIInputRoot(aiPlatform) {
    if (aiPlatform === "chatgpt") {
        return document.getElementById("prompt-textarea");
    }
    if (aiPlatform === "gemini") {
        return document.querySelector("rich-textarea .ql-editor");
    }
    if (aiPlatform === "claude") {
        return document.querySelector("div.root [role='textbox']");
    }
    return null;
}

function disableProseMirrorInput(aiPlatform) {
    const root = getAIInputRoot(aiPlatform);
    if (!root) return;

    root.addEventListener("beforeinput", blockEvent, true);
    root.addEventListener("input", blockEvent, true);
    root.addEventListener("keydown", blockEvent, true);
    root.addEventListener("paste", blockEvent, true);
    root.addEventListener("drop", blockEvent, true);
    root.addEventListener("focus", blockFocus, true);
    root.blur();
}

function enableProseMirrorInput(aiPlatform) {
    const root = getAIInputRoot(aiPlatform);
    if (!root) return;

    root.removeEventListener("beforeinput", blockEvent, true);
    root.removeEventListener("input", blockEvent, true);
    root.removeEventListener("keydown", blockEvent, true);
    root.removeEventListener("paste", blockEvent, true);
    root.removeEventListener("drop", blockEvent, true);
    root.removeEventListener("focus", blockFocus, true);
}

// ============================================================================
// PLATFORM ICONS
// ============================================================================

function getPlatformIcons(aiPlatform) {
    let logoURL, tickURL, crossURL, toggleLogoURL;
    crossURL = chrome.runtime.getURL("assets/cross.svg");
    toggleLogoURL = chrome.runtime.getURL("assets/crossai.svg");

    if (aiPlatform === "chatgpt") {
        logoURL = chrome.runtime.getURL("assets/chatgpt.svg");
        tickURL = chrome.runtime.getURL("assets/save_chatgpt.svg");
    } else if (aiPlatform === "gemini") {
        logoURL = chrome.runtime.getURL("assets/gemini.svg");
        tickURL = chrome.runtime.getURL("assets/save_gemini.svg");
    } else if (aiPlatform === "claude") {
        logoURL = chrome.runtime.getURL("assets/claude.svg");
        tickURL = chrome.runtime.getURL("assets/save_claude.svg");
    }
    
    return { logoURL, tickURL, crossURL, toggleLogoURL };
}

// ============================================================================
// SELECTORS FOR CONVERSATION EXTRACTION
// ============================================================================

function getSelector(aiPlatform) {
    if (aiPlatform === "chatgpt") {
        const cards = document.querySelectorAll("article");
        const userCards = [...cards].filter(c => c.dataset.turn === "user");
        const assistantCards = [...cards].filter(c => c.dataset.turn === "assistant");
        return { userCards, assistantCards };
    } 
    
    if (aiPlatform === "claude") {
const cards = document.querySelectorAll("body > div.root > div > div.w-full.relative.min-w-0 > div > div.h-full.flex.flex-col.overflow-hidden > div > div > div > div.flex-1.flex.flex-col.px-4.max-w-3xl.mx-auto.w-full.pt-1 > div[data-test-render-count]");        const userCards = [...cards].filter((_, index) => index % 2 === 0);
        const assistantCards = [...cards].filter((_, index) => index % 2 !== 0);
        return { userCards, assistantCards };
    } 
    
    if (aiPlatform === "gemini") {
        const cards = document.querySelectorAll("#chat-history infinite-scroller > div:has(user-query):has(model-response)");
        const userCards = [...cards].map((userCard) => userCard.querySelector('user-query'));
        const assistantCards = [...cards].map((assistantCard) => assistantCard.querySelector('model-response'));
        return { userCards, assistantCards };
    }
    
    return { userCards: [], assistantCards: [] };
}

async function seekConversationNodeGPT(aiPlatform) {
    const nodes = new Set();
    const { userCards, assistantCards } = getSelector(aiPlatform);
    const count = Math.min(userCards.length, assistantCards.length);

    for (let i = 0; i < count; i++) {
        const userText = userCards[i].innerText;
        const assistantText = assistantCards[i].innerText;

        if (!assistantText) continue;

        nodes.add(formatNode(userText, assistantText));
    }

    await waitingQueueGPT.add(nodes);
    return nodes;
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

function createContextList(aiPlatform) {
    const { logoURL, tickURL, crossURL, toggleLogoURL } = getPlatformIcons(aiPlatform);
    let savedCount = 0;
    let expandedCard = null;

    const theme = {
        cardBg: "#111",
        textColor: "#ffffff",
        accentColor: "#4f7cff",
        background: "#1F1D1D",
        contextTitleFontSize: "15px",
        contextCounterFontSize: "10px",
        cardWidth: "450px"
    };

    function createCard(text, contextNumber) {
        const card = document.createElement("div");
        const parts = text.split(" |Response->| ");
        const userText = parts[0] || "";
        const responseText = parts[1] || "";
        const halfLength = Math.floor(responseText.length / 2);
        const halfResponse = responseText.substring(0, halfLength);

        let isExpanded = false;

        Object.assign(card.style, {
            background: theme.cardBg,
            color: theme.textColor,
            borderRadius: "24px",
            padding: "20px 10px",
            width: theme.cardWidth,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "13px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
            opacity: "0",
            transform: "translateY(20px)",
            transition: "all 0.35s ease",
            cursor: "pointer",
        });

        requestAnimationFrame(() => {
            card.style.opacity = "1";
            card.style.transform = "translateY(0)";
        });

        const left = document.createElement("div");
        Object.assign(left.style, {
            display: "flex",
            gap: "18px",
            alignItems: "center",
            flex: "1",
        });

        const logo = document.createElement("img");
        logo.src = logoURL;
        Object.assign(logo.style, {
            width: "35px",
            height: "35px",
            objectFit: "contain",
            flexShrink: "0",
        });

        const textWrap = document.createElement("div");

        const mainText = document.createElement("div");
        mainText.textContent = extractRelevantTitle(text);
        Object.assign(mainText.style, {
            fontSize: theme.contextTitleFontSize,
            fontWeight: "400",
            maxWidth: "480px",
        });

        const context = document.createElement("div");
        context.textContent = `Context: ${contextNumber}`;
        Object.assign(context.style, {
            fontSize: "16px",
            color: "#9d9ea2",
            marginTop: "6px",
        });

        textWrap.appendChild(mainText);
        textWrap.appendChild(context);
        left.appendChild(logo);
        left.appendChild(textWrap);

        const right = document.createElement("div");
        Object.assign(right.style, {
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexShrink: "0",
        });

        const tick = document.createElement("img");
        tick.src = tickURL;
        Object.assign(tick.style, {
            width: "36px",
            height: "36px",
            padding: "6px",
            cursor: "pointer",
        });

        tick.onclick = (e) => {
            e.stopPropagation();
            waitingQueueGPT.releaseToStorage(text);

            Object.assign(card.style, {
                opacity: "0",
                transform: "translateX(60px)",
            });
            setTimeout(() => card.remove(), 300);
        };

        const close = document.createElement("img");
        close.src = crossURL;
        Object.assign(close.style, {
            width: "26px",
            height: "26px",
            cursor: "pointer",
        });

        close.onclick = (e) => {
            e.stopPropagation();
            Object.assign(card.style, {
                opacity: "0",
                transform: "scale(0.85)",
            });
            setTimeout(() => card.remove(), 300);
        };

        right.appendChild(tick);
        right.appendChild(close);
        card.appendChild(left);
        card.appendChild(right);

        // Accordion click handler
        card.onclick = () => {
            if (expandedCard && expandedCard !== card) {
                collapseCard(expandedCard);
            }

            if (isExpanded) {
                collapseCard(card);
            } else {
                expandCard(card);
            }
        };

        function expandCard(cardEl) {
            isExpanded = true;
            expandedCard = cardEl;

            const expandedContent = document.createElement("div");
            Object.assign(expandedContent.style, {
                fontSize: "12px",
                color: "#d0d0d0",
                marginTop: "15px",
                paddingTop: "15px",
                borderTop: "1px solid #333",
                maxHeight: "200px",
                overflowY: "auto",
                lineHeight: "1.5",
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
            });
            expandedContent.textContent = halfResponse;
            expandedContent.classList.add("expanded-content");

            cardEl.appendChild(expandedContent);
            cardEl.style.transition = "all 0.4s ease";
            cardEl.style.minHeight = "300px";
        }

        function collapseCard(cardEl) {
            isExpanded = false;
            const expandedContent = cardEl.querySelector(".expanded-content");
            if (expandedContent) {
                expandedContent.remove();
            }
            cardEl.style.minHeight = "auto";
            if (expandedCard === cardEl) {
                expandedCard = null;
            }
        }

        return card;
    }

    const container = document.createElement("div");
    Object.assign(container.style, {
        background: "rgba(0, 0, 0, 0.65)",
        padding: "30px 20px",
        height: "60vh",
        maxHeight: "60vh",
        width: "490px",
        display: "inline-block",
        overflowX: "hidden",
        overflowY: "scroll",
        position: "fixed",
        top: "50%",
        right: "20px",
        transform: "translateY(0) scale(0.92)",
        opacity: "0",
        pointerEvents: "none",
        zIndex: "99998",
        borderRadius: "24px",
        transition: "all 0.45s cubic-bezier(.22,.61,.36,1)",
    });

    document.body.appendChild(container);

    let open = false;

    function toggleContainer() {
        open = !open;

        if (open) {
            scrollListenerActive = true; // Enable scroll listener
            
            container.style.transition = "transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.3s ease";
            container.style.transformOrigin = "bottom right";
            container.style.transform = "translateY(calc(50vh - 50%)) translateX(0) scale(0.05)";
            container.style.opacity = "0.3";
            container.style.pointerEvents = "auto";

            requestAnimationFrame(() => {
                container.style.transform = "translateY(-50%) translateX(0) scale(1)";
                container.style.opacity = "1";
            });
            disableProseMirrorInput(AI_PLATFORM);
        } else {
            scrollListenerActive = false; // Disable scroll listener
            
            container.style.transition = "transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.3s ease 0.2s";
            container.style.transformOrigin = "bottom right";
            container.style.transform = "translateY(calc(50vh - 50%)) translateX(0) scale(0.05)";
            container.style.opacity = "0";

            setTimeout(() => {
                container.style.pointerEvents = "none";
                container.style.transform = "translateY(0) scale(0.92)";
            }, 500);

            enableProseMirrorInput(AI_PLATFORM);
        }
    }

    const toggleButton = document.createElement("div");
    Object.assign(toggleButton.style, {
        position: "fixed",
        bottom: "22px",
        right: "28px",
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        cursor: "pointer",
        zIndex: "99999",
    });

    const toggleImg = document.createElement("img");
    toggleImg.src = toggleLogoURL;
    Object.assign(toggleImg.style, {
        width: "100%",
        height: "100%",
        objectFit: "contain",
    });

    toggleButton.appendChild(toggleImg);
    // toggleButton.appendChild(badge);
    document.body.appendChild(toggleButton);

    toggleButton.onclick = toggleContainer;

    return { container, createCard };
}

// ============================================================================
// MAIN INITIALIZATION
// ============================================================================

let buttonCounter = 0;
let snapShot = [];
let scrollListenerActive = false;
const { container, createCard } = createContextList(AI_PLATFORM);

const fetchAvailableContext = async () => {
    if (!scrollListenerActive) return;
    
    const url = window.location.href;
    await seekConversationNodeGPT(findPlatform(url));
    
    if (waitingQueueGPT.hasChanged()) {
        const notStoredNodes = waitingQueueGPT.getQueue();
        const addedNodes = notStoredNodes.filter(x => !snapShot.includes(x));
        snapShot = [...notStoredNodes];
        buttonCounter = addedNodes.length;
        
        for (let i = 0; i < buttonCounter; i++) {
            container.appendChild(createCard(addedNodes[i], i + 1));
        }
    }
};

document.addEventListener("scroll", fetchAvailableContext, true);

// ................. Events triggered from popup.js ................. //

// ................. Injection Event ................. //


// chrome.runtime.onMessage.addListener((msg) => {
//   if (msg.action === "inject") {
//     injectCode(msg.payload.url);
//   } else if(msg.action == "clear"){
//     deleteStorage(msg.payload.url);
//   }
// });


chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action == "injectRaw") {
    console.log("Inject Raw");
    injectCode(msg.url); 
  } else if(msg.action == "prepareSummary"){
    injectSummary(msg.url).then(()=>{
        sendResponse({success: true});
    }).catch(()=>{
        sendResponse({success: false});
    })
    return true;
  } else if(msg.action == "clear"){
    deleteStorage(msg.payload.url);
    return true;
  } else if(msg.action == "injectLastSummary"){
    injectLastSummary(msg.url);
    return true;
  }
});


  function getEditor(site) {
    try {
      let selector = "";

      switch (site) {
        case "chatgpt":
          selector = "#prompt-textarea";
          break;
        case "claude":
          selector = 'div[contenteditable="true"][data-testid="chat-input"]';
          break;
        case "gemini":
          selector = "div.ql-editor.textarea[contenteditable='true']";
          break;
      }

      const editor = document.querySelector(selector);

      if (!editor) {
        console.warn(`Editor not found for ${site} with selector: ${selector}`);
      }

      return editor;
    } catch (err) {
      console.error("Get editor error:", err);
      return null;
    }
  }


function injectContext(site, context) {
    try {
      const editor = getEditor(site);
      if (!editor) return;

      const userInput = getInputText(editor);
      const injectedMessage = `Here is some persistent user context you should always consider:\n\n${context}\n\nUser's query:\n\n${userInput}`;
      setInputText(editor, injectedMessage);
      placeCursorAtEnd(editor);
    } catch (err) {
      console.error("Failed to inject context:", err);
    }
}


  // ==================== GET INPUT TEXT ====================
  function getInputText(editor) {
    try {
      if (!editor) return "";

      if (editor.isContentEditable) {
        return editor.innerText?.trim() || "";
      }
      return editor.value?.trim() || "";
    } catch (err) {
      console.warn("Get input text error:", err);
      return "";
    }
  }

  // ==================== SET INPUT TEXT ====================
  function setInputText(editor, text) {
    try {
      if (!editor) return;

      if (editor.isContentEditable) {
        editor.innerText = text;
        const inputEvent = new Event("input", { bubbles: true });
        editor.dispatchEvent(inputEvent);
        return;
      }

      editor.value = text;
      const inputEvent = new Event("input", { bubbles: true });
      const changeEvent = new Event("change", { bubbles: true });
      editor.dispatchEvent(inputEvent);
      editor.dispatchEvent(changeEvent);
    } catch (err) {
      console.error("Set input text error:", err);
    }
  }

  // ==================== PLACE CURSOR AT END ====================
  function placeCursorAtEnd(el) {
    try {
      if (!el) return;

      el.focus();

      if (el.isContentEditable) {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(el);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
        return;
      }

      if (el.setSelectionRange) {
        const length = el.value.length;
        el.setSelectionRange(length, length);
      }
    } catch (err) {
      console.warn("Place cursor error:", err);
    }
  }

async function injectCode(url) {
    try {
        const contextData = await getStorage(url);
        injectContext(AI_PLATFORM, contextData.join(""));   

    } catch (err) {
        console.error("Failed to inject code:", err);
    }
}

async function injectSummary(url){

    try {

        const summary = await prepareSummary(url);

        const stored = await insertSummaryIntoChromeStorage(summary, url);
        console.log("Was summary stored?", stored);

        const result = await getStoredSummary(url);
        console.log("Got stored summary:", result);
        injectContext(AI_PLATFORM, result);

    } catch (err) {
        console.error("Failed to inject code:", err);
    }

}


async function injectLastSummary(url) {
    
    try {
        const result = await getStoredSummary(url);
        injectContext(AI_PLATFORM, result);

    } catch (err) {
        console.error("Failed to inject code:", err);
    }
}