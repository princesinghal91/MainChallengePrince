// 5. Canvas Custom Charts (Zero-Dependency Glowing UI Graphs)
// ==========================================================================
function renderCharts() {
  renderMoodTrendChart();
  renderTriggerChart();
}

function renderMoodTrendChart() {
  const canvas = document.getElementById("mood-trend-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  
  // Set dimensions correctly (accounting for high DPI displays)
  const rect = canvas.parentNode.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Take the last 7 entries
  const sortedLogs = [...state.logs]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-7);

  if (sortedLogs.length === 0) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px Outfit";
    ctx.textAlign = "center";
    ctx.fillText("No mood logs logged yet. Create your first entry!", canvas.width / 2, canvas.height / 2);
    return;
  }

  const moodValues = { "Burnt-Out": 1, "Stressed": 2, "Anxious": 3, "Calm": 4, "Joyful": 5 };
  const moodColors = { "Burnt-Out": "#f43f5e", "Stressed": "#8b5cf6", "Anxious": "#f59e0b", "Calm": "#06b6d4", "Joyful": "#10b981" };

  const padding = { top: 30, right: 30, bottom: 45, left: 50 };
  const graphWidth = canvas.width - padding.left - padding.right;
  const graphHeight = canvas.height - padding.top - padding.bottom;

  // Draw Grid Lines & Labels
  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#94a3b8";
  ctx.font = "10px Outfit";
  ctx.textAlign = "right";

  const moods = ["🥀", "😫", "😟", "😌", "🤩"];
  const moodNames = ["Burnt-out", "Stressed", "Anxious", "Calm", "Joyful"];

  for (let i = 0; i < 5; i++) {
    const y = padding.top + (graphHeight * (4 - i) / 4);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(canvas.width - padding.right, y);
    ctx.stroke();
    
    // Draw Y axis label
    ctx.fillText(`${moods[i]} ${moodNames[i]}`, padding.left - 10, y + 3);
  }

  // Calculate coordinates for points
  const points = [];
  sortedLogs.forEach((log, idx) => {
    const x = padding.left + (graphWidth * idx / Math.max(1, sortedLogs.length - 1));
    const score = moodValues[log.mood] || 3;
    const y = padding.top + (graphHeight * (5 - score) / 4);
    points.push({ x, y, mood: log.mood, date: new Date(log.date) });
  });

  // Draw Gradient Fill under line
  if (points.length > 1) {
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + graphHeight);
    gradient.addColorStop(0, "rgba(139, 92, 246, 0.25)");
    gradient.addColorStop(1, "rgba(6, 182, 212, 0.0)");
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(points[0].x, padding.top + graphHeight);
    points.forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.lineTo(points[points.length - 1].x, padding.top + graphHeight);
    ctx.closePath();
    ctx.fill();
  }

  // Draw Connecting Line
  ctx.strokeStyle = "#8b5cf6";
  ctx.lineWidth = 3.5;
  ctx.shadowColor = "rgba(139, 92, 246, 0.5)";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  points.forEach((pt, idx) => {
    if (idx === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.stroke();
  ctx.shadowBlur = 0; // Reset shadow

  // Draw Points & X-Labels
  points.forEach((pt) => {
    // Glow circle
    ctx.fillStyle = moodColors[pt.mood] || "#8b5cf6";
    ctx.strokeStyle = "#0a0814";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // X axis date labels
    ctx.fillStyle = "#64748b";
    ctx.font = "10px Outfit";
    ctx.textAlign = "center";
    const dayStr = pt.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    ctx.fillText(dayStr, pt.x, padding.top + graphHeight + 20);
  });
}

function renderTriggerChart() {
  const canvas = document.getElementById("trigger-chart-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  
  // Set dimensions correctly (accounting for high DPI displays)
  const rect = canvas.parentNode.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Collect and count triggers from last 15 logs
  const triggersCount = {};
  const recentLogs = [...state.logs].slice(-15);
  
  recentLogs.forEach(l => {
    if (l.triggers) {
      l.triggers.forEach(t => {
        triggersCount[t] = (triggersCount[t] || 0) + 1;
      });
    }
  });

  const triggerData = Object.entries(triggersCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // top 5 triggers

  if (triggerData.length === 0) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px Outfit";
    ctx.textAlign = "center";
    ctx.fillText("No stress triggers mapped yet.", canvas.width / 2, canvas.height / 2);
    return;
  }

  const padding = { top: 20, right: 30, bottom: 20, left: 110 };
  const graphWidth = canvas.width - padding.left - padding.right;
  const graphHeight = canvas.height - padding.top - padding.bottom;

  const barHeight = Math.min(24, graphHeight / (triggerData.length * 1.5));
  const maxVal = Math.max(...triggerData.map(d => d[1]));

  triggerData.forEach((data, idx) => {
    const triggerName = data[0];
    const count = data[1];

    const y = padding.top + (graphHeight * idx / triggerData.length) + (barHeight / 2);
    
    // Label Y-Axis
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px Outfit";
    ctx.textAlign = "right";
    ctx.fillText(triggerName, padding.left - 12, y + (barHeight / 2) - 1);

    // Draw Bar Background slot
    ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
    ctx.fillRect(padding.left, y, graphWidth, barHeight);

    // Draw Glowing Bar Fill
    const barWidth = (count / maxVal) * graphWidth;
    const gradient = ctx.createLinearGradient(padding.left, 0, padding.left + barWidth, 0);
    gradient.addColorStop(0, "#06b6d4");
    gradient.addColorStop(1, "#8b5cf6");
    
    ctx.fillStyle = gradient;
    ctx.fillRect(padding.left, y, barWidth, barHeight);

    // Draw bar value marker
    ctx.fillStyle = "#f8fafc";
    ctx.font = "10px Outfit";
    ctx.textAlign = "left";
    ctx.fillText(`${count}x`, padding.left + barWidth + 8, y + (barHeight / 2) - 1);
  });
}

// ==========================================================================