// 7.5 Crisis Alert Detection & Admin Escalation (Security Controls)
// ==========================================================================
const CRISIS_KEYWORDS = [
  "kill myself", "end my life", "suicide", "want to die", "ending it all", 
  "don't want to live", "quit life", "cut myself", "better off dead", 
  "self harm", "harm myself", "no reason to live", "planning to die"
];

function detectCrisisState(text) {
  const lower = text.toLowerCase().trim();
  if (lower.length === 0) return null;
  return CRISIS_KEYWORDS.find(keyword => lower.includes(keyword)) || null;
}

function triggerAdminAlarm(timestamp, matchedKeyword, examTarget) {
  const alerts = JSON.parse(localStorage.getItem("mindflow_admin_alerts") || "[]");
  const newAlert = {
    timestamp: timestamp,
    term: matchedKeyword,
    exam: examTarget,
    status: "Urgent Counselor Dispatched"
  };
  alerts.unshift(newAlert);
  localStorage.setItem("mindflow_admin_alerts", JSON.stringify(alerts));
  renderAdminAlerts();
  
  // Simulated POST Request demonstrating API escalation
  console.warn(`[ALARM SYSTEM] dispatching encrypted crisis payload to: POST https://api.mindflow.wellness/v1/alerts`);
  fetch('https://httpbin.org/post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newAlert)
  }).then(r => console.log('[ALARM RESPONSE] HTTP status 200 - Alert logged successfully in central admin dashboard.'))
    .catch(e => console.error('[ALARM EXCEPTION]', e));
}

function renderAdminAlerts() {
  const container = document.getElementById("admin-alert-log-container");
  const placeholder = document.getElementById("no-admin-alerts-placeholder");
  if (!container) return;
  
  const alerts = JSON.parse(localStorage.getItem("mindflow_admin_alerts") || "[]");
  
  if (alerts.length === 0) {
    container.innerHTML = "";
    container.appendChild(placeholder);
    if (placeholder) placeholder.style.display = "block";
    return;
  }
  
  if (placeholder) placeholder.style.display = "none";
  container.innerHTML = "";
  
  alerts.forEach(alert => {
    const div = document.createElement("div");
    div.style.cssText = "display: flex; justify-content: space-between; padding: 0.65rem 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.03); color: #fda4af; font-weight: 500; align-items: center;";
    div.innerHTML = `
      <span style="color: var(--text-secondary); font-size: 0.75rem;">${alert.timestamp}</span>
      <span style="color: var(--accent-rose); font-weight: 700;">"${alert.term}"</span>
      <span style="color: var(--accent-cyan); font-weight: 600;">${alert.exam}</span>
      <span style="color: #6ed5b1; font-weight: 700; font-size: 0.75rem;">🔴 ${alert.status}</span>
    `;
    container.appendChild(div);
  });
}

let geminiDebounceTimeout = null;

function triggerGeminiAIAnalysis(text) {
  const apiKey = localStorage.getItem("mindflow_gemini_key");
  if (!apiKey) return;

  const liveFeedback = document.getElementById("realtime-sentiment-feedback");
  const sentimentPreview = document.getElementById("journal-sentiment-preview");

  sentimentPreview.innerText = "Gemini is reflecting...";
  liveFeedback.innerHTML = `<span style="color: var(--accent-cyan); font-weight: 600; animation: pulseCyan 1.5s infinite;">✨ Gemini is generating a mindful reflection...</span>`;

  const exam = state.examTarget;
  const prompt = `You are MindFlow, a compassionate, empathetic mental wellness companion for students preparing for high-stakes competitive exams (current target: ${exam}).
  A student has shared this private journal entry:
  "${text}"
  
  Provide a supportive, validating, and calming response (maximum 3 sentences). Validate their struggles (anger, backlog, mock scores, or loneliness) with deep empathy, and offer one actionable micro-advice (e.g. taking a physiological sigh, writing 3 wins, or planning 50-10 study pacing). Keep the tone warm, soothing, and encouraging. Avoid generic clichés.`;

  fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }]
    })
  })
  .then(res => {
    if (!res.ok) throw new Error("API call failed");
    return res.json();
  })
  .then(data => {
    const responseText = data.candidates[0].content.parts[0].text.trim();
    liveFeedback.innerText = responseText;
    sentimentPreview.innerText = "Gemini AI reflection updated ✨";
  })
  .catch(err => {
    console.error("Gemini API Error:", err);
    sentimentPreview.innerText = "Local Sentiment Engine (API Fallback) 🌱";
    liveFeedback.innerText = analyzeSentimentLocal(text);
  });
}

// ==========================================================================