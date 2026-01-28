# CrossAI

A browser extension that enables users to save and transfer AI conversation context between platforms (ChatGPT, Claude, and Gemini).

## Features

- **Save Conversations**: Extract and save AI conversations locally with a single click
- **Summarize**: Generate concise summaries of your conversations using Google's Gemini LLM
- **Transfer Context**: Inject saved or summarized context directly into any supported AI platform
- **Local Storage**: All data remains on your device—nothing is stored on our servers permanently
- **Usage Limits**: Built-in rate limiting (3 summaries per week) to prevent abuse

## Supported Platforms

- ChatGPT (chat.openai.com, chatgpt.com)
- Claude (claude.ai)
- Google Gemini (gemini.google.com)

## Installation

1. Clone this repository or download as ZIP (You can delete the backend folder)
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the extension folder
5. CrossAI is now installed!

## How to Use

### Save Conversations
1. Navigate to any supported AI platform
2. Open a conversation
3. Click the CrossAI floating button (bottom right)
4. Click the white checkmark button to save context
5. Saved conversations appear in your extension popup

### Inject Raw Context
1. Click the **"Inject raw"** link in the popup
2. Your saved context is instantly injected into the current chat input

### Summarize & Inject
1. Click **"Summarize & Inject"** in the popup
2. Your saved context is sent to our backend for summarization
3. The summary is returned and injected into the chat input
4. Limit: 3 summaries per week

### Access Last Summary
1. Click **"last summary"** to quickly inject your previously generated summary
2. No re-processing needed

### Clear Data
1. Click **"Clear all"** to delete all saved contexts for that platform
2. Or clear all Chrome extension data via Settings → Advanced → Clear browsing data

---

# Privacy Policy

**Last Updated:** December 22, 2025

## Overview

CrossAI is a browser extension that enables users to save, and transfer AI conversation context between platforms (ChatGPT, Claude, and Gemini). This privacy policy explains how we collect, use, store, and protect your data. Your privacy is our highest priority, and we are committed to transparency about our data practices.

## 1. What Data We Collect

### 1.1 Conversation Context
When you use CrossAI, the extension:
- Reads conversation text from supported AI platforms (ChatGPT, Claude, Gemini)
- Stores locally the conversations you explicitly choose to save using the "Save" feature
- Does NOT automatically collect or store any conversation data without your action

### 1.2 How Data is Collected
- Data is only extracted when you click the "White Tick" button in the extension UI
- Data is only sent to backend and processed when you explicitly click "Summarize & Inject"
- The extension does NOT track, log, or record which conversations you view—only those you explicitly save

### 1.3 Technical Identifiers
- **Browser Storage**: Chrome's local storage API stores your saved contexts locally

### 1.4 Usage Metrics
- **Usage Limit Tracking**: The extension tracks how many times you use the "Summarize & Inject" feature (limited to 3 uses per week) to prevent heavy and excessive use. This is stored locally in your browser and is NOT sent to our servers.

## 2. How We Use Your Data

### 2.1 Local Processing (On Your Device)
- **"Save" Feature**: Conversations you save remain entirely on your device in Chrome's local storage
- **"Inject Raw" Feature**: No backend processing occurs; your saved context is injected directly into the supported AI platform, directly from the chrome storage.
- All local data is under your control and never leaves your device unless explicitly sent via summarization

### 2.2 Backend Processing (When You Choose "Summarize & Inject")
When you click "Summarize & Inject", the following occurs:
1. Your saved conversation context is sent to our backend (hosted on Render.com)
2. The context is passed to Google's Gemini 2.5 Flash LLM for summarization only
3. The summarized text is returned to your browser and injected into your active chat session
4. You then have the option to submit this summary to the AI platform of your choice

**We do NOT:**
- Store your original conversation context on our servers permanently
- Use your data for training, analytics, or any purpose other than summarization
- Share your data with third parties
- Log or monitor the content of your conversations
- Build a profile of your usage patterns

### 2.3 Data Retention on Backend
- Conversation context is held in memory during processing only and is deleted immediately after summarization
- No conversation data is written to a persistent database
- Summary requests are not logged with content details (only request counts for rate-limiting)

## 3. Data Storage

### 3.1 Local Storage (Your Device)
- **Where**: Chrome's chrome.storage.local API
- **What**: Conversation contexts you save, usage counts, and installation metadata
- **Security**: Chrome's storage API provides OS-level protection
- **Duration**: Until you manually clear it or uninstall the extension
- **Control**: You can delete any saved context at any time via the extension's "Clear" button

**Summary Storage and the "Last Summary" Feature:**
When you use "Summarize & Inject", the generated summary is stored in Chrome's local storage on your device. This allows you to:
- Access your last generated summary via the **"Last Summary"** button without needing to regenerate it
- Quickly inject the summary into any supported AI platform
- Reference your previous summarization without additional processing

The summary is stored **locally on your device only**. It is NOT sent back to our servers for storage. Once you generate a summary, you own that data completely and can delete it at any time using the extension's built-in deletion features.

### 3.2 Server Storage (Our Backend)
- **Currently**: We operate a **databaseless backend**. Conversation context is processed in memory and not persisted
- **Future**: If we implement data persistence, we will:
  - Obtain explicit written consent before storing any data
  - Encrypt all data in transit (HTTPS) and at rest
  - Provide a clear data deletion mechanism in the extension
  - Limit retention to the minimum necessary period
  - Notify users through the extension and Chrome Web Store

## 4. Third-Party Services

### 4.1 Gemini LLM (Google)
- **Service**: Used for summarization when you click "Summarize & Inject"
- **Data Shared**: Only the conversation context you explicitly chose to summarize
- **Google's Policy**: Processing is subject to Google's terms of service and privacy policy
- **No Additional Tracking**: We do not identify you to Google; requests are sent anonymously

### 4.2 Render.com (Backend Hosting)
- **Service**: Hosts our summarization API
- **Data**: Processes requests but does not persistently store user conversation data
- **No Direct Exposure**: Render.com does not have independent access to your conversations

### 4.3 Chrome Web Store (Google)
- **Service**: Extension distribution and analytics
- **Data Shared**: Standard extension usage metrics (installations, uninstalls)
- **Subject to**: Google's Chrome Web Store terms and privacy policy

**No Other Third Parties**: CrossAI does not partner with or share data with advertising networks, analytics providers, or other services.

## 5. User Control and Privacy Rights

### 5.1 What You Can Do
- **Opt-Out of Summarization**: Simply don't click "Summarize & Inject"—the extension functions fully with local-only processing
- **Delete Saved Data**: Click the "Clear all" button to delete all contexts for a specific platform
- **Clear Browser Storage**: Clear your Chrome extension data via Settings → Advanced → Clear browsing data
- **Uninstall**: Removing the extension deletes all stored data

### 5.2 Your Rights
- **Access**: You have direct access to all data stored in your browser via the extension UI
- **Deletion**: You can delete any saved context or your entire data at any time
- **No Selling**: We never sell, rent, or share your conversation data
- **No Tracking**: We do not track you across the web or build behavioral profiles
- **Transparency**: This policy explains exactly what happens to your data

## 6. Security Measures

### 6.1 Data in Transit
- **HTTPS Encryption**: All data sent to our backend is encrypted using TLS/HTTPS
- **No Interception**: Communication is protected from man-in-the-middle attacks

### 6.2 Data at Rest
- **Local Storage**: Protected by Chrome's built-in security model and your operating system
- **Server-Side**: Our backend does not persistently store conversation data, eliminating long-term storage risks

### 6.3 Future Improvements
- If we implement persistent storage, all data will be encrypted at rest
- We will implement role-based access controls to limit who can access backend systems
- Regular security audits will be conducted

## 7. International Privacy Laws

### 7.1 GDPR Compliance (European Users)
If you are in the European Union:
- You have the right to access, correct, or delete your personal data
- You have the right to withdraw consent at any time
- You have the right to data portability
- Contact us (email below) to exercise these rights

### 7.2 CCPA Compliance (California Users)
If you are in California:
- You have the right to know what personal information is collected
- You have the right to delete personal information
- You have the right to opt-out of data sales (though we do not sell data)
- Contact us (email below) to exercise these rights

### 7.3 Other Jurisdictions
We comply with all applicable privacy laws in your jurisdiction. If your local laws provide stronger privacy protections, those protections apply to you.

## 8. Changes to This Policy

We may update this privacy policy as CrossAI evolves, new features are added, or legal requirements change. When we make material changes, we will:
- Update the "Last Updated" date at the top
- Notify you through the extension UI (if the change significantly affects data handling)
- Post the updated policy on our website and GitHub
- Request your consent if required by law

Your continued use of CrossAI after updates constitutes acceptance of the revised policy.

## 9. Data Breach Notification

In the unlikely event of a data breach involving user information, we will:
- Notify affected users as soon as possible (within 72 hours if required by law)
- Provide details about the incident and steps we've taken to remediate it
- Offer support and resources if necessary

## 10. Contact & Requests

For questions, concerns, or requests related to this privacy policy:

**Email**: diwash.kuskusmiya@gmail.com  
**Response Time**: We aim to respond within 7 business days

## 11. Jurisdiction and Dispute Resolution

This privacy policy is governed by the laws applicable in your jurisdiction. If you have a dispute about our privacy practices, we encourage you to first contact us directly. If we cannot resolve the issue, you may have the right to lodge a complaint with your local data protection authority.

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

Found a bug? Have a feature request? Open an issue on GitHub!

---

**Version**: 1.0  
**Status**: Ready for Chrome Web Store  
**Last Updated**: December 22, 2025
