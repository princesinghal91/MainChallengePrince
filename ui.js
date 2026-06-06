// 3. UI Navigation & Helpers
// ==========================================================================
function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const mobileNavItems = document.querySelectorAll(".mobile-nav-item");
  const panels = document.querySelectorAll(".view-panel");

  function switchTab(tabId) {
    // Update Desktop Sidebar active states
    navItems.forEach(item => {
      if (item.getAttribute("data-tab") === tabId) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // Update Mobile Nav active states
    mobileNavItems.forEach(item => {
      if (item.getAttribute("data-tab") === tabId) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // Update Active View Panel
    panels.forEach(panel => {
      if (panel.id === `${tabId}-view`) {
        panel.classList.add("active");
      } else {
        panel.classList.remove("active");
      }
    });

    // Refresh profile details on daily reset tab switch
    if (tabId === "journal") {
      updateWelcomeSection();
    }
  }

  navItems.forEach(item => {
    item.addEventListener("click", () => switchTab(item.getAttribute("data-tab")));
  });

  mobileNavItems.forEach(item => {
    item.addEventListener("click", () => switchTab(item.getAttribute("data-tab")));
  });

  // Quick jump dashboard links
  const btnQuickBreathe = document.getElementById("btn-quick-breathe");
  if (btnQuickBreathe) {
    btnQuickBreathe.addEventListener("click", () => {
      switchTab("toolkit");
      // Auto click start breathe
      setTimeout(() => {
        const btn = document.getElementById("btn-breathing-toggle");
        if (btn && btn.innerText === "Start Breathing") btn.click();
      }, 100);
    });
  }

  const btnQuickGround = document.getElementById("btn-quick-ground");
  if (btnQuickGround) {
    btnQuickGround.addEventListener("click", () => {
      switchTab("toolkit");
      // Scroll down to grounding container
      setTimeout(() => {
        document.querySelector(".grounding-box")?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    });
  }
}

function updateWelcomeSection() {
  // Set Date
  const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById("current-date-str").innerText = new Date().toLocaleDateString('en-US', dateOptions);

  // Set greeting based on time of day
  const hours = new Date().getHours();
  let greet = "Hello, Student Companion";
  if (hours < 12) greet = "Good Morning, Companion";
  else if (hours < 17) greet = "Good Afternoon, Companion";
  else greet = "Good Evening, Companion";
  document.getElementById("welcome-message").innerText = greet;

  // Set sidebar avatar initials & user profile info
  const exam = state.examTarget;
  document.getElementById("user-exam-tag").innerText = `Target: ${exam}`;
  document.getElementById("user-avatar-char").innerText = exam.charAt(0);

  // Calc metrics values
  if (state.logs.length > 0) {
    // Mood index (avg score)
    const moodScores = { "Joyful": 5, "Calm": 4, "Anxious": 3, "Stressed": 2, "Burnt-Out": 1 };
    let totalScore = 0;
    state.logs.forEach(l => {
      totalScore += moodScores[l.mood] || 3;
    });
    const avgScore = (totalScore / state.logs.length).toFixed(1);
    
    let emoji = "😐";
    if (avgScore >= 4.5) emoji = "🤩";
    else if (avgScore >= 3.5) emoji = "😌";
    else if (avgScore >= 2.5) emoji = "😟";
    else if (avgScore >= 1.5) emoji = "😫";
    else emoji = "🥀";
    
    document.getElementById("stat-mood-index").innerText = `${avgScore} / 5 ${emoji}`;

    // Calc primary stress trigger
    const triggersCount = {};
    state.logs.forEach(l => {
      if (l.triggers) {
        l.triggers.forEach(t => {
          triggersCount[t] = (triggersCount[t] || 0) + 1;
        });
      }
    });

    let topTrigger = "None";
    let maxCount = 0;
    for (const [trig, count] of Object.entries(triggersCount)) {
      if (count > maxCount) {
        maxCount = count;
        topTrigger = trig;
      }
    }
    document.getElementById("stat-stress-trigger").innerText = topTrigger;

    // Show recent insight in placeholder card
    const lastLog = [...state.logs].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    if (lastLog && lastLog.journal) {
      const placeholder = document.getElementById("insight-placeholder-text");
      if (placeholder) {
        placeholder.innerText = `"${lastLog.journal.substring(0, 150)}${lastLog.journal.length > 150 ? '...' : ''}"`;
      }
      const indicator = document.getElementById("insight-sentiment-indicator");
      if (indicator) {
        indicator.classList.remove("hidden");
        // Seed sentiment output in card
        const responseText = analyzeSentimentLocal(lastLog.journal);
        indicator.innerHTML = `<span>🌱 Focus Advice: ${responseText.substring(0, 75)}...</span>`;
      }
    }
  } else {
    document.getElementById("stat-mood-index").innerText = "--";
    document.getElementById("stat-stress-trigger").innerText = "None";
  }
}

// Update exam guidance blocks based on selection
function updateExamAdvice() {
  const exam = state.examTarget;
  document.getElementById("exam-card-title-name").innerText = exam;
  
  const container = document.getElementById("exam-specific-advice-container");
  container.innerHTML = ""; // Clear
  
  const resources = EXAM_RESOURCES[exam] || EXAM_RESOURCES["JEE"];
  resources.forEach(item => {
    const div = document.createElement("div");
    div.className = "advice-item";
    div.innerHTML = `
      <div class="advice-bullet">${item.emoji}</div>
      <div class="advice-body">
        <span class="advice-heading">${item.title}</span>
        <span class="advice-text">${item.text}</span>
      </div>
    `;
    container.appendChild(div);
  });
}

// ==========================================================================