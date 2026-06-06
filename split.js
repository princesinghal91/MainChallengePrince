const fs = require('fs');

const lines = fs.readFileSync('app.js', 'utf8').split('\n');
let currentFile = 'state.js';
let currentContent = [];
const files = [];

for(let i=0; i<lines.length; i++) {
  const line = lines[i];
  if(line.includes('1. Initial State & Seeds')) {
    // Keep in state.js
  }
  else if(line.includes('2. Core Initializer')) { 
    fs.writeFileSync(currentFile, currentContent.join('\n')); 
    files.push(currentFile);
    currentContent=[]; 
    currentFile='init.js'; 
  }
  else if(line.includes('2.5 Client-Server Sync Engine')) { 
    fs.writeFileSync(currentFile, currentContent.join('\n')); 
    files.push(currentFile);
    currentContent=[]; 
    currentFile='api.js'; 
  }
  else if(line.includes('3. UI Navigation & Helpers')) { 
    fs.writeFileSync(currentFile, currentContent.join('\n')); 
    files.push(currentFile);
    currentContent=[]; 
    currentFile='ui.js'; 
  }
  else if(line.includes('4. Interactive Logging Panel')) { 
    fs.writeFileSync(currentFile, currentContent.join('\n')); 
    files.push(currentFile);
    currentContent=[]; 
    currentFile='logging.js'; 
  }
  else if(line.includes('5. Canvas Custom Charts')) { 
    fs.writeFileSync(currentFile, currentContent.join('\n')); 
    files.push(currentFile);
    currentContent=[]; 
    currentFile='charts.js'; 
  }
  else if(line.includes('6. Audio Synthesizer')) { 
    fs.writeFileSync(currentFile, currentContent.join('\n')); 
    files.push(currentFile);
    currentContent=[]; 
    currentFile='audio.js'; 
  }
  else if(line.includes('7. 4-7-8 Breathing Engine State Machine')) { 
    fs.writeFileSync(currentFile, currentContent.join('\n')); 
    files.push(currentFile);
    currentContent=[]; 
    currentFile='breathing.js'; 
  }
  else if(line.includes('7.5 Crisis Alert Detection')) { 
    fs.writeFileSync(currentFile, currentContent.join('\n')); 
    files.push(currentFile);
    currentContent=[]; 
    currentFile='security.js'; 
  }
  else if(line.includes('7.8 Demotivator Practical Solutions')) { 
    fs.writeFileSync(currentFile, currentContent.join('\n')); 
    files.push(currentFile);
    currentContent=[]; 
    currentFile='demotivators.js'; 
  }
  else if(line.includes('8. Event Listeners Coordination')) { 
    fs.writeFileSync(currentFile, currentContent.join('\n')); 
    files.push(currentFile);
    currentContent=[]; 
    currentFile='events.js'; 
  }
  
  currentContent.push(line);
}
fs.writeFileSync(currentFile, currentContent.join('\n'));
files.push(currentFile);

console.log("Split app.js into:", files);

// Rename app.js to app.js.backup
fs.renameSync('app.js', 'app.js.backup');

// Update index.html
let html = fs.readFileSync('index.html', 'utf8');
const scriptTags = files.map(f => `<script src="${f}"></script>`).join('\n  ');
html = html.replace('<script src="app.js"></script>', scriptTags);
fs.writeFileSync('index.html', html);

console.log("Updated index.html successfully.");
