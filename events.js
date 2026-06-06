// 8. Event Listeners Coordination
// ==========================================================================
function setupEventListeners() {
  // Login Submit Listener
  const loginSubmitBtn = document.getElementById("btn-login-submit");
  if (loginSubmitBtn) {
    loginSubmitBtn.addEventListener("click", async () => {
      const name = document.getElementById("login-name").value.trim();
      const phone = document.getElementById("login-phone").value.trim();
      const exam = document.getElementById("login-exam").value;
      const agree = document.getElementById("login-agree").checked;

      if (!name || !phone || !agree) {
        alert("Please fill in all details and agree to the privacy terms.");
        return;
      }
      
      if (!/^[0-9]{10}$/.test(phone)) {
        alert("Please enter a valid 10-digit mobile number.");
        return;
      }

      state.userProfile = {
        name,
        phone,
        exam,
        isAnonymous: false,
        createdAt: new Date().toISOString()
      };
      
      state.examTarget = exam;
      localStorage.setItem("mindflow_user_profile", JSON.stringify(state.userProfile));
      localStorage.setItem("mindflow_exam", exam);
      
      const loginPortal = document.getElementById("login-portal");
      if (loginPortal) loginPortal.classList.remove("active");
      
      const selector = document.getElementById("exam-selector");
      if (selector) selector.value = state.examTarget;
      
      updateWelcomeSection();
      updateExamAdvice();
      
      // Attempt login via API to create/fetch user session
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state.userProfile)
        });
        if (res.ok) {
          const data = await res.json();
          // Log data from server if exists, else keep default
          if (data.user && data.user.logs && data.user.logs.length > 0) {
             state.logs = data.user.logs;
             localStorage.setItem("mindflow_logs_" + phone, JSON.stringify(state.logs));
          }
        }
      } catch (e) {
        console.warn("Login API not available, continuing in offline mode.");
      }
      
      await syncUserDataFromServer();
      renderCharts();
    });
  }

  // Login Anonymous Listener
  const loginAnonBtn = document.getElementById("btn-login-anonymous");
  if (loginAnonBtn) {
    loginAnonBtn.addEventListener("click", () => {
      state.userProfile = {
        name: "Anonymous User",
        phone: "anonymous",
        exam: "JEE", // default
        isAnonymous: true,
        createdAt: new Date().toISOString()
      };
      
      state.examTarget = "JEE";
      localStorage.setItem("mindflow_user_profile", JSON.stringify(state.userProfile));
      
      const loginPortal = document.getElementById("login-portal");
      if (loginPortal) loginPortal.classList.remove("active");
      
      updateWelcomeSection();
      updateExamAdvice();
      renderCharts();
    });
  }

  // Logout Listener
  const logoutBtn = document.getElementById("btn-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const confirmLogout = confirm("Are you sure you want to log out? Your local preferences will be cleared.");
      if (confirmLogout) {
        localStorage.removeItem("mindflow_user_profile");
        localStorage.removeItem("mindflow_exam");
        window.location.reload();
      }
    });
  }

  // Exam Selector Listener
  const examSelector = document.getElementById("exam-selector");
  examSelector.addEventListener("change", (e) => {
    state.examTarget = e.target.value;
    localStorage.setItem("mindflow_exam", state.examTarget);
    updateWelcomeSection();
    updateExamAdvice();
  });

  // Crisis Modal Event Triggers
  const crisisTrigger = document.getElementById("btn-crisis-trigger");
  const crisisModal = document.getElementById("crisis-modal");
  const crisisClose = document.getElementById("btn-crisis-close");

  crisisTrigger.addEventListener("click", () => crisisModal.classList.add("active"));
  crisisClose.addEventListener("click", () => crisisModal.classList.remove("active"));
  crisisModal.addEventListener("click", (e) => {
    if (e.target === crisisModal) crisisModal.classList.remove("active");
  });

  // Panic Modal Event Triggers
  const panicTrigger = document.getElementById("btn-panic-kit-trigger");
  const panicModal = document.getElementById("panic-modal");
  const panicClose = document.getElementById("btn-panic-close");

  panicTrigger.addEventListener("click", () => panicModal.classList.add("active"));
  panicClose.addEventListener("click", () => panicModal.classList.remove("active"));
  panicModal.addEventListener("click", (e) => {
    if (e.target === panicModal) panicModal.classList.remove("active");
  });

  // Mood selector buttons click
  const moodBtns = document.querySelectorAll(".mood-btn");
  moodBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      moodBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.selectedMood = btn.getAttribute("data-mood");
    });
  });

  // Trigger chips toggle
  const triggerChips = document.querySelectorAll(".trigger-chip");
  triggerChips.forEach(chip => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("active");
      const trig = chip.getAttribute("data-trigger");
      
      if (chip.classList.contains("active")) {
        if (!state.selectedTriggers.includes(trig)) {
          state.selectedTriggers.push(trig);
        }
      } else {
        state.selectedTriggers = state.selectedTriggers.filter(t => t !== trig);
      }
    });
  });

  // Prompt Shuffle Button
  document.getElementById("btn-prompt-shuffle").addEventListener("click", shufflePrompt);

  // Live Sentiment Journal listener
  const journalInput = document.getElementById("journal-input");
  const liveFeedback = document.getElementById("realtime-sentiment-feedback");
  const sentimentPreview = document.getElementById("journal-sentiment-preview");

  journalInput.addEventListener("input", (e) => {
    const text = e.target.value;
    const crisisTerm = detectCrisisState(text);
    
    if (geminiDebounceTimeout) clearTimeout(geminiDebounceTimeout);
    
    if (crisisTerm) {
      sentimentPreview.innerHTML = `<span style="color: var(--accent-rose); font-weight: 700;">⚠️ Urgent self-harm alert flagged</span>`;
      liveFeedback.innerHTML = `<span style="color: #fda4af; font-weight: 700;">We notice you might be experiencing extreme distress. Please write openly, but know that counseling help has been flagged. You do not have to carry this alone.</span>`;
    } else if (text.trim().length > 6) {
      sentimentPreview.innerText = "Analyzing vibe...";
      const affirmation = analyzeSentimentLocal(text);
      
      // Animate/Fade feed back text nicely
      liveFeedback.innerText = affirmation;
      sentimentPreview.innerText = "Live affirmation updated 🌱";

      const apiKey = localStorage.getItem("mindflow_gemini_key");
      if (apiKey && text.trim().length > 15) {
        geminiDebounceTimeout = setTimeout(() => {
          triggerGeminiAIAnalysis(text);
        }, 1200);
      }
    } else {
      liveFeedback.innerText = "As you share your thoughts, our local wellness guide will provide custom reassurance to help you manage the load.";
      sentimentPreview.innerText = "Type to analyze emotional vibe...";
    }
  });

  // Save entry submission button
  document.getElementById("btn-save-log").addEventListener("click", () => {
    if (!state.selectedMood) {
      alert("Please select your current mood before logging.");
      return;
    }

    const journalContent = journalInput.value.trim();
    const crisisTerm = detectCrisisState(journalContent);
    let isCrisis = false;

    if (crisisTerm) {
      isCrisis = true;
      const timestamp = new Date().toLocaleTimeString() + " (" + new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) + ")";
      triggerAdminAlarm(timestamp, crisisTerm, state.examTarget);
      
      const crisisAlertModal = document.getElementById("crisis-alert-modal");
      if (crisisAlertModal) {
        crisisAlertModal.classList.add("active");
      }
    }

    const newEntry = {
      date: new Date().toISOString(),
      mood: state.selectedMood,
      triggers: [...state.selectedTriggers],
      journal: journalContent || "No detailed written entry."
    };

    // Save and Sync
    state.logs.push(newEntry);
    localStorage.setItem("mindflow_logs", JSON.stringify(state.logs));
    
    playCalmBell();
    calculateStreak();

    // Reset Form Input fields
    moodBtns.forEach(b => b.classList.remove("active"));
    triggerChips.forEach(c => c.classList.remove("active"));
    journalInput.value = "";
    liveFeedback.innerText = "As you share your thoughts, our local wellness guide will provide custom reassurance to help you manage the load.";
    sentimentPreview.innerText = "Type to analyze emotional vibe...";

    if (!isCrisis) {
      showRemedyModal(state.selectedMood, state.selectedTriggers);
      
      const journalTabLink = document.querySelector(".nav-item[data-tab='journal']");
      if (journalTabLink) journalTabLink.click();
    } else {
      alert("Emergency self-harm signal dispatched to Campus Admin. Please review the support links displayed on your screen.");
    }
    
    state.selectedMood = "";
    state.selectedTriggers = [];
  });

  // Remedy Modal Logic
  const remedyModal = document.getElementById("remedy-modal");
  const btnRemedyClose = document.getElementById("btn-remedy-close");
  const btnRemedyAction = document.getElementById("btn-remedy-action");

  function showRemedyModal(mood, triggers) {
    const intro = document.getElementById("remedy-intro-text");
    const solution = document.getElementById("remedy-solution-text");
    
    // Default fallback
    let introText = `It looks like you're feeling ${mood.toLowerCase()} right now.`;
    let solutionText = "The best immediate action is to step away from your desk for exactly 5 minutes. Drink a glass of water, stretch your shoulders, and reset your posture.";

    if (triggers.includes("Mock Results") || triggers.includes("Syllabus Backlog")) {
      introText = `Feeling ${mood.toLowerCase()} because of your mock results or backlog is incredibly common.`;
      solutionText = "Don't try to study everything today. Pick exactly ONE chapter from your backlog, or ONE mistake from your mock test. Set a 25-minute timer and only focus on that. Action cures anxiety.";
    } else if (triggers.includes("Time Crunch")) {
      introText = `Time crunch makes everything feel impossible, causing you to feel ${mood.toLowerCase()}.`;
      solutionText = "Stop trying to multitask. Write down the 3 most important topics for tomorrow. Hide everything else. You cannot manufacture more time, but you can control your focus density.";
    } else if (triggers.includes("Sleep Deprived") || triggers.includes("Physical Health")) {
      introText = `Your brain runs on physical fuel. Feeling ${mood.toLowerCase()} is often just exhaustion disguised as anxiety.`;
      solutionText = "Close your books for the next 20 minutes. Lie down and close your eyes, or take a brisk walk outside. Pushing through exhaustion creates negative returns on memory.";
    } else if (triggers.includes("Family Expectations") || triggers.includes("Peer Pressure")) {
      introText = `External pressure is heavy. It's okay that you feel ${mood.toLowerCase()} about it.`;
      solutionText = "Remind yourself: You are studying for YOUR future, not for their validation. Put your phone on 'Do Not Disturb' mode for the next 2 hours. Protect your mental space.";
    } else if (mood === "Joyful" || mood === "Calm") {
      introText = `It's great that you are feeling ${mood.toLowerCase()}!`;
      solutionText = "Use this positive momentum. Tackle the hardest topic on your list right now while your brain is in a resilient, high-absorption state. Lock in the focus!";
    }

    intro.innerText = introText;
    solution.innerText = solutionText;
    
    if (remedyModal) remedyModal.classList.add("active");
  }

  if (btnRemedyClose && btnRemedyAction && remedyModal) {
    const closeRemedy = () => remedyModal.classList.remove("active");
    btnRemedyClose.addEventListener("click", closeRemedy);
    btnRemedyAction.addEventListener("click", closeRemedy);
    remedyModal.addEventListener("click", (e) => {
      if (e.target === remedyModal) closeRemedy();
    });
  }

  // Breathing toggle click
  const breathingToggleBtn = document.getElementById("btn-breathing-toggle");
  const breathingResetBtn = document.getElementById("btn-breathing-reset");

  breathingToggleBtn.addEventListener("click", () => {
    if (breathingState === "stopped") {
      startBreathing();
    } else {
      pauseBreathing();
    }
  });

  breathingResetBtn.addEventListener("click", () => {
    resetBreathing();
  });

  // Sound Console sliders and cards toggle
  const soundCards = document.querySelectorAll(".sound-card");
  const volumeSlider = document.getElementById("ambient-volume");

  soundCards.forEach(card => {
    card.addEventListener("click", () => {
      const soundType = card.getAttribute("data-sound");
      card.classList.toggle("active");

      const isActive = card.classList.contains("active");

      if (soundType === "rain") {
        if (isActive) startRainNode();
        else stopRainNode();
      } else if (soundType === "binaural") {
        if (isActive) startBinauralNode();
        else stopBinauralNode();
      } else if (soundType === "brown") {
        if (isActive) startBrownNode();
        else stopBrownNode();
      } else if (soundType === "melody") {
        if (isActive) startMelodyNode();
        else stopMelodyNode();
      }
    });
  });

  volumeSlider.addEventListener("input", (e) => {
    updateVolume(parseFloat(e.target.value));
  });

  // Wipe All Data Handler
  const wipeDataBtn = document.getElementById("btn-wipe-data");
  if (wipeDataBtn) {
    wipeDataBtn.addEventListener("click", () => {
      const confirm1 = confirm("Are you absolutely sure you want to delete all of your logs and reflections? This will clear everything locally on this computer.");
      if (confirm1) {
        const confirm2 = confirm("Double checking: This cannot be undone. All history, streaks, and triggers will be permanently deleted. Proceed?");
        if (confirm2) {
          // Stop all active synths
          stopRainNode();
          stopBinauralNode();
          stopBrownNode();
          stopMelodyNode();
          
          // Clear active classes in UI for soundcards
          document.querySelectorAll(".sound-card").forEach(c => c.classList.remove("active"));
          
          // Clear local storage
          localStorage.removeItem("mindflow_logs");
          localStorage.removeItem("mindflow_admin_alerts");
          localStorage.removeItem("mindflow_mock_errors");
          localStorage.removeItem("mindflow_tiny_wins");
          localStorage.removeItem("mindflow_oath_checks");
          localStorage.removeItem("mindflow_stretch_checks");
          localStorage.removeItem("mindflow_gemini_key");
          state.logs = [];
          
          // Clear Gemini status UI
          const geminiKeyInput = document.getElementById("gemini-key-input");
          const geminiStatusLabel = document.getElementById("gemini-status-label");
          if (geminiKeyInput) geminiKeyInput.value = "";
          if (geminiStatusLabel) {
            geminiStatusLabel.innerText = "Not connected (falling back to Local Sentiment Engine)";
            geminiStatusLabel.style.color = "var(--text-muted)";
          }
          
          // Clear UI inputs for demotivators
          for (let i = 1; i <= 3; i++) {
            const checkbox = document.getElementById(`win-check-${i}`);
            const textInput = document.getElementById(`win-text-${i}`);
            if (checkbox) checkbox.checked = false;
            if (textInput) textInput.value = "";
          }
          for (let i = 1; i <= 2; i++) {
            const checkbox = document.getElementById(`oath-check-${i}`);
            if (checkbox) checkbox.checked = false;
          }
          for (let i = 1; i <= 3; i++) {
            const checkbox = document.getElementById(`stretch-check-${i}`);
            if (checkbox) checkbox.checked = false;
          }
          renderMockErrors();
          
          // Reset statistics
          calculateStreak();
          updateWelcomeSection();
          renderCharts();
          renderAdminAlerts();
          
          playCalmBell();
          alert("All personal records have been completely purged from this device. Your privacy remains secure.");
          
          // Jump to journal
          const journalTabLink = document.querySelector(".nav-item[data-tab='journal']");
          if (journalTabLink) journalTabLink.click();
        }
      }
    });
  }

  // Close Emergency Self-Harm Alert Modal
  const crisisAlertModal = document.getElementById("crisis-alert-modal");
  const crisisAlertClose = document.getElementById("btn-crisis-alert-close");
  if (crisisAlertClose) {
    crisisAlertClose.addEventListener("click", () => crisisAlertModal.classList.remove("active"));
  }
  if (crisisAlertModal) {
    crisisAlertModal.addEventListener("click", (e) => {
      if (e.target === crisisAlertModal) crisisAlertModal.classList.remove("active");
    });
  }

  // Insights Accordion Toggle
  const toggleInsightsBtn = document.getElementById("btn-toggle-insights");
  const insightsContent = document.getElementById("insights-accordion-content");
  const accordionArrow = document.getElementById("accordion-arrow");

  if (toggleInsightsBtn && insightsContent) {
    toggleInsightsBtn.addEventListener("click", () => {
      const isHidden = insightsContent.style.display === "none";
      if (isHidden) {
        insightsContent.style.display = "block";
        accordionArrow.innerText = "▲ Collapse";
        // Force Canvas redraw when expanded so width and spacing render perfectly
        renderCharts();
      } else {
        insightsContent.style.display = "none";
        accordionArrow.innerText = "▼ Expand";
      }
    });
  }

  // SOS Panic Help Button Click Handler
  const panicSosBtn = document.getElementById("btn-panic-sos");
  const panicModal2 = document.getElementById("panic-modal");
  if (panicSosBtn && panicModal2) {
    panicSosBtn.addEventListener("click", () => {
      panicModal2.classList.add("active");
    });
  }

  // Mind Melt Venting Box Action Handler
  const ventInput = document.getElementById("vent-input");
  const btnBurnVent = document.getElementById("btn-burn-vent");
  if (btnBurnVent && ventInput) {
    btnBurnVent.addEventListener("click", () => {
      const text = ventInput.value.trim();
      if (text.length === 0) {
        alert("The venting area is empty. Pour your frustration or dark thoughts here first so we can burn them!");
        return;
      }

      playCalmBell();

      // Trigger melting transition animations (blur out and scale up/down)
      ventInput.style.transition = "transform 1.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 1.6s ease-out, opacity 1.6s ease-out";
      ventInput.style.transform = "scale(0.85) translateY(-25px)";
      ventInput.style.filter = "blur(14px) grayscale(1)";
      ventInput.style.opacity = "0";

      btnBurnVent.innerText = "💨 Melting your worries...";
      btnBurnVent.style.background = "#475569";
      btnBurnVent.disabled = true;

      setTimeout(() => {
        ventInput.value = "";
        ventInput.style.transition = "none";
        ventInput.style.transform = "none";
        ventInput.style.filter = "none";
        ventInput.style.opacity = "1";

        btnBurnVent.innerText = "🔥 Burn & Let It Go";
        btnBurnVent.style.background = "linear-gradient(135deg, var(--accent-rose), #e11d48)";
        btnBurnVent.disabled = false;

        alert("Dissolved. You let it go. Remember: emotions rise like waves, but they always pass. Take a deep breath.");
      }, 1850);
    });
  }

  // Patience Sprout Trainer Handler
  const btnWater = document.getElementById("btn-water-hold");
  const progressBar = document.getElementById("patience-progress-bar");
  const timerLabel = document.getElementById("patience-timer-label");
  const seedDisplay = document.getElementById("patience-seed-display");
  
  let patienceInterval = null;
  let patienceElapsed = 0; // milliseconds
  const targetPatienceTime = 15000; // 15 seconds
  let patientToneOsc = null;

  function stopPatienceTone() {
    if (patientToneOsc) {
      try {
        patientToneOsc.stop();
      } catch(e) {}
      patientToneOsc = null;
    }
  }

  function playPatienceTone(startFreq, currentElapsed) {
    try {
      initAudio();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      
      if (!patientToneOsc) {
        patientToneOsc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        patientToneOsc.type = "sine";
        patientToneOsc.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        patientToneOsc.connect(gain);
        gain.connect(audioCtx.destination);
        patientToneOsc.start();
      }
      
      // Sweep pitch from startFreq to octave above as hold duration increases
      const progressPercent = currentElapsed / targetPatienceTime;
      const targetFreq = startFreq + (progressPercent * 260);
      patientToneOsc.frequency.linearRampToValueAtTime(targetFreq, audioCtx.currentTime + 0.1);
    } catch(e) {}
  }

  if (btnWater && progressBar && timerLabel && seedDisplay) {
    const handlePressStart = (e) => {
      e.preventDefault();
      
      patienceElapsed = 0;
      progressBar.style.width = "0%";
      seedDisplay.innerText = "🪨";
      seedDisplay.style.transform = "scale(1)";
      timerLabel.innerText = "Hold to water: 15.0s remaining";
      timerLabel.style.color = "var(--text-secondary)";
      
      btnWater.innerText = "💧 Watering Sprout...";
      btnWater.style.background = "linear-gradient(135deg, var(--accent-cyan), #0891b2)";
      
      patienceInterval = setInterval(() => {
        patienceElapsed += 100;
        const remaining = Math.max(0, (targetPatienceTime - patienceElapsed) / 1000);
        progressBar.style.width = `${(patienceElapsed / targetPatienceTime) * 100}%`;
        timerLabel.innerText = `Hold to water: ${remaining.toFixed(1)}s remaining`;

        playPatienceTone(220, patienceElapsed);

        // Visual growth stages
        if (patienceElapsed >= 3000 && patienceElapsed < 7000) {
          seedDisplay.innerText = "🌱";
          seedDisplay.style.transform = "scale(1.1)";
        } else if (patienceElapsed >= 7000 && patienceElapsed < 12000) {
          seedDisplay.innerText = "🌿";
          seedDisplay.style.transform = "scale(1.2)";
        } else if (patienceElapsed >= 12000 && patienceElapsed < 15000) {
          seedDisplay.innerText = "🌸";
          seedDisplay.style.transform = "scale(1.3)";
        }

        if (patienceElapsed >= targetPatienceTime) {
          clearInterval(patienceInterval);
          patienceInterval = null;
          stopPatienceTone();

          seedDisplay.innerText = "🌳";
          seedDisplay.style.transform = "scale(1.5)";
          timerLabel.innerText = "Success! You practiced patience. 🌳";
          timerLabel.style.color = "var(--accent-emerald)";
          
          btnWater.innerText = "🎉 Sprout Fully Grown!";
          btnWater.style.background = "linear-gradient(135deg, var(--accent-emerald), #059669)";
          btnWater.disabled = true;

          playCalmBell();
          
          const affirmations = [
            "Patience is not the ability to wait, but the ability to keep a good attitude while waiting. 🕊️",
            "Slow, deliberate progress is the only progress that lasts. You did great. 🌱",
            "Exam ranks are built day-by-day, page-by-page. Trust your slow growth. 🌳",
            "By taking these 15 seconds to pause, you trained your brain to resist impulse stress. 🧠"
          ];
          const randomAff = affirmations[Math.floor(Math.random() * affirmations.length)];
          alert(randomAff);

          setTimeout(() => {
            btnWater.disabled = false;
            btnWater.innerText = "💧 Press & Hold to Water";
            btnWater.style.background = "linear-gradient(135deg, var(--accent-emerald), #059669)";
            seedDisplay.innerText = "🪨";
            seedDisplay.style.transform = "scale(1)";
            progressBar.style.width = "0%";
            timerLabel.innerText = "Hold to water: 15.0s remaining";
            timerLabel.style.color = "var(--text-secondary)";
          }, 6000);
        }
      }, 100);
    };

    const handlePressEnd = () => {
      if (patienceInterval) {
        clearInterval(patienceInterval);
        patienceInterval = null;
        stopPatienceTone();

        progressBar.style.width = "0%";
        timerLabel.innerText = "Practicing patience takes focus! Try holding again.";
        timerLabel.style.color = "var(--accent-rose)";
        
        seedDisplay.innerText = "🪨";
        seedDisplay.style.transform = "scale(1)";
        
        btnWater.innerText = "💧 Press & Hold to Water";
        btnWater.style.background = "linear-gradient(135deg, var(--accent-emerald), #059669)";
      }
    };

    btnWater.addEventListener("mousedown", handlePressStart);
    btnWater.addEventListener("mouseup", handlePressEnd);
    btnWater.addEventListener("mouseleave", handlePressEnd);

    btnWater.addEventListener("touchstart", handlePressStart);
    btnWater.addEventListener("touchend", handlePressEnd);
  }

  // ==========================================================================
  // 9. Demotivators Practical Actions Listeners
  // ==========================================================================
  
  // Demotivator Accordion Drawer Toggle
  const demotivatorToggleBtns = document.querySelectorAll(".demotivator-toggle-btn");
  demotivatorToggleBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const content = btn.nextElementSibling;
      const arrow = btn.querySelector(".demotivator-arrow");
      const isHidden = content.style.display === "none" || !content.style.display;
      if (isHidden) {
        content.style.display = "block";
        if (arrow) arrow.innerText = "▲ Collapse";
      } else {
        content.style.display = "none";
        if (arrow) arrow.innerText = "▼ Expand";
      }
    });
  });

  // Mock Test Error Logger Form Submission
  const btnAddMockErr = document.getElementById("btn-add-mock-err");
  const mockErrTopic = document.getElementById("mock-err-topic");
  const mockErrCause = document.getElementById("mock-err-cause");
  if (btnAddMockErr && mockErrTopic && mockErrCause) {
    btnAddMockErr.addEventListener("click", () => {
      const topic = mockErrTopic.value.trim();
      const cause = mockErrCause.value;
      if (!topic) {
        alert("Please enter a specific question or topic that you got wrong first.");
        return;
      }
      const errors = JSON.parse(localStorage.getItem("mindflow_mock_errors") || "[]");
      const time = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      errors.push({ topic, cause, time });
      localStorage.setItem("mindflow_mock_errors", JSON.stringify(errors));
      renderMockErrors();
      mockErrTopic.value = "";
      playCalmBell();
    });
  }

  // Tiny Wins persistence
  for (let i = 1; i <= 3; i++) {
    const checkbox = document.getElementById(`win-check-${i}`);
    const textInput = document.getElementById(`win-text-${i}`);
    if (checkbox) checkbox.addEventListener("change", saveWins);
    if (textInput) {
      textInput.addEventListener("input", saveWins);
      textInput.addEventListener("change", saveWins);
    }
  }

  // Focus Oath persistence
  for (let i = 1; i <= 2; i++) {
    const checkbox = document.getElementById(`oath-check-${i}`);
    if (checkbox) checkbox.addEventListener("change", saveOaths);
  }

  // Physical stretch check persistence
  for (let i = 1; i <= 3; i++) {
    const checkbox = document.getElementById(`stretch-check-${i}`);
    if (checkbox) checkbox.addEventListener("change", saveStretches);
  }

  // Action Center Redirect Links
  const btnActionGoJournal = document.getElementById("btn-action-go-journal");
  if (btnActionGoJournal) {
    btnActionGoJournal.addEventListener("click", () => {
      const tab = document.querySelector(".nav-item[data-tab='journal']") || document.querySelector(".mobile-nav-item[data-tab='journal']");
      if (tab) tab.click();
      document.getElementById("journal-input")?.focus();
      document.getElementById("journal-input")?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  const btnActionGoStreak = document.getElementById("btn-action-go-streak");
  if (btnActionGoStreak) {
    btnActionGoStreak.addEventListener("click", () => {
      const tab = document.querySelector(".nav-item[data-tab='journal']") || document.querySelector(".mobile-nav-item[data-tab='journal']");
      if (tab) tab.click();
      const insightsContent = document.getElementById("insights-accordion-content");
      const accordionArrow = document.getElementById("accordion-arrow");
      if (insightsContent && insightsContent.style.display === "none") {
        insightsContent.style.display = "block";
        if (accordionArrow) accordionArrow.innerText = "▲ Collapse";
        renderCharts();
      }
      setTimeout(() => {
        document.getElementById("insights-accordion")?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    });
  }

  const btnActionSighBreathe = document.getElementById("btn-action-sigh-breathe");
  if (btnActionSighBreathe) {
    btnActionSighBreathe.addEventListener("click", () => {
      const tab = document.querySelector(".nav-item[data-tab='toolkit']") || document.querySelector(".mobile-nav-item[data-tab='toolkit']");
      if (tab) tab.click();
      setTimeout(() => {
        document.getElementById("breathing-ring")?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    });
  }

  const btnActionGoVent = document.getElementById("btn-action-go-vent");
  if (btnActionGoVent) {
    btnActionGoVent.addEventListener("click", () => {
      const tab = document.querySelector(".nav-item[data-tab='toolkit']") || document.querySelector(".mobile-nav-item[data-tab='toolkit']");
      if (tab) tab.click();
      setTimeout(() => {
        const ventInp = document.getElementById("vent-input");
        if (ventInp) {
          ventInp.focus();
          ventInp.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    });
  }

  const btnActionSleepHum = document.getElementById("btn-action-sleep-hum");
  if (btnActionSleepHum) {
    btnActionSleepHum.addEventListener("click", () => {
      const brownCard = document.querySelector(".sound-card[data-sound='brown']");
      if (brownCard) {
        if (!brownCard.classList.contains("active")) {
          brownCard.click();
        }
        const tab = document.querySelector(".nav-item[data-tab='toolkit']") || document.querySelector(".mobile-nav-item[data-tab='toolkit']");
        if (tab) tab.click();
        setTimeout(() => {
          brownCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      }
    });
  }

  const btnActionSetWalk = document.getElementById("btn-action-set-walk");
  if (btnActionSetWalk) {
    btnActionSetWalk.addEventListener("click", () => {
      playCalmBell();
      alert("🚶 Walk Alert Scheduled! We will simulate a supportive push notification on your device in 15 minutes to remind you to take a breath and walk outside.");
    });
  }

  // Google Gemini API key configuration
  const btnSaveGeminiKey = document.getElementById("btn-save-gemini-key");
  const geminiKeyInput = document.getElementById("gemini-key-input");
  const geminiStatusLabel = document.getElementById("gemini-status-label");

  if (btnSaveGeminiKey && geminiKeyInput && geminiStatusLabel) {
    const savedKey = localStorage.getItem("mindflow_gemini_key");
    if (savedKey) {
      geminiKeyInput.value = savedKey;
      geminiStatusLabel.innerText = "Connected (Google Gemini AI Active) ✨";
      geminiStatusLabel.style.color = "var(--accent-emerald)";
    }

    btnSaveGeminiKey.addEventListener("click", () => {
      const key = geminiKeyInput.value.trim();
      if (key) {
        localStorage.setItem("mindflow_gemini_key", key);
        geminiStatusLabel.innerText = "Connected (Google Gemini AI Active) ✨";
        geminiStatusLabel.style.color = "var(--accent-emerald)";
        playCalmBell();
        alert("Google Gemini API Key saved successfully! Write a journal entry and pause to see real-time AI reflections.");
      } else {
        localStorage.removeItem("mindflow_gemini_key");
        geminiStatusLabel.innerText = "Not connected (falling back to Local Sentiment Engine)";
        geminiStatusLabel.style.color = "var(--text-muted)";
        playCalmBell();
        alert("Gemini API Key removed. Reverted to local NLP rules engine.");
      }
    });
  }
}
