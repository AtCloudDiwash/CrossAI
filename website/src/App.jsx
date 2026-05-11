import React, { useEffect, useMemo, useRef, useState } from "react";
import crossAiLogo from "./assets/crossai.svg";
import chatgptIcon from "./assets/chatgpt.svg";
import claudeIcon from "./assets/claude.svg";
import geminiIcon from "./assets/gemini.svg";
import perplexityIcon from "./assets/perplexity.svg";
import deepseekIcon from "./assets/deepseek.svg";
import notebookIcon from "./assets/notebooklm.svg";

const DEMO_VIDEO_ID = "26ijnUeYeo8";
const DOWNLOAD_URL =
  "https://chromewebstore.google.com/detail/pamdbobienmhnlmfelijbfigmckogjkh?utm_source=item-share-cb";
const PRIVACY_POLICY_URL =
  "https://github.com/AtCloudDiwash/CrossAI-privacy-policy#privacy-policy";

const platforms = [
  { name: "ChatGPT", icon: chatgptIcon, className: "chatgpt" },
  { name: "Claude", icon: claudeIcon, className: "claude" },
  { name: "Gemini", icon: geminiIcon, className: "gemini" },
  { name: "Perplexity", icon: perplexityIcon, className: "perplexity" },
  { name: "DeepSeek", icon: deepseekIcon, className: "deepseek" },
  { name: "NotebookLM", icon: notebookIcon, className: "notebook" }
];

const features = [
  {
    label: "Save Context",
    title: "Capture the useful parts of any AI conversation.",
    copy: "Keep decisions, constraints, and solved details from supported AI tabs without copy-paste sprawl."
  },
  {
    label: "Summarize",
    title: "Turn raw turns into a clean memory block.",
    copy: "Cross AI structures saved context so the next assistant can understand the work immediately."
  },
  {
    label: "Inject Anywhere",
    title: "Move from one model to another with continuity.",
    copy: "Send your imported memory into another AI platform and keep the project moving."
  }
];

function useScrollProgress() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setScrollY(window.scrollY));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return scrollY;
}

function useReveal() {
  useEffect(() => {
    const targets = document.querySelectorAll("[data-reveal]");
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.16 }
    );

    targets.forEach(target => observer.observe(target));
    return () => observer.disconnect();
  }, []);
}

function Header() {
  return (
    <header className="site-header" aria-label="Main navigation">
      <a className="brand" href="#home" aria-label="Cross AI home">
        <img src={crossAiLogo} alt="" />
        <span>Cross AI</span>
      </a>

      <nav className="nav-links">
        <a href="#home">Home</a>
        <a href="#features">Features</a>
        <a href={PRIVACY_POLICY_URL} target="_blank" rel="noreferrer">
          Privacy Policy
        </a>
      </nav>

      <a className="nav-download" href={DOWNLOAD_URL} target="_blank" rel="noreferrer">
        Download Extension
      </a>
    </header>
  );
}

function Hero({ scrollY }) {
  const parallax = Math.min(scrollY * 0.16, 120);

  return (
    <section className="hero section-band" id="home">
      <div
        className="hero-grid"
        style={{ "--hero-shift": `${parallax}px` }}
      >
        <div className="hero-copy" data-reveal>
          <p className="eyebrow">Browser extension for AI continuity</p>
          <h1>
            Cross AI
            <span>Your Context travels with you</span>
          </h1>
          <p className="hero-text">
            Save conversation context from one AI platform, transform it into a
            portable memory block, and inject it into another assistant when
            your work needs a better fit.
          </p>

          <div className="hero-actions">
            <a className="primary-cta" href={DOWNLOAD_URL} target="_blank" rel="noreferrer">
              Download Extension
            </a>
            <a className="secondary-cta" href="#how-it-works">
              See how it works
            </a>
          </div>
        </div>

        <div className="hero-symbol-wrap" data-reveal>
          <div className="hero-symbol" aria-hidden="true">
            <img src={crossAiLogo} alt="" />
            <span className="logo-ring ring-one" />
            <span className="logo-ring ring-two" />
            <span className="logo-ring ring-three" />
          </div>
          <div className="hero-status">
            <span>Context bridge active</span>
            <strong>6 platforms connected</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

function PlatformOrbit() {
  return (
    <div className="platform-orbit" aria-label="Supported AI platforms">
      <div className="orbit-center">
        <img src={crossAiLogo} alt="Cross AI" />
      </div>

      {platforms.map((platform, index) => (
        <div
          className={`orbit-node ${platform.className}`}
          style={{ "--node-index": index }}
          key={platform.name}
        >
          <img src={platform.icon} alt="" />
          <span>{platform.name}</span>
        </div>
      ))}

      <span className="travel-packet packet-one">memory</span>
      <span className="travel-packet packet-two">summary</span>
      <span className="travel-packet packet-three">context</span>
    </div>
  );
}

function ContextExchange() {
  const savedItems = useMemo(
    () => [
      "User goal: launch Cross AI website",
      "Decision: modern dark theme",
      "Constraint: context must travel across platforms"
    ],
    []
  );

  return (
    <section className="context-section section-band" id="context-flow">
      <div className="section-heading" data-reveal>
        <p className="eyebrow">Context extraction</p>
        <h2>Watch saved context become portable memory.</h2>
      </div>

      <div className="context-lab" data-reveal>
        <div className="extraction-panel">
          <div className="panel-topline">
            <span>Active conversation</span>
            <strong>ChatGPT</strong>
          </div>
          {savedItems.map((item, index) => (
            <div className="context-row" style={{ "--delay": `${index * 0.7}s` }} key={item}>
              <span className="row-index">0{index + 1}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>

        <div className="memory-core">
          <div className="memory-card">
            <span className="memory-label">Imported Memory</span>
            <p>
              Source Platform: ChatGPT
              <br />
              Goal, decisions, constraints, and next steps preserved.
            </p>
          </div>
          <span className="flow-dot dot-a" />
          <span className="flow-dot dot-b" />
          <span className="flow-dot dot-c" />
        </div>

        <div className="injection-panel">
          <div className="panel-topline">
            <span>Inject into</span>
            <strong>Claude</strong>
          </div>
          <div className="injection-box">
            <span className="typing-line line-one" />
            <span className="typing-line line-two" />
            <span className="typing-line line-three" />
            <button type="button">Summarize & Inject</button>
          </div>
        </div>
      </div>

      <PlatformOrbit />
    </section>
  );
}

function Features() {
  return (
    <section className="features section-band" id="features">
      <div className="section-heading" data-reveal>
        <p className="eyebrow">Features</p>
        <h2>Built for people who switch models without losing the thread.</h2>
      </div>

      <div className="feature-grid">
        {features.map(feature => (
          <article className="feature-card" data-reveal key={feature.label}>
            <span>{feature.label}</span>
            <h3>{feature.title}</h3>
            <p>{feature.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function DemoVideo() {
  return (
    <section className="demo section-band" id="how-it-works">
      <div className="demo-copy" data-reveal>
        <p className="eyebrow">See how it works</p>
        <h2>From saved turns to a fresh AI session in one flow.</h2>
        <p>
          Watch Cross AI collect useful context, convert it into portable
          memory, and inject it into the platform you choose next.
        </p>
      </div>

      <div className="video-shell" data-reveal>
        {DEMO_VIDEO_ID ? (
          <iframe
            title="Cross AI product walkthrough"
            src={`https://www.youtube.com/embed/${DEMO_VIDEO_ID}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className="video-placeholder" aria-label="Cross AI demo video placeholder">
            <span className="play-glyph" />
            <strong>Cross AI walkthrough</strong>
          </div>
        )}
      </div>
    </section>
  );
}

function PrivacyPolicy() {
  return (
    <section className="privacy section-band" id="privacy">
      <div className="privacy-copy" data-reveal>
        <p className="eyebrow">Privacy Policy</p>
        <h2>Designed around explicit saves and local extension storage.</h2>
        <p>
          Cross AI stores saved context in Chrome local storage for the active
          extension experience. Saved turns are sent to the summary endpoint
          only when a user chooses to prepare a portable memory handoff.
        </p>
        <a className="policy-link" href={PRIVACY_POLICY_URL} target="_blank" rel="noreferrer">
          Read full privacy policy
        </a>
      </div>

      <div className="policy-list" data-reveal>
        <div>
          <span>01</span>
          <p>No database-backed profile is required for saved context.</p>
        </div>
        <div>
          <span>02</span>
          <p>Users decide which detected context cards should be saved.</p>
        </div>
        <div>
          <span>03</span>
          <p>The extension supports a weekly usage limiter for summary actions.</p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <a className="brand" href="#home" aria-label="Cross AI home">
        <img src={crossAiLogo} alt="" />
        <span>Cross AI</span>
      </a>
      <a href={DOWNLOAD_URL} target="_blank" rel="noreferrer">
        Download Extension
      </a>
    </footer>
  );
}

export default function App() {
  const scrollY = useScrollProgress();
  const appRef = useRef(null);

  useReveal();

  useEffect(() => {
    if (appRef.current) {
      appRef.current.style.setProperty("--scroll-y", `${scrollY}px`);
    }
  }, [scrollY]);

  return (
    <div className="app" ref={appRef}>
      <div className="page-ambient" aria-hidden="true" />
      <Header />
      <main>
        <Hero scrollY={scrollY} />
        <ContextExchange />
        <Features />
        <DemoVideo />
        <PrivacyPolicy />
      </main>
      <Footer />
    </div>
  );
}
