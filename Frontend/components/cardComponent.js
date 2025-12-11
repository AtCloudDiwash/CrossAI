// ======================================================
//  Editable Resources (PUT YOUR IMAGE URLS HERE)
// ======================================================
const logoURL  = chrome.runtime.getURL("../assets/gemini.svg");
const tickURL  = chrome.runtime.getURL("../assets/save_gemini.svg");
const crossURL = chrome.runtime.getURL("../assets/cross.svg");

// ======================================================
//  Editable Theme Variables
// ======================================================
const theme = {
  cardBg: "#111",
  textColor: "#ffffff",
  accentColor: "#4f7cff",
  background: "#d0ced0",
  contextTitleFontSize: "15px",
  contextCounterFontSize: "10px",
  cardWidth: "450px"
};

// ======================================================
//  Create Card Component
// ======================================================
function createCard(text, contextNumber, onSave, onRemove) {
  const card = document.createElement("div");
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
  });

  // LEFT SIDE
  const left = document.createElement("div");
  Object.assign(left.style, {
    display: "flex",
    gap: "18px",
    alignItems: "center",
  });

  // Gemini Logo (image)
  const logo = document.createElement("img");
  logo.src = logoURL;
  Object.assign(logo.style, {
    width: "42px",
    height: "42px",
    objectFit: "contain",
  });

  // Text container
  const textWrap = document.createElement("div");

  const mainText = document.createElement("div");
  mainText.textContent = text;
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

  // RIGHT SIDE
  const right = document.createElement("div");
  Object.assign(right.style, {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  });

  // Tick image
  const tick = document.createElement("img");
  tick.src = tickURL;
  Object.assign(tick.style, {
    width: "36px",
    height: "36px",
    padding: "6px",
    boxSizing: "border-box",
    cursor: "pointer",
  });
  
  // Save handler
  tick.onclick = () => {
    if (onSave) onSave(card);
  };

  // Close/Cancel image
  const close = document.createElement("img");
  close.src = crossURL;
  Object.assign(close.style, {
    width: "26px",
    height: "26px",
    cursor: "pointer",
    objectFit: "contain",
  });
  
  // Remove handler
  close.onclick = () => {
    if (onRemove) onRemove(card);
    card.remove();
  };

  right.appendChild(tick);
  right.appendChild(close);

  card.appendChild(left);
  card.appendChild(right);

  return card;
}

// ======================================================
//  Create Container
// ======================================================
function createCardContainer() {
  const container = document.createElement("div");
  Object.assign(container.style, {
    background: theme.background,
    padding: "20px",
    maxHeight: "60vh",
    display: "inline-block",
    overflow: "scroll"
  });
  
  return container;
}

// ======================================================
//  Export functions
// ======================================================
export { createCard, createCardContainer, theme };