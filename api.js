// 2.5 Client-Server Sync Engine (Vercel & Local API Handlers)
// ==========================================================================
async function syncUserDataFromServer() {
  if (!state.userProfile || state.userProfile.isAnonymous) {
    // Skip backend calls for anonymous/incognito profile
    calculateStreak();
    renderAdminAlerts();
    initDemotivatorsData();
    return;
  }
  
  const phone = state.userProfile.phone;
  const isLocalOrVercel = window.location.origin.includes('localhost') || 
                          window.location.origin.includes('127.0.0.1') || 
                          window.location.origin.includes('vercel.app');

  if (isLocalOrVercel) {
    try {
      // 1. Fetch Logs
      const resLogs = await fetch(`/api/logs?phone=${phone}`);
      if (resLogs.ok) {
        state.logs = await resLogs.json();
        localStorage.setItem("mindflow_logs_" + phone, JSON.stringify(state.logs));
      }

      // 2. Fetch Errors
      const resErrors = await fetch(`/api/errors?phone=${phone}`);
      if (resErrors.ok) {
        const errors = await resErrors.json();
        localStorage.setItem("mindflow_mock_errors", JSON.stringify(errors));
      }

      // 3. Fetch Checklists
      const resChecklists = await fetch(`/api/checklists?phone=${phone}`);
      if (resChecklists.ok) {
        const data = await resChecklists.json();
        if (data.wins) localStorage.setItem("mindflow_tiny_wins", JSON.stringify(data.wins));
        if (data.oaths) localStorage.setItem("mindflow_oath_checks", JSON.stringify(data.oaths));
        if (data.stretches) localStorage.setItem("mindflow_stretch_checks", JSON.stringify(data.stretches));
      }
      
      console.log("[SERVER SYNC] Data synchronized successfully from server.");
    } catch (e) {
      console.warn("[SERVER SYNC FAILED] Running in offline local mode.", e);
    }
  }

  // Reload lists into UI
  calculateStreak();
  renderAdminAlerts();
  initDemotivatorsData();
}

function syncMockErrorsToServer(errors) {
  if (!state.userProfile || state.userProfile.isAnonymous) return;
  const phone = state.userProfile.phone;
  fetch('/api/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, errors })
  }).catch(e => console.warn("[OFFLINE WRITE] Error logged locally.", e));
}

function syncChecklistsToServer(type, data) {
  if (!state.userProfile || state.userProfile.isAnonymous) return;
  const phone = state.userProfile.phone;
  fetch('/api/checklists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, type, data })
  }).catch(e => console.warn("[OFFLINE WRITE] Checklist saved locally.", e));
}


function calculateStreak() {
  if (state.logs.length === 0) {
    state.streak = 0;
    return;
  }
  
  // Sort logs by date descending
  const sortedLogs = [...state.logs].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  let currentStreak = 0;
  let today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let expectedDate = new Date(today);
  
  for (let i = 0; i < sortedLogs.length; i++) {
    const logDate = new Date(sortedLogs[i].date);
    logDate.setHours(0, 0, 0, 0);
    
    // Check if the log is on the expected date or the day before (grace period)
    const diffTime = expectedDate.getTime() - logDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      currentStreak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (diffDays === 1) {
      // User missed today but logged yesterday (streak continues from yesterday)
      if (i === 0) {
        currentStreak++;
        expectedDate.setDate(expectedDate.getDate() - 2);
      } else {
        break;
      }
    } else if (diffDays > 1) {
      break;
    }
  }
  
  state.streak = currentStreak;
  document.getElementById("stat-streak").innerText = `${state.streak} ${state.streak === 1 ? 'Day' : 'Days'}`;
}

// ==========================================================================