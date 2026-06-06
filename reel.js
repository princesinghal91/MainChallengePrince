const stories = [
  {
    frames: [
      { emoji: "😔", text: "In 2005, a boy completely failed his competitive exam...", bg: "linear-gradient(135deg, #2d3748, #1a202c)" },
      { emoji: "📉", text: "Relatives told his parents his career was officially over.", bg: "linear-gradient(135deg, #7f1d1d, #450a0a)" },
      { emoji: "💻", text: "He joined a tier-3 college and focused quietly on his real skills.", bg: "linear-gradient(135deg, #064e3b, #022c22)" },
      { emoji: "🚀", text: "Today, he's a VP at a major tech giant. The exam was just a comma, not a full stop.", bg: "linear-gradient(135deg, #1e3a8a, #172554)" }
    ]
  }
];

let currentStory = 0;
let currentFrame = 0;
let reelTimer;
let reelProgressStart;
const FRAME_DURATION = 5000;

function initReel() {
  const btnWatchReel = document.getElementById("btn-watch-reel");
  const modal = document.getElementById("reel-modal");
  const btnClose = document.getElementById("btn-reel-close");
  const nextZone = document.getElementById("reel-next");
  const prevZone = document.getElementById("reel-prev");

  if (!btnWatchReel || !modal) return;

  btnWatchReel.addEventListener("click", () => {
    modal.classList.add("active");
    currentFrame = 0;
    renderFrame();
  });

  const closeReel = () => {
    modal.classList.remove("active");
    cancelAnimationFrame(reelTimer);
  };

  btnClose.addEventListener("click", closeReel);
  
  nextZone.addEventListener("click", () => {
    if (currentFrame < stories[currentStory].frames.length - 1) {
      currentFrame++;
      renderFrame();
    } else {
      closeReel();
    }
  });

  prevZone.addEventListener("click", () => {
    if (currentFrame > 0) {
      currentFrame--;
      renderFrame();
    }
  });
}

function renderFrame() {
  cancelAnimationFrame(reelTimer);
  
  const frame = stories[currentStory].frames[currentFrame];
  document.getElementById("reel-emoji").innerText = frame.emoji;
  document.getElementById("reel-text").innerText = frame.text;
  document.getElementById("reel-content").style.background = frame.bg;
  
  // reset all progress bars
  for(let i=0; i<4; i++) {
    const el = document.getElementById("reel-prog-"+i);
    if(el) {
      if (i < currentFrame) el.style.width = "100%";
      else el.style.width = "0%";
    }
  }
  
  reelProgressStart = performance.now();
  requestAnimationFrame(updateReelProgress);
}

function updateReelProgress(now) {
  const elapsed = now - reelProgressStart;
  const percent = Math.min((elapsed / FRAME_DURATION) * 100, 100);
  
  const activeProg = document.getElementById("reel-prog-" + currentFrame);
  if (activeProg) activeProg.style.width = percent + "%";
  
  if (elapsed >= FRAME_DURATION) {
    if (currentFrame < stories[currentStory].frames.length - 1) {
      currentFrame++;
      renderFrame();
    } else {
      document.getElementById("reel-modal").classList.remove("active");
    }
  } else {
    reelTimer = requestAnimationFrame(updateReelProgress);
  }
}

document.addEventListener("DOMContentLoaded", initReel);
