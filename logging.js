// 4. Interactive Logging Panel (Sentiment Engine)
// ==========================================================================
function shufflePrompt() {
  const index = Math.floor(Math.random() * JOURNAL_PROMPTS.length);
  state.activePromptIndex = index;
  document.getElementById("active-journal-prompt").innerText = JOURNAL_PROMPTS[index];
}

// Client-side regex-based sentiment analysis
function analyzeSentimentLocal(text) {
  const lower = text.toLowerCase();
  
  // Keyword mappings
  const keywords = {
    backlog: ["syllabus", "backlog", "incomplete", "chapters", "missed", "delayed", "chemistry", "physics", "maths", "syllabus overload"],
    test: ["mock", "results", "marks", "score", "percentile", "rank", "failed", "low score", "test", "mistakes"],
    expectation: ["parents", "family", "father", "mother", "expectations", "peer", "friends", "comparison", "relatives", "pressures"],
    panic: ["scared", "panicky", "panic", "anxious", "anxiety", "shaking", "fear", "fail", "crying", "hopeless"],
    fatigue: ["tired", "exhausted", "sleep", "sleepy", "burnout", "burnt out", "energy", "insomnia", "no energy"],
    anger: ["angry", "hate", "mad", "unfair", "cheated", "annoyed", "pissed", "frustrated", "screwed", "worst", "waste", "irritated"],
    depression: ["lonely", "sad", "depressed", "failure", "crying", "useless", "give up", "nothing works", "no hope", "dark", "worthless", "hurt", "cried", "giving up"]
  };

  // Check matching categories
  let category = "";
  for (const [cat, words] of Object.entries(keywords)) {
    if (words.some(word => lower.includes(word))) {
      category = cat;
      break;
    }
  }

  // Affirmations library based on match
  switch (category) {
    case "backlog":
      return "Syllabus anxiety is normal. Try to list exactly three key subtopics you want to finish tomorrow. Ignore the overall mountain. You build retention block-by-block, not in single giant leaps.";
    case "test":
      return "Mock scores are diagnostics tools, not exam results. A mistake made in June is a mistake saved in the real test. Analyze why you got it wrong (was it speed, concept, or silly error?) and catalog it.";
    case "expectation":
      return "Their expectations arise from concern, but your focus must remain on your actions. Create a boundary. Remind yourself: 'My worth is independent of their worries.' Focus only on your desk.";
    case "panic":
      return "Your anxiety is an alarm bell running high. Try our breathing toolkit. Slowing down your exhale (exhale longer than inhale) signals safety to your heart rate. One hour at a time, you've got this.";
    case "fatigue":
      return "Memory retention drops by 40% when sleep-deprived. Sleep is not lost study time; it is active information consolidation. Take a step back and schedule 7 hours of rest. You will study twice as fast tomorrow.";
    case "anger":
      return "It is completely valid to feel angry and frustrated. Exam preparation puts you in a high-pressure box, and sometimes it feels incredibly unfair. Vent it all out. Anger is energy—once you let it release on the screen, try our Mind Melt tool to physically dissolve it.";
    case "depression":
      return "I hear how heavy and dark things feel right now, and I am so glad you wrote it down. When you feel hopeless or believe you are a failure, please remember: your brain is exhausted, and exhaustion distorts reality. You do not have to carry all this weight. Try the Cozy Corner breathing exercise for just one minute—no goals, no studying, just breathing.";
    default:
      return "Thank you for reflecting. Writing it down removes it from your mental loop. You are putting in real effort, and showing up is 80% of the battle. Keep breathing and trust the process.";
  }
}

// ==========================================================================