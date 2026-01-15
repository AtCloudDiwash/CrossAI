// platforms.js

const PLATFORM_CONFIG = {
  chatgpt: {
    label: 'ChatGPT',
    color: "#643CF5",
    domains: ['chat.openai.com', 'chatgpt.com'],
    assets: {
      icon: 'assets/chatgpt.svg',
      saveIcon: 'assets/save_chatgpt.svg',
    },
    selectors: {
      inputField: '#prompt-textarea',
      // A dedicated function to handle finding conversation turns
      getConversationTurns: (doc) => {
        const cards = doc.querySelectorAll("article");
        const userCards = [...cards].filter(c => c.dataset.turn === 'user');
        const assistantCards = [...cards].filter(c => c.dataset.turn === 'assistant');
        return { userCards, assistantCards };
      },
    },
  },
  claude: {
    label: 'Claude',
    color: "#643CF5",
    domains: ['claude.ai'],
    assets: {
      icon: 'assets/claude.svg',
      saveIcon: 'assets/save_claude.svg',
    },
    selectors: {
      inputField: "div.ProseMirror[role='textbox']",
      getConversationTurns: (doc) => {
          const cards = doc.querySelectorAll(
            "body > div.root > div > div.w-full.relative.min-w-0 > div > div.h-full.flex.flex-col.overflow-hidden > div > div > div > div.flex-1.flex.flex-col.px-4.max-w-3xl.mx-auto.w-full.pt-1 > div[data-test-render-count]"
          );
          const userCards = [...cards].filter((_, index) => index % 2 === 0);
          const assistantCards = [...cards].filter((_, index) => index % 2 !== 0);
          return { userCards, assistantCards };
      },
    },
  },
  gemini: {
    label: 'Gemini',
    color: "#643CF5",
    domains: ['gemini.google.com'],
    assets: {
      icon: 'assets/gemini.svg',
      saveIcon: 'assets/save_gemini.svg',
    },
    selectors: {
      inputField: "rich-textarea .ql-editor",
      getConversationTurns: (doc) => {
          const cards = doc.querySelectorAll(
            "#chat-history infinite-scroller > div:has(user-query):has(model-response)"
          );
          const userCards = [...cards].map((userCard) => userCard.querySelector("user-query"));
          const assistantCards = [...cards].map((assistantCard) =>
            assistantCard.querySelector("model-response")
          );
          return { userCards, assistantCards };
      },
    },
  },
};
