console.log("Content.js loaded");

const API_SERVER_ENDPOINT = "https://crossaibackend.onrender.com/generate_echo";

// ============================================================================
// PLATFORM DETECTION & CONFIGURATION
// ============================================================================

let AI_PLATFORM_CONFIG = null;
let AI_PLATFORM_ID = null;

function detectPlatform() {
  const url = window.location.href;
  for (const [platformId, config] of Object.entries(PLATFORM_CONFIG)) {
    if (config.domains.some(domain => url.includes(domain))) {
      AI_PLATFORM_CONFIG = config;
      AI_PLATFORM_ID = platformId;
      return;
    }
  }
}

detectPlatform();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function extractRelevantTitle(text) {
  // Now that we store structured data, we just truncate the user's prompt.
  if (text.length > 35) {
    return text.substring(0, 35) + "...";
  }
  return text;
}

function formatNode(userText, responseText) {
    return {
        user: userText,
        assistant: { [AI_PLATFORM_ID]: responseText },
      };
}

// ============================================================================
// CHROME STORAGE FUNCTIONS
// ============================================================================

function getStorage(url) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get([url], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Storage error: ${chrome.runtime.lastError.message}`));
          return;
        }
        const data = Array.isArray(result[url]) ? result[url] : [];
        resolve(data);
      });
    } catch (err) {
      reject(err);
    }
  });
}

function getStoredSummary(url) {
  const key = url + " last_summary";
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Storage error: ${chrome.runtime.lastError.message}`));
          return;
        }
        const data = result[key] || null;
        resolve(data);
      });
    } catch (err) {
      reject(err);
    }
  });
}

function deleteStorageForCurrentURL() {
  const url = window.location.href;
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.remove(url, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Storage error: ${chrome.runtime.lastError.message}`));
          return;
        }
        console.log(`Deleted all stored data for URL: ${url}`);
        resolve(true);
      });
    } catch (err) {
      reject(err);
    }
  });
}

function deleteStorage(url) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.remove(url, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Storage error: ${chrome.runtime.lastError.message}`));
          return;
        }
        console.log("All deleted from", url);
        resolve(true);
      });
    } catch (err) {
      reject(err);
    }
  });
}

function insertIntoChromeStorage(node) {
  const url = window.location.href;
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get([url], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Storage error: ${chrome.runtime.lastError.message}`));
          return;
        }
        const prev = Array.isArray(result[url]) ? result[url] : [];

        // Updated check for object existence
        if (prev.some(item => JSON.stringify(item) === JSON.stringify(node))) {
          resolve(false);
          return;
        }
        const merged = [...prev, node];
        chrome.storage.local.set({ [url]: merged }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(`Storage error: ${chrome.runtime.lastError.message}`));
            return;
          }
          console.log("Saved new node:", node);
          resolve(true);
        });
      });
    } catch (err) {
      reject(err);
    }
  });
}

function insertSummaryIntoChromeStorage(summary, url) {
  const key = url + " last_summary";
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Storage error: ${chrome.runtime.lastError.message}`));
          return;
        }
        chrome.storage.local.set({ [key]: summary }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(`Storage error: ${chrome.runtime.lastError.message}`));
            return;
          }
          console.log("Summary stored");
          resolve(true);
        });
      });
    } catch (err) {
      reject(err);
    }
  });
}

function existsInChromeStorage(node) {
    const url = window.location.href;
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.local.get([url], (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(`Storage error: ${chrome.runtime.lastError.message}`));
            return;
          }
          const stored = Array.isArray(result[url]) ? result[url] : [];
          resolve(stored.some(item => JSON.stringify(item) === JSON.stringify(node)));
        });
      } catch (err) {
        reject(err);
      }
    });
  }

// ============================================================================
// BACKEND REQUESTS
// ============================================================================

async function prepareSummary(url) {
  try {
    // Fetch nodes from Chrome storage
    const nodes = await getStorage(url);

    if (!Array.isArray(nodes) || nodes.length === 0) {
      throw new Error("No nodes found in storage for this URL");
    }

    // Convert structured JSON back to a string format for the backend.
    const mergedText = nodes.map(turn => {
        const platform = Object.keys(turn.assistant)[0];
        const response = turn.assistant[platform];
        return `User: ${turn.user}\n${platform}'s Response: ${response}`;
      }).join("\n\n---\n\n");

    // Send to backend endpoint
    const response = await fetch(API_SERVER_ENDPOINT, {
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

    // Assuming backend returns { "result": null }
    if (!data.result) {
      throw new Error("Backend returned empty result");
    }

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
    try {
      for (const node of nodesSet) {
        const exists = await existsInChromeStorage(node);
        const inQueue = this.queue.some(item => JSON.stringify(item) === JSON.stringify(node));
        if (!exists && !inQueue) {
          this.queue.push(node);
        }
      }
      return this.queue;
    } catch (err) {
      console.error("Error adding to queue:", err);
      return this.queue;
    }
  }

  async releaseToStorage(node) {
    try {
      const saved = await insertIntoChromeStorage(node);
      if (saved) {
        this.queue = this.queue.filter(n => JSON.stringify(n) !== JSON.stringify(node));
      }
      return saved;
    } catch (err) {
      console.error("Error releasing to storage:", err);
      return false;
    }
  }

//   async flush() {
//     try {
//       for (const node of [...this.queue]) {
//         await this.releaseToStorage(node);
//       }
//     } catch (err) {
//       console.error("Error flushing queue:", err);
//     }
//   }

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
const waitingQueueGPT = new WaitingQueue();

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



function getAIInputRoot() {

    if (!AI_PLATFORM_CONFIG) return null;

    return document.querySelector(AI_PLATFORM_CONFIG.selectors.inputField);

  }



function disableProseMirrorInput() {

  try {

    const root = getAIInputRoot();

    if (!root) {

      console.warn("Input root not found for platform:", AI_PLATFORM_ID);

      return;

    }



    root.addEventListener("beforeinput", blockEvent, true);

    root.addEventListener("input", blockEvent, true);

    root.addEventListener("keydown", blockEvent, true);

    root.addEventListener("paste", blockEvent, true);

    root.addEventListener("drop", blockEvent, true);

    root.addEventListener("focus", blockFocus, true);

    root.blur();

  } catch (err) {

    console.error("Error disabling input:", err);

  }

}



function enableProseMirrorInput() {

  try {

    const root = getAIInputRoot();

    if (!root) return;



    root.removeEventListener("beforeinput", blockEvent, true);

    root.removeEventListener("input", blockEvent, true);

    root.removeEventListener("keydown", blockEvent, true);

    root.removeEventListener("paste", blockEvent, true);

    root.removeEventListener("drop", blockEvent, true);

    root.removeEventListener("focus", blockFocus, true);

  } catch (err) {

    console.error("Error enabling input:", err);

  }

}



// ============================================================================

// CONVERSATION EXTRACTION

// ============================================================================



async function seekConversationNodeGPT() {

    if (!AI_PLATFORM_CONFIG) return new Set();

    try {

      const nodes = new Set();

      const { userCards, assistantCards } = AI_PLATFORM_CONFIG.selectors.getConversationTurns(document);

      const count = Math.min(userCards.length, assistantCards.length);

  

      for (let i = 0; i < count; i++) {

        const userText = userCards[i].innerText;

        const assistantText = assistantCards[i].innerText;

  

        if (!assistantText) continue;

  

        nodes.add(formatNode(userText, assistantText));

      }

  

      await waitingQueueGPT.add(nodes);

      return nodes;

    } catch (err) {

      console.error("Error seeking conversation nodes:", err);

      return new Set();

    }

  }

  

// ============================================================================

// UI COMPONENTS

// ============================================================================



function createContextList() {

    const crossURL = chrome.runtime.getURL("assets/cross.svg");

    const toggleLogoURL = chrome.runtime.getURL("assets/crossai.svg");



  const theme = {

    cardBg: "#111",

    textColor: "#ffffff",

    accentColor: "#4f7cff",

    background: "#1F1D1D",

    contextTitleFontSize: "15px",

    contextCounterFontSize: "10px",

    cardWidth: "450px"

  };



  function createCard(turnObject, contextNumber) {

    try {

      const card = document.createElement("div");

      const { user, assistant } = turnObject;

      const platformId = Object.keys(assistant)[0];

      const platformConfig = PLATFORM_CONFIG[platformId];

      const responseText = assistant[platformId];



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

        cursor: "pointer"

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

        flex: "1"

      });



      const logo = document.createElement("img");

      logo.src = chrome.runtime.getURL(platformConfig.assets.icon);

      Object.assign(logo.style, {

        width: "35px",

        height: "35px",

        objectFit: "contain",

        flexShrink: "0"

      });



      const textWrap = document.createElement("div");



      const mainText = document.createElement("div");

      mainText.textContent = extractRelevantTitle(user);

      Object.assign(mainText.style, {

        fontSize: theme.contextTitleFontSize,

        fontWeight: "400",

        maxWidth: "480px"

      });



      const context = document.createElement("div");

      context.textContent = `Context: ${contextNumber}`;

      Object.assign(context.style, {

        fontSize: "16px",

        color: "#9d9ea2",

        marginTop: "6px"

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

        flexShrink: "0"

      });



      const tick = document.createElement("img");

      tick.src = chrome.runtime.getURL(platformConfig.assets.saveIcon);

      Object.assign(tick.style, {

        width: "36px",

        height: "36px",

        padding: "6px",

        cursor: "pointer"

      });



      tick.onclick = (e) => {

        e.stopPropagation();

        waitingQueueGPT.releaseToStorage(turnObject);



        Object.assign(card.style, {

          opacity: "0",

          transform: "translateX(60px)"

        });

        setTimeout(() => card.remove(), 300);

      };



      const close = document.createElement("img");

      close.src = crossURL;

      Object.assign(close.style, {

        width: "26px",

        height: "26px",

        cursor: "pointer"

      });



      close.onclick = (e) => {

        e.stopPropagation();

        Object.assign(card.style, {

          opacity: "0",

          transform: "scale(0.85)"

        });

        setTimeout(() => card.remove(), 300);

      };



      right.appendChild(tick);

      right.appendChild(close);

      card.appendChild(left);

      card.appendChild(right);



      card.onclick = () => {

        showDetailModal(turnObject);

      };



      return card;

    } catch (err) {

      console.error("Error creating card:", err);

      return null;

    }

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

    transition: "all 0.45s cubic-bezier(.22,.61,.36,1)"

  });



  document.body.appendChild(container);



  let open = false;



  function toggleContainer() {

    open = !open;



    if (open) {

      scrollListenerActive = true;

      fetchAvailableContext(); 



      container.style.transition = "transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.3s ease";

      container.style.transformOrigin = "bottom right";

      container.style.transform = "translateY(calc(50vh - 50%)) translateX(0) scale(0.05)";

      container.style.opacity = "0.3";

      container.style.pointerEvents = "auto";



      requestAnimationFrame(() => {

        container.style.transform = "translateY(-50%) translateX(0) scale(1)";

        container.style.opacity = "1";

      });

      disableProseMirrorInput();

    } else {

      scrollListenerActive = false;



      container.style.transition = "transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1), opacity 0.3s ease 0.2s";

      container.style.transformOrigin = "bottom right";

      container.style.transform = "translateY(calc(50vh - 50%)) translateX(0) scale(0.05)";

      container.style.opacity = "0";



      setTimeout(() => {

        container.style.pointerEvents = "none";

        container.style.transform = "translateY(0) scale(0.92)";

      }, 500);



      enableProseMirrorInput();

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

    zIndex: "99999"

  });



  const toggleImg = document.createElement("img");

  toggleImg.src = toggleLogoURL;

  Object.assign(toggleImg.style, {

    width: "100%",

    height: "100%",

    objectFit: "contain"

  });



  toggleButton.appendChild(toggleImg);

  document.body.appendChild(toggleButton);



  toggleButton.onclick = toggleContainer;



  return { container, createCard };

}



function createDetailModal() {

    const modalContainer = document.createElement('div');

    modalContainer.id = 'crossai-detail-modal';

    Object.assign(modalContainer.style, {

        position: 'fixed',

        top: 0,

        left: 0,

        width: '100%',

        height: '100%',

        backgroundColor: 'rgba(0, 0, 0, 0.6)',

        display: 'none',

        alignItems: 'center',

        justifyContent: 'center',

        zIndex: 100000,

    });



    const modalContent = document.createElement('div');

    Object.assign(modalContent.style, {

        background: '#1a1a1a',

        color: 'white',

        padding: '30px',

        borderRadius: '16px',

        width: '90%',

        maxWidth: '700px',

        maxHeight: '80vh',

        display: 'flex',

        flexDirection: 'column',

        gap: '20px',

        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',

    });



    const modalHeader = document.createElement('div');

    Object.assign(modalHeader.style, {

        display: 'flex',

        justifyContent: 'space-between',

        alignItems: 'center',

    });



    const modalTitle = document.createElement('h2');

    modalTitle.textContent = 'Conversation Turn';

    Object.assign(modalTitle.style, { margin: 0, fontSize: '24px', color: '#8265f4' });



    const closeModalBtn = document.createElement('button');

    closeModalBtn.textContent = '×';

    Object.assign(closeModalBtn.style, {

        background: 'none',

        border: 'none',

        color: 'white',

        fontSize: '36px',

        cursor: 'pointer',

        lineHeight: '1',

    });



    modalHeader.appendChild(modalTitle);

    modalHeader.appendChild(closeModalBtn);



    const userSection = document.createElement('div');

    const userHeader = document.createElement('h3');

    userHeader.textContent = 'Your Prompt';

    const userText = document.createElement('pre');

    Object.assign(userText.style, {

        background: '#2a2a2a',

        padding: '15px',

        borderRadius: '8px',

        maxHeight: '25vh',

        overflowY: 'auto',

        whiteSpace: 'pre-wrap',

        wordWrap: 'break-word',

        fontSize: '14px',

    });

    userSection.appendChild(userHeader);

    userSection.appendChild(userText);



    const assistantSection = document.createElement('div');

    const assistantHeader = document.createElement('h3');

    const assistantText = document.createElement('pre');

    Object.assign(assistantText.style, {

        background: '#2a2a2a',

        padding: '15px',

        borderRadius: '8px',

        maxHeight: '25vh',

        overflowY: 'auto',

        whiteSpace: 'pre-wrap',

        wordWrap: 'break-word',

        fontSize: '14px',

    });

    assistantSection.appendChild(assistantHeader);

    assistantSection.appendChild(assistantText);



    modalContent.appendChild(modalHeader);

    modalContent.appendChild(userSection);

    modalContent.appendChild(assistantSection);

    modalContainer.appendChild(modalContent);

    document.body.appendChild(modalContainer);



    const closeModal = () => modalContainer.style.display = 'none';

    closeModalBtn.onclick = closeModal;

    modalContainer.onclick = (e) => {

        if (e.target === modalContainer) {

            closeModal();

        }

    };



    return { modalContainer, userText, assistantHeader, assistantText };

}



function showDetailModal(turnObject) {

    const { user, assistant } = turnObject;

    const platformId = Object.keys(assistant)[0];

    const platformConfig = PLATFORM_CONFIG[platformId];

    const responseText = assistant[platformId];



    modalElements.userText.textContent = user;

    modalElements.assistantHeader.textContent = `Response from ${platformConfig.label}`;

    modalElements.assistantText.textContent = responseText;

    modalElements.modalContainer.style.display = 'flex';

}





let fetchAvailableContext;











// ============================================================================





// MAIN INITIALIZATION





// ============================================================================











let buttonCounter = 0;





let snapShot = [];





let scrollListenerActive = false;





let modalElements;











function resetState() {





    console.log("Resetting state due to navigation change...");





    waitingQueueGPT.queue = [];





    snapShot = [];





    buttonCounter = 0;





    if (uiElements && uiElements.container) {





        uiElements.container.innerHTML = '';





    }





}











if (AI_PLATFORM_ID) {





    fetchAvailableContext = async () => {





        if (!scrollListenerActive) return;





    





        try {





            await seekConversationNodeGPT();





    





            if (waitingQueueGPT.hasChanged()) {





                const notStoredNodes = waitingQueueGPT.getQueue();





                





                const addedNodes = notStoredNodes.filter(x => !snapShot.some(y => JSON.stringify(x) === JSON.stringify(y)));





                





                snapShot = JSON.parse(JSON.stringify(notStoredNodes)); // Deep copy





    





                for (let i = 0; i < addedNodes.length; i++) {





                    buttonCounter++;





                    const card = uiElements.createCard(addedNodes[i], buttonCounter);





                    if (card) {





                        uiElements.container.appendChild(card);





                    }





                }





            }





        } catch (err) {





            console.error("Error fetching available context:", err);





        }





    };











    var uiElements = createContextList(fetchAvailableContext);





    modalElements = createDetailModal();











    document.addEventListener("scroll", fetchAvailableContext, true);











    // Observer to detect chat switching in SPAs





    const observer = new MutationObserver((mutations) => {





        // A simple heuristic: if a lot of nodes are removed, assume it's a page change.





        for (const mutation of mutations) {





            if (mutation.type === 'childList' && mutation.removedNodes.length > 5) {





                resetState();





                fetchAvailableContext();





                break;





            }





        }





    });











    // Start observing the body for subtree changes. This is broad, but effective for SPAs.





    // A more targeted element could be used if a stable one is identified.





    observer.observe(document.body, { childList: true, subtree: true });











}





// ============================================================================

// MESSAGE LISTENER (From popup.js)

// ============================================================================



chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  try {

    switch (msg.action) {

      case "prepareSummary":

        handlePrepareSummary(msg.url, sendResponse);

        return true; 



      case "injectRaw":

        handleInjectRaw(msg.url);

        break;



      case "injectLastSummary":

        handleInjectLastSummary(msg.url);

        break;



      case "clear":

        handleClear(msg.payload.url);

        break;



      default:

        console.warn("Unknown message action:", msg.action);

    }

  } catch (err) {

    console.error("Unexpected error in message listener:", err);

    if (msg.action === "prepareSummary") {

      sendResponse({ success: false });

    }

  }

});



// ============================================================================

// MESSAGE HANDLERS

// ============================================================================



async function handlePrepareSummary(url, sendResponse) {

  try {

    console.log("Preparing summary for:", url);



    const usageResult = await new Promise((resolve) => {

      if (typeof window.checkAndConsumeHit === "function") {

        window.checkAndConsumeHit(resolve);

      } else {

        console.warn("Usage limiter not available, proceeding anyway");

        resolve({ allowed: true, remaining: 0, resetAt: Date.now() });

      }

    });



    if (!usageResult.allowed) {

      const resetDate = new Date(usageResult.resetAt).toLocaleString();

      alert(`Weekly limit reached 🚫\nYou can use summaries again on ${resetDate}`);

      sendResponse({ success: false });

      return;

    }



    const summary = await prepareSummary(url);

    await insertSummaryIntoChromeStorage(summary, url);

    const storedSummary = await getStoredSummary(url);

    injectContext(storedSummary);



    console.log(`Summary injected. Remaining hits: ${usageResult.remaining}`);

    sendResponse({ success: true });

  } catch (err) {

    console.error("Error in handlePrepareSummary:", err);

    sendResponse({ success: false });

  }

}



function handleInjectRaw(url) {

  try {

    console.log("Injecting raw context for:", url);

    injectCode(url);

  } catch (err) {

    console.error("Error in handleInjectRaw:", err);

  }

}



function handleInjectLastSummary(url) {

  try {

    console.log("Injecting last summary for:", url);

    injectLastSummary(url);

  } catch (err) {

    console.error("Error in handleInjectLastSummary:", err);

  }

}



function handleClear(url) {

  try {

    console.log("Clearing storage for:", url);

    deleteStorage(url);

  } catch (err) {

    console.error("Error in handleClear:", err);

  }

}



// ============================================================================

// INJECTION FUNCTIONS

// ============================================================================



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

    } else if (el.setSelectionRange) {

      const length = el.value.length;

      el.setSelectionRange(length, length);

    }

  } catch (err) {

    console.warn("Place cursor error:", err);

  }

}



function getEditor() {

    if (!AI_PLATFORM_CONFIG) return null;

    return document.querySelector(AI_PLATFORM_CONFIG.selectors.inputField);

  }

  



function injectContext(context) {

  try {

    const editor = getEditor();

    if (!editor) return;



    const userInput = getInputText(editor);

    const injectedMessage = `Here is some persistent user context you should always consider:\n\n${context}\n\nUser's query:\n\n${userInput}`;

    setInputText(editor, injectedMessage);

    placeCursorAtEnd(editor);

  } catch (err) {

    console.error("Failed to inject context:", err);

  }

}



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

    placeCursorAtEnd(editor);

  } catch (err) {

    console.error("Set input text error:", err);

  }

}



async function injectCode(url) {

  try {

    const contextData = await getStorage(url);

    const rawText = contextData.map(turn => {

        const platform = Object.keys(turn.assistant)[0];

        const response = turn.assistant[platform];

        return `User: ${turn.user}\n${platform}'s Response: ${response}`;

      }).join("\n\n---\n\n");

    injectContext(rawText);

  } catch (err) {

    console.error("Failed to inject code:", err);

  }

}



async function injectLastSummary(url) {

  try {

    const result = await getStoredSummary(url);

    injectContext(result);

  } catch (err) {

    console.error("Failed to inject last summary:", err);

  }

}