/**
 * MindFlow - Student Well-being Companion (Core JS)
 * Fully offline, highly responsive, browser-native client logic.
 */

// ==========================================================================
// 1. Initial State & Seeds
// ==========================================================================
const DEFAULT_LOGS = [
  { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), mood: "Calm", triggers: ["Time Crunch"], journal: "Finished revising kinematics. Feeling reasonably steady." },
  { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), mood: "Stressed", triggers: ["Mock Results", "Syllabus Backlog"], journal: "Got a low score on chemistry mock test. Backlog feels huge and intimidating." },
  { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), mood: "Anxious", triggers: ["Family Expectations"], journal: "Talked to parents about preparation. I know they mean well, but the expectation pressure is high." },
  { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), mood: "Calm", triggers: ["Sleep Deprived"], journal: "Decided to sleep 8 hours last night. Felt much more relaxed today, was able to concentrate better." },
  { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), mood: "Burnt-Out", triggers: ["Syllabus Backlog", "Time Crunch"], journal: "Studied 12 hours straight yesterday. My brain is fried today. Can't absorb a single word of coordinate geometry." },
  { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), mood: "Joyful", triggers: ["Physical Health"], journal: "Went out for a 20-minute run. Cleared my head. Ready to tackle physics errors." }
];

const JOURNAL_PROMPTS = [
  "What chapter or topic is weighing heaviest on your chest right now? Let's dump it here.",
  "Describe one micro-achievement you did today (even if it was just sitting down to study).",
  "If your best friend was facing the exact same mock test results, what reassurance would you tell them?",
  "Write down the physical sensations of your stress. Are your shoulders tense? Is your breathing shallow?",
  "What is one thing you are looking forward to doing once this exam season is finally behind you?",
  "Reflect on a previous difficult topic that you eventually mastered. Remind yourself how you did it."
];

const EXAM_RESOURCES = {
  JEE: [
    { emoji: "🧮", title: "Coping with Mock Test Percentile Dips", text: "JEE mock tests are intentionally designed to be tougher. Treat errors as revision clues rather than intelligence ratings. Log your mistakes in a 'mistake notebook' and focus only on converting them." },
    { emoji: "⚛️", title: "Physics Formulation Panic Plan", text: "When formulas jumble up, stop solving complex problems. Spend 15 minutes mapping related concepts on a blank canvas. Visualizing the origin of the formula helps anchor memory." },
    { emoji: "🧪", title: "Organic Chemistry Overwhelm", text: "Don't try to memorize hundreds of reactions at once. Pick just 3 mechanisms daily, write them out manually, and explain them aloud. Action cures backlog anxiety." }
  ],
  NEET: [
    { emoji: "🧬", title: "Biology Memory Fatigue Hacks", text: "With massive NCERT content, syllabus fatigue is normal. Use active recall: cover a page, and try to sketch the diagram from memory. Drawing activates spatial retention." },
    { emoji: "⚡", title: "Physics Calculation Blockers", text: "Physics anxiety is common for NEET aspirants. Focus on dimensional analysis first. Often, matching units eliminates two options, reducing performance stress in MCQs." },
    { emoji: "🩺", title: "Managing the Speed-Accuracy Balance", text: "A 200-minute time constraint creates rush anxiety. Practice pacing yourself using 20-minute blocks (solving 15 biology questions calmly) instead of 3-hour long endurance tests." }
  ],
  UPSC: [
    { emoji: "📰", title: "Handling the Current Affairs Deluge", text: "The news cycle is infinite; your brain is not. Limit newspaper reading to a strict 90 minutes. If you miss a day, trust monthly compilations. Avoid FOMO (Fear of Missing Out)." },
    { emoji: "✍️", title: "Mains Answer Writing Burnout", text: "Blank page syndrome is normal. Do not wait to finish the syllabus to write answers. Write poorly, write bullet points, but write. Perfect is the enemy of done." },
    { emoji: "🕯️", title: "Isolation and Long-Term Pacing", text: "UPSC is a marathon. Schedule one social interaction daily—whether a phone call or walking in the park. Absolute isolation increases self-doubt." }
  ],
  Board: [
    { emoji: "📝", title: "Subjective Presentation Anxiety", text: "Unlike competitive MCQs, boards reward clarity. Practice writing clean, spaced answers with underlined keywords. Knowing how to present gives an immediate sense of control." },
    { emoji: "👨‍👩‍👧", title: "Family Expectations Shield", text: "Parents often show anxiety because they care. Have a calm conversation: 'I am working hard, but I need some quiet support rather than constant score checks.'" },
    { emoji: "🏫", title: "Balancing Boards with Entrance Exams", text: "Do not let boards and entrance battle for your time. Remember: Board concepts are the foundation. Strengthening board theory directly assists MCQ concepts." }
  ],
  CAT: [
    { emoji: "📈", title: "Data Interpretation Panic", text: "When a set looks impossible, remember: you do not need to solve all sets to score high. Pacing yourself to select the solvable set is the core skill. Spend 3 minutes analyzing, then decide." },
    { emoji: "🗣️", title: "Sectional Cut-off Pressure", text: "A bad VARC section can ruin focus for DILR. Train yourself to hit 'reset' in the 10-second section break. Take a deep sigh and treat the next section as a brand new test." }
  ],
  GATE: [
    { emoji: "💻", title: "Balancing Work/College with Prep", text: "Studying alongside work or final year is stressful. Focus on high-weightage topics (Maths & General Aptitude constitute ~28 marks). Quality over raw hours." },
    { emoji: "⚙️", title: "Virtual Calculator Clumsiness", text: "Using a virtual mouse-calculator is frustrating. Practice calculation routines daily to build muscle memory and avoid exam-room irritation." }
  ],
  CUET: [
    { emoji: "🖥️", title: "First-Time CBT Interface Nerves", text: "Computer-based testing can feel alien. Take at least 3 official mock tests to get used to the palette, skipping questions, and marking for review." },
    { emoji: "📚", title: "Domain Juggling Strategy", text: "Juggling 4-5 domains creates task-switching stress. Keep study blocks distinct. Do not study History and Maths in the same continuous sitting; take a break between." }
  ]
};

// State Store
const state = {
  logs: [],
  examTarget: "JEE",
  selectedMood: "",
  selectedTriggers: [],
  activePromptIndex: 0,
  streak: 0,
  userProfile: null
};

// ==========================================================================