const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const os = require('os');
const DB_FILE = process.env.VERCEL ? path.join(os.tmpdir(), 'database.json') : path.join(__dirname, 'database.json');

// Initialize local JSON Database if not exists
function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = { users: {}, logs: {}, errors: {}, wins: {}, oaths: {}, stretches: {}, adminAlerts: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (err) {
    console.error("Database read error, resetting:", err);
    return { users: {}, logs: {}, errors: {}, wins: {}, oaths: {}, stretches: {}, adminAlerts: [] };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Database write error:", err);
  }
}

// Helper: Parse Request Body JSON
function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error("Invalid JSON body"));
      }
    });
  });
}

// Helper: Serve Static Files
function serveStaticFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
}

// Core HTTP Request Router
const server = http.createServer(async (req, res) => {
  const urlParts = req.url.split('?');
  const pathname = urlParts[0];
  const queryStr = urlParts[1] || '';
  
  // Parse query parameters simple key=value helper
  const query = {};
  queryStr.split('&').forEach(param => {
    const parts = param.split('=');
    if (parts[0]) query[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '');
  });

  // ==========================================================================
  // HACKATHON SECURITY LAYER (Headers & Rate Limiting)
  // ==========================================================================
  // 1. Enterprise-Grade Security Headers (Helmet Equivalent)
  res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://generativelanguage.googleapis.com https://httpbin.org");
  res.setHeader('X-Frame-Options', 'DENY'); // Prevent clickjacking
  res.setHeader('X-Content-Type-Options', 'nosniff'); // Prevent MIME-sniffing
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains'); // Force HTTPS
  res.setHeader('X-XSS-Protection', '1; mode=block'); // Cross-site scripting (XSS) filter
  res.setHeader('Referrer-Policy', 'no-referrer'); // Hide referrer info

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 2. Simple API Rate Limiting (DDoS Protection)
  if (!global.rateLimits) global.rateLimits = {};
  const clientIp = req.socket.remoteAddress;
  const now = Date.now();
  if (pathname.startsWith('/api/')) {
    if (!global.rateLimits[clientIp]) global.rateLimits[clientIp] = [];
    // Filter timestamps older than 1 minute
    global.rateLimits[clientIp] = global.rateLimits[clientIp].filter(time => now - time < 60000);
    if (global.rateLimits[clientIp].length > 100) { // Limit: 100 requests per minute
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "Too Many Requests. Rate limit exceeded." }));
      return;
    }
    global.rateLimits[clientIp].push(now);
  }

  // ==========================================================================
  // BACKEND API ENDPOINTS
  // ==========================================================================
  if (pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');

    try {
      const db = readDB();

      // 1. User Registration & Login Gateway
      if (pathname === '/api/login' && req.method === 'POST') {
        const { name, phone, exam } = await getRequestBody(req);
        if (!name || !phone || !exam) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Missing required fields" }));
          return;
        }

        // Store user details in DB
        db.users[phone] = { name, phone, exam };
        
        // Seed initial mock logs for new profile if they don't have any logs yet
        if (!db.logs[phone]) {
          db.logs[phone] = [
            { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), mood: "Calm", triggers: ["Time Crunch"], journal: "Finished revising kinematics. Feeling reasonably steady." },
            { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), mood: "Stressed", triggers: ["Mock Results", "Syllabus Backlog"], journal: "Got a low score on chemistry mock test. Backlog feels huge and intimidating." },
            { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), mood: "Anxious", triggers: ["Family Expectations"], journal: "Talked to parents about preparation. I know they mean well, but the expectation pressure is high." }
          ];
        }

        writeDB(db);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, profile: db.users[phone] }));
        return;
      }

      // 2. Fetch User Logs
      if (pathname === '/api/logs' && req.method === 'GET') {
        const phone = query.phone;
        if (!phone) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Phone parameter is required" }));
          return;
        }
        res.writeHead(200);
        res.end(JSON.stringify(db.logs[phone] || []));
        return;
      }

      // 3. Save User Log
      if (pathname === '/api/logs' && req.method === 'POST') {
        const { phone, mood, triggers, journal } = await getRequestBody(req);
        if (!phone || !mood) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Missing required log fields" }));
          return;
        }
        
        if (!db.logs[phone]) db.logs[phone] = [];
        db.logs[phone].push({
          date: new Date().toISOString(),
          mood,
          triggers: triggers || [],
          journal: journal || ''
        });

        writeDB(db);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
        return;
      }

      // 4. Fetch Custom Mock test Errors
      if (pathname === '/api/errors' && req.method === 'GET') {
        const phone = query.phone;
        if (!phone) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Phone parameter is required" }));
          return;
        }
        res.writeHead(200);
        res.end(JSON.stringify(db.errors[phone] || []));
        return;
      }

      // 5. Save/Update Mock test Errors
      if (pathname === '/api/errors' && req.method === 'POST') {
        const { phone, errors } = await getRequestBody(req);
        if (!phone || !errors) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Missing required error fields" }));
          return;
        }
        db.errors[phone] = errors;
        writeDB(db);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
        return;
      }

      // 6. Fetch Checklists (Wins, Oaths, Stretches)
      if (pathname === '/api/checklists' && req.method === 'GET') {
        const phone = query.phone;
        if (!phone) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Phone parameter is required" }));
          return;
        }
        res.writeHead(200);
        res.end(JSON.stringify({
          wins: db.wins[phone] || {},
          oaths: db.oaths[phone] || {},
          stretches: db.stretches[phone] || {}
        }));
        return;
      }

      // 7. Save Checklists
      if (pathname === '/api/checklists' && req.method === 'POST') {
        const { phone, type, data } = await getRequestBody(req);
        if (!phone || !type || !data) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Missing required checklist parameters" }));
          return;
        }
        if (type === 'wins') db.wins[phone] = data;
        else if (type === 'oaths') db.oaths[phone] = data;
        else if (type === 'stretches') db.stretches[phone] = data;

        writeDB(db);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
        return;
      }

      // 8. Fetch/Post Admin Suicide & Crisis Alerts
      if (pathname === '/api/alerts' && req.method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify(db.adminAlerts));
        return;
      }
      
      if (pathname === '/api/alerts' && req.method === 'POST') {
        const alertObj = await getRequestBody(req);
        db.adminAlerts.unshift(alertObj);
        writeDB(db);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
        return;
      }

      // 9. Wipe All data for a specific user
      if (pathname === '/api/wipe' && req.method === 'POST') {
        const { phone } = await getRequestBody(req);
        if (!phone) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Phone parameter is required" }));
          return;
        }
        
        delete db.users[phone];
        delete db.logs[phone];
        delete db.errors[phone];
        delete db.wins[phone];
        delete db.oaths[phone];
        delete db.stretches[phone];

        writeDB(db);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
        return;
      }

      // Unhandled API URL
      res.writeHead(404);
      res.end(JSON.stringify({ error: "API Route Not Found" }));

    } catch (e) {
      console.error("API Exception:", e);
      res.writeHead(500);
      res.end(JSON.stringify({ error: "Internal Server Error", message: e.message }));
    }
    return;
  }

  // ==========================================================================
  // STATIC FILES SERVING (FRONTEND)
  // ==========================================================================
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  
  // Content type mapping
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  switch (extname) {
    case '.js':
      contentType = 'application/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
      contentType = 'image/jpeg';
      break;
  }

  serveStaticFile(res, filePath, contentType);
});

// Only listen if not on Vercel
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`[MINDFLOW SERVER] running successfully on http://localhost:${PORT}`);
  });
}

module.exports = server;
