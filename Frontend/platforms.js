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
    color: "#c15f3c",
    domains: ['claude.ai'],
    assets: {
      icon: 'assets/claude.svg',
      saveIcon: 'assets/save_claude.svg',
    },
    selectors: {
      inputField: "div.ProseMirror[role='textbox']",
      getConversationTurns: (doc) => {
        const cards = document.querySelectorAll("#main-content > div > div.h-full.flex.flex-col.overflow-hidden > div > div > div > div.flex-1.flex.flex-col.px-4.max-w-3xl.mx-auto.w-full.pt-1 > div");
        const userCards = [...cards].filter((_, index) => index % 2 === 0);
        const assistantCards = [...cards].filter((_, index) => index % 2 !== 0);
        return { userCards, assistantCards };
      },
    },
  },
  gemini: {
    label: 'Gemini',
    color: "#4285F4",
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
  perplexity: {
    label: 'Perplexity',
    color: "#0e2929",
    domains: ['perplexity.ai'],
    assets: {
      icon: 'assets/perplexity.svg',
      saveIcon: 'assets/save_perplexity.svg',
    },
    selectors: {
      inputField: "#ask-input > p",
      getConversationTurns: (doc) => {

        const userCards = doc.querySelectorAll("#radix-\\:r0\\:-content-default > div > div.bg-base.erp-sidecar\\:pt-0.erp-mobile-sidecar\\:pt-0")
        const assistantCards = doc.querySelectorAll("#radix-\\:r0\\:-content-default > div > div.gap-y-lg.flex.flex-col")

        return { userCards, assistantCards };
      },
    },
  },
  deepseek: {
    label: 'DeepSeek',
    color: "#4D6BFF",
    domains: ['deepseek.com'],
    assets: {
      icon: 'assets/deepseek.svg',
      saveIcon: 'assets/save_deepseek.svg',
    },
    selectors: {
      inputField: "#root > div > div > div.c3ecdb44 > div._7780f2e > div > div._2bd7b35 > div > div.ca1ef5b2.ds-scroll-area > div._871cbca > div.aaff8b8f > div > div > div._24fad49 > textarea",
      getConversationTurns: (doc) => {

        const cards = doc.querySelectorAll("#root > div > div > div.c3ecdb44 > div._7780f2e > div > div._2bd7b35 > div > div.ca1ef5b2.ds-scroll-area > div.dad65929 > div")
        const userCards = [...cards].filter((_, index) => index % 2 === 0)
        const assistantCards = [...cards].filter((_, index) => index % 2 === 1);

        return { userCards, assistantCards };
      },
    },
  },
  notebooklm: {
    label: 'NotebookLM',
    color: "#050b16",
    domains: ['notebooklm.google.com'],
    assets: {
      icon: 'assets/notebooklm.svg',
      saveIcon: 'assets/save_notebooklm.svg',
    },
    selectors: {
      inputField: "#mat-tab-group-0-content-1 > div > div > chat-panel > omnibar > div > div > div > query-box > div > div > form > div > textarea",
      getConversationTurns: (doc) => {

        const cards = doc.querySelectorAll("body > labs-tailwind-root > div > notebook > div > section.chat-panel.ng-tns-c3864633884-0 > chat-panel > div.chat-panel-content > .chat-message-pair");
        const userCards = Array.from(cards).map(card => card.firstElementChild);
        const assistantCards = Array.from(cards).map(card => card.children[1]);

        return { userCards, assistantCards };
      },
    },
  }
};



