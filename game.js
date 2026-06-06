const gameQuestions = [
  {
    q: "You are walking through a dense forest and come across a sudden fork in the road. Which path do you take?",
    options: [
      { 
        emoji: "🛤️", 
        text: "The clear, well-trodden path", 
        vibe: "Overwhelmed", 
        desc: "You chose the safe route because your brain is currently seeking certainty. You have too much syllabus pressure, and you just want a predictable outcome. Solution: Stop exploring new books. Stick to NCERT or your main notes today."
      },
      { 
        emoji: "🌿", 
        text: "The overgrown, mysterious path", 
        vibe: "Curious but Distracted", 
        desc: "You are looking for an escape from routine. You might be suffering from 'Shiny Object Syndrome'—jumping between YouTube strategies instead of studying. Solution: Lock away your phone and do 30 minutes of deep work."
      },
      { 
        emoji: "🏕️", 
        text: "I sit down and build a fire first", 
        vibe: "Exhausted", 
        desc: "You didn't even want to walk! Your body and mind are completely burnt out. You are running on fumes. Solution: Seriously, go take a 45-minute guilt-free nap. Your retention will 2x when you wake up."
      },
      { 
        emoji: "🗺️", 
        text: "I check my map meticulously", 
        vibe: "Anxious & Over-planning", 
        desc: "You spend more time planning the timetable than actually executing it. You are terrified of making a mistake. Solution: Tear up the master plan. Just pick the first topic in front of you and study it for 20 minutes."
      }
    ]
  }
];

function initGame() {
  const btnStartGame = document.getElementById("btn-start-game");
  const gameModal = document.getElementById("game-modal");
  const btnGameClose = document.getElementById("btn-game-close");
  const btnGameDone = document.getElementById("btn-game-done");
  
  const questionContainer = document.getElementById("game-question-container");
  const resultContainer = document.getElementById("game-result-container");
  
  if (!btnStartGame || !gameModal) return;

  const closeGame = () => {
    gameModal.classList.remove("active");
  };

  btnGameClose.addEventListener("click", closeGame);
  btnGameDone.addEventListener("click", closeGame);

  btnStartGame.addEventListener("click", () => {
    // Reset to question view
    questionContainer.style.display = "block";
    resultContainer.style.display = "none";
    
    // Pick a random question (currently just 1 for the hackathon, but scalable)
    const randomQ = gameQuestions[0];
    document.getElementById("game-question").innerText = randomQ.q;
    
    const optionsContainer = document.getElementById("game-options");
    optionsContainer.innerHTML = "";
    
    randomQ.options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "btn-secondary";
      btn.style.cssText = "display: flex; align-items: center; gap: 1rem; padding: 1rem; border-radius: 8px; text-align: left; cursor: pointer; border: 1px solid var(--card-border); background: rgba(255,255,255,0.02); color: var(--text-primary); transition: background 0.2s;";
      
      btn.innerHTML = `<span style="font-size: 1.5rem;">${opt.emoji}</span> <span style="font-weight: 600;">${opt.text}</span>`;
      
      // Hover effects
      btn.onmouseover = () => btn.style.background = "rgba(139, 92, 246, 0.1)";
      btn.onmouseout = () => btn.style.background = "rgba(255,255,255,0.02)";
      
      btn.onclick = () => {
        // Show results
        questionContainer.style.display = "none";
        resultContainer.style.display = "block";
        
        document.getElementById("game-result-emoji").innerText = opt.emoji;
        document.getElementById("game-result-title").innerText = `Vibe: ${opt.vibe}`;
        document.getElementById("game-result-desc").innerText = opt.desc;
      };
      
      optionsContainer.appendChild(btn);
    });

    gameModal.classList.add("active");
  });
}

document.addEventListener("DOMContentLoaded", initGame);
