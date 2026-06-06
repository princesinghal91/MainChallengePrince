// 2. Core Initializer
// ==========================================================================
document.addEventListener("DOMContentLoaded", async () => {
  initLocalStorage();
  setupNavigation();
  setupEventListeners();
  updateWelcomeSection();
  updateExamAdvice();
  await syncUserDataFromServer();
  renderCharts();
  shufflePrompt();
});

// Load/Init LocalStorage User Profile details
function initLocalStorage() {
  const savedProfile = localStorage.getItem("mindflow_user_profile");
  const loginPortal = document.getElementById("login-portal");

  if (savedProfile) {
    state.userProfile = JSON.parse(savedProfile);
    state.examTarget = state.userProfile.exam;
    
    // Hide login gateway
    if (loginPortal) loginPortal.classList.remove("active");
    
    // Update top header select box
    const selector = document.getElementById("exam-selector");
    if (selector) selector.value = state.examTarget;
  } else {
    // Show login gateway
    if (loginPortal) loginPortal.classList.add("active");
  }

  // Load log data from local cache first (server sync runs subsequently in DOMContentLoaded)
  const phone = state.userProfile ? state.userProfile.phone : 'guest';
  const savedLogs = localStorage.getItem("mindflow_logs_" + phone) || localStorage.getItem("mindflow_logs");
  if (savedLogs) {
    state.logs = JSON.parse(savedLogs);
  } else {
    state.logs = [...DEFAULT_LOGS];
    localStorage.setItem("mindflow_logs_" + phone, JSON.stringify(state.logs));
  }

  calculateStreak();
}

// ==========================================================================