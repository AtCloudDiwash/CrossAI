const TELEMETRY_ENDPOINT = "https://crossaibackend.onrender.com/telemetry";
const TELEMETRY_INGEST_TOKEN = "ee9a3b42f9dc3a5ca78a05033fbc2fc0daf30d71c33568701905a035cb5b2314";

function trackTelemetryEvent(event, properties = {}) {
  try {
    const payload = {
      event,
      version: chrome.runtime.getManifest().version,
      ...properties,
    };

    fetch(TELEMETRY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CrossAI-Telemetry-Key": TELEMETRY_INGEST_TOKEN,
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch (err) {
    console.warn("Telemetry event failed:", err);
  }
}
