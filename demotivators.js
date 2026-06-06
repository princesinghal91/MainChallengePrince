// 7.8 Demotivator Practical Solutions & Persistence
// ==========================================================================
function renderMockErrors() {
  const list = document.getElementById("mock-errors-list");
  if (!list) return;
  const errors = JSON.parse(localStorage.getItem("mindflow_mock_errors") || "[]");
  if (errors.length === 0) {
    list.innerHTML = `<span style="color: var(--text-muted); font-style: italic; font-size: 0.75rem;">No mock test errors logged yet. List errors to tackle them conceptually!</span>`;
    return;
  }
  list.innerHTML = errors.map((err, index) => `
    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); border: 1px solid var(--card-border); padding: 0.4rem 0.65rem; border-radius: var(--radius-sm); font-size: 0.78rem; gap: 0.5rem; margin-bottom: 0.25rem;">
      <span style="color: var(--text-primary);">
        <strong style="color: var(--accent-amber); font-weight: 700;">[${err.cause}]</strong> ${err.topic}
        <span style="font-size: 0.68rem; color: var(--text-muted); margin-left: 0.25rem;">(${err.time})</span>
      </span>
      <button class="btn-delete-err" data-index="${index}" style="background: none; border: none; color: var(--accent-rose); cursor: pointer; font-size: 1.1rem; padding: 0 0.2rem; font-weight: 700; line-height: 1;">&times;</button>
    </div>
  `).join("");
  
  // Add delete listeners
  list.querySelectorAll(".btn-delete-err").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-index"));
      errors.splice(idx, 1);
      localStorage.setItem("mindflow_mock_errors", JSON.stringify(errors));
      renderMockErrors();
      playCalmBell();
    });
  });
}

function saveWins() {
  const wins = {};
  for (let i = 1; i <= 3; i++) {
    const checkbox = document.getElementById(`win-check-${i}`);
    const textInput = document.getElementById(`win-text-${i}`);
    if (checkbox) wins[`check-${i}`] = checkbox.checked;
    if (textInput) wins[`text-${i}`] = textInput.value;
  }
  localStorage.setItem("mindflow_tiny_wins", JSON.stringify(wins));
}

// Keep stretch checks synced in local storage
function saveStretches() {
  const stretches = {};
  for (let i = 1; i <= 3; i++) {
    const checkbox = document.getElementById(`stretch-check-${i}`);
    if (checkbox) stretches[`check-${i}`] = checkbox.checked;
  }
  localStorage.setItem("mindflow_stretch_checks", JSON.stringify(stretches));
}

function saveOaths() {
  const oaths = {};
  for (let i = 1; i <= 2; i++) {
    const checkbox = document.getElementById(`oath-check-${i}`);
    if (checkbox) oaths[`check-${i}`] = checkbox.checked;
  }
  localStorage.setItem("mindflow_oath_checks", JSON.stringify(oaths));
}

function initDemotivatorsData() {
  renderMockErrors();

  // Load wins
  const wins = JSON.parse(localStorage.getItem("mindflow_tiny_wins") || "{}");
  for (let i = 1; i <= 3; i++) {
    const checkbox = document.getElementById(`win-check-${i}`);
    const textInput = document.getElementById(`win-text-${i}`);
    if (checkbox && wins[`check-${i}`] !== undefined) checkbox.checked = wins[`check-${i}`];
    if (textInput && wins[`text-${i}`] !== undefined) textInput.value = wins[`text-${i}`];
  }

  // Load oaths
  const oaths = JSON.parse(localStorage.getItem("mindflow_oath_checks") || "{}");
  for (let i = 1; i <= 2; i++) {
    const checkbox = document.getElementById(`oath-check-${i}`);
    if (checkbox && oaths[`check-${i}`] !== undefined) checkbox.checked = oaths[`check-${i}`];
  }

  // Load stretches
  const stretches = JSON.parse(localStorage.getItem("mindflow_stretch_checks") || "{}");
  for (let i = 1; i <= 3; i++) {
    const checkbox = document.getElementById(`stretch-check-${i}`);
    if (checkbox && stretches[`check-${i}`] !== undefined) checkbox.checked = stretches[`check-${i}`];
  }
}

// ==========================================================================