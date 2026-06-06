// 7. 4-7-8 Breathing Engine State Machine
// ==========================================================================
let breathingInterval = null;
let breathingState = "stopped"; // stopped, inhaling, holding, exhaling
let breathingCount = 0;
let cycleStageTime = 0;

function startBreathing() {
  const bubble = document.getElementById("breathing-bubble");
  const ring = document.getElementById("breathing-ring");
  const phaseText = document.getElementById("breath-phase-text");
  const timerText = document.getElementById("breath-timer-text");
  const toggleBtn = document.getElementById("btn-breathing-toggle");

  initAudio();
  
  breathingState = "inhaling";
  cycleStageTime = 4;
  
  toggleBtn.innerText = "Pause Session";
  toggleBtn.style.background = "var(--accent-rose)";
  
  ring.className = "breathing-outer-ring inhale";
  phaseText.innerText = "Inhale";
  timerText.innerText = `4s`;

  // Play ascending inhale tone
  playBreathingDrone(300, 400, 4);

  breathingInterval = setInterval(() => {
    cycleStageTime--;
    
    if (cycleStageTime <= 0) {
      // Transition State Machine
      if (breathingState === "inhaling") {
        breathingState = "holding";
        cycleStageTime = 7;
        ring.className = "breathing-outer-ring hold";
        phaseText.innerText = "Hold";
        playBreathingDrone(400, 400, 7);
      } else if (breathingState === "holding") {
        breathingState = "exhaling";
        cycleStageTime = 8;
        ring.className = "breathing-outer-ring exhale";
        phaseText.innerText = "Exhale";
        playBreathingDrone(400, 250, 8);
      } else if (breathingState === "exhaling") {
        breathingState = "inhaling";
        cycleStageTime = 4;
        ring.className = "breathing-outer-ring inhale";
        phaseText.innerText = "Inhale";
        playBreathingDrone(300, 400, 4);
      }
    }
    
    timerText.innerText = `${cycleStageTime}s`;
  }, 1000);
}

function pauseBreathing() {
  clearInterval(breathingInterval);
  breathingInterval = null;
  breathingState = "stopped";
  
  const ring = document.getElementById("breathing-ring");
  const phaseText = document.getElementById("breath-phase-text");
  const timerText = document.getElementById("breath-timer-text");
  const toggleBtn = document.getElementById("btn-breathing-toggle");
  
  toggleBtn.innerText = "Resume Session";
  toggleBtn.style.background = "var(--accent-purple)";
  ring.className = "breathing-outer-ring";
  phaseText.innerText = "Paused";
  timerText.innerText = "Click to Resume";
}

function resetBreathing() {
  clearInterval(breathingInterval);
  breathingInterval = null;
  breathingState = "stopped";
  
  const ring = document.getElementById("breathing-ring");
  const phaseText = document.getElementById("breath-phase-text");
  const timerText = document.getElementById("breath-timer-text");
  const toggleBtn = document.getElementById("btn-breathing-toggle");
  
  toggleBtn.innerText = "Start Breathing";
  toggleBtn.style.background = "linear-gradient(135deg, var(--accent-purple), var(--accent-purple))";
  ring.className = "breathing-outer-ring";
  phaseText.innerText = "Ready";
  timerText.innerText = "Click Start";
}

// Generate organic guided tones for breathing synchronization
function playBreathingDrone(startFreq, endFreq, durationSec) {
  try {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, audioCtx.currentTime + durationSec);
    
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + 0.5); // fade in
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime + durationSec - 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + durationSec); // fade out
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + durationSec);
  } catch(e) {}
}

// ==========================================================================