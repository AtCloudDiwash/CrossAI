// usageLimiter.js

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_HITS = 3;

function checkAndConsumeHit(callback) {
    chrome.storage.local.get(["usage"], (res) => {
        const now = Date.now();
        let usage = res.usage || { count: 0, weekStart: now };

        if (now - usage.weekStart >= WEEK_MS) {
            usage.count = 0;
            usage.weekStart = now;
        }

        if (usage.count >= MAX_HITS) {
            callback({
                allowed: false,
                remaining: 0,
                resetAt: usage.weekStart + WEEK_MS
            });
            return;
        }

        usage.count += 1;
        chrome.storage.local.set({ usage }, () => {
            callback({
                allowed: true,
                remaining: MAX_HITS - usage.count,
                resetAt: usage.weekStart + WEEK_MS
            });
        });
    });
}

// Expose function to content script
window.checkAndConsumeHit = checkAndConsumeHit;
