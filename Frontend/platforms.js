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
      getConversationTurns: (doc) => {
        const turnCards = [...doc.querySelectorAll("article[data-turn], section[data-turn]")];
        let userCards = turnCards.filter(c => c.dataset.turn === 'user');
        let assistantCards = turnCards.filter(c => c.dataset.turn === 'assistant');

        if (userCards.length === 0 || assistantCards.length === 0) {
          const roleCards = [...doc.querySelectorAll("[data-message-author-role]")];
          userCards = roleCards.filter(c => c.getAttribute("data-message-author-role") === "user");
          assistantCards = roleCards.filter(c => c.getAttribute("data-message-author-role") === "assistant");
        }

        return { userCards, assistantCards };
      },
      setInputText: (text) => {
        const el = document.querySelector('#prompt-textarea');
        if (!el) return;
        el.innerText = text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
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
      setInputText: (text) => {
        const el = document.querySelector("div.ProseMirror[role='textbox']");
        if (!el) return;
        el.innerText = text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
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
      setInputText: (text) => {
        const el = document.querySelector("rich-textarea .ql-editor");
        if (!el) return;
        el.innerText = text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
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
        const cards = doc.querySelectorAll("#root > div > div > div > main > div > div.mx-auto.flex.w-full.flex-col.h-full > div > div.scrollable-container.flex.flex-1.basis-0.overflow-auto.\\[scrollbar-gutter\\:stable\\].scrollbar-subtle > div > div.\\@container.isolate > div > div.mx-auto.flex.flex-col.pointer-events-auto.max-w-threadContentWidth.gap-md.md\\:gap-lg > div > div");

        const userCards = [];
        const assistantCards = [];

        cards.forEach(card => {
          const userEl = card.querySelector(".bg-base.erp-sidecar\\:pt-0.erp-mobile-sidecar\\:pt-0");
          const assistantEl = card.querySelector(".gap-y-lg.flex.flex-col");

          if (userEl) userCards.push(userEl);
          if (assistantEl) assistantCards.push(assistantEl);
        });

        return { userCards, assistantCards };
      },
      setInputText: (text) => {
        const el = document.querySelector("#ask-input");
        if (!el) return;

        el.focus();

        // This is what inserts the text
        el.dispatchEvent(new InputEvent('beforeinput', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: text
        }));

        // This just notifies of change — no insertText type
        el.dispatchEvent(new InputEvent('input', { bubbles: true }));

        el.dispatchEvent(new Event('change', { bubbles: true }));
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
      inputField: "#root > div > div > div.c3ecdb44 > div._7780f2e > div > div.ds-virtual-list.ds-virtual-list--printable._2bd7b35 > div._871cbca > div.aaff8b8f > div > div > div._24fad49 > textarea",
      getConversationTurns: (doc) => {

        const cards = doc.querySelectorAll("#root > div > div > div.c3ecdb44 > div._7780f2e > div > div.ds-virtual-list.ds-virtual-list--printable._2bd7b35 > div.ds-virtual-list-items > div > div")
        const userCards = [...cards].filter((_, index) => index % 2 === 0)
        const assistantCards = [...cards].filter((_, index) => index % 2 === 1);

        return { userCards, assistantCards };
      },
      setInputText: (text) => {
        const el = document.querySelector("#root > div > div > div.c3ecdb44 > div._7780f2e > div > div.ds-virtual-list.ds-virtual-list--printable._2bd7b35 > div._871cbca > div.aaff8b8f > div > div > div._24fad49 > textarea");
        if (!el) return;
        el.focus();
        el.setRangeText(text);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.setSelectionRange(el.value.length, el.value.length);
      },
    },
  },
};


