const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'database.json');

const dummyData = {
  users: {
    "1111111111": { name: "Aarav Sharma", phone: "1111111111", exam: "JEE" },
    "2222222222": { name: "Priya Patel", phone: "2222222222", exam: "NEET" },
    "3333333333": { name: "Rohan Gupta", phone: "3333333333", exam: "UPSC" },
    "4444444444": { name: "Sneha Reddy", phone: "4444444444", exam: "CAT" },
    "5555555555": { name: "Aditya Singh", phone: "5555555555", exam: "GATE" },
    "6666666666": { name: "Kavya Verma", phone: "6666666666", exam: "Board" },
    "7777777777": { name: "Vikram Malhotra", phone: "7777777777", exam: "CUET" },
    "8888888888": { name: "Neha Joshi", phone: "8888888888", exam: "JEE" },
    "9999999999": { name: "Rahul Deshmukh", phone: "9999999999", exam: "NEET" },
    "0000000000": { name: "Crisis Test User", phone: "0000000000", exam: "UPSC" }
  },
  logs: {
    "1111111111": [
      { date: new Date(Date.now() - 2 * 86400000).toISOString(), mood: "Stressed", triggers: ["Mock Results"], journal: "Got 120/300. Feeling terrible." },
      { date: new Date(Date.now() - 1 * 86400000).toISOString(), mood: "Calm", triggers: [], journal: "Studied physics. Better." }
    ],
    "2222222222": [
      { date: new Date(Date.now() - 1 * 86400000).toISOString(), mood: "Anxious", triggers: ["Time Crunch"], journal: "Biology syllabus is endless." }
    ],
    "3333333333": [
      { date: new Date(Date.now() - 3 * 86400000).toISOString(), mood: "Burnt-Out", triggers: ["Sleep Deprived"], journal: "4 hours sleep. Can't read Laxmikanth." },
      { date: new Date(Date.now() - 2 * 86400000).toISOString(), mood: "Joyful", triggers: ["Physical Health"], journal: "Went for a run." }
    ],
    "0000000000": [
      { date: new Date().toISOString(), mood: "Burnt-Out", triggers: ["Family Expectations"], journal: "I want to end it all. I can't take this anymore." }
    ]
  },
  errors: {
    "1111111111": [
      { topic: "Rotational Dynamics Q4", cause: "Calculation Error", checked: false },
      { topic: "Integration by parts", cause: "Concept Gap", checked: true }
    ]
  },
  wins: {
    "2222222222": ["Completed Genetics Revision", "Slept 8 hours"]
  },
  oaths: {
    "3333333333": ["I will not look at my phone for the first 2 hours of study"]
  },
  stretches: {
    "4444444444": ["Started solving DILR sets without looking at solutions immediately"]
  },
  adminAlerts: [
    {
      timestamp: new Date().toISOString(),
      studentId: "0000000000",
      examTarget: "UPSC",
      triggerKeyword: "end it all"
    }
  ]
};

// Also give everyone 3 mock logs if they don't have them
Object.keys(dummyData.users).forEach(phone => {
  if (!dummyData.logs[phone]) {
    dummyData.logs[phone] = [
      { date: new Date(Date.now() - 1 * 86400000).toISOString(), mood: "Calm", triggers: ["Time Crunch"], journal: "Regular study day." }
    ];
  }
});

try {
  fs.writeFileSync(DB_FILE, JSON.stringify(dummyData, null, 2));
  console.log("Database seeded successfully with 10 dummy users at " + DB_FILE);
} catch (e) {
  console.error("Error seeding database:", e);
}
