const assert = require('assert');
const http = require('http');
process.env.VERCEL = "true"; // Prevent server from auto-listening on 3000
const server = require('./server.js');

const PORT = 3001;

async function runTests() {
  console.log("Running MindFlow Unit and Integration Tests...\n");
  
  try {
    // Wait for server to be ready
    await new Promise(resolve => server.listen(PORT, resolve));

    // 1. Test Login (Unit / Integration)
    console.log("TEST 1: User Login API");
    const loginRes = await fetch(`http://localhost:${PORT}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', phone: '1234567890', exam: 'JEE' })
    });
    assert.strictEqual(loginRes.status, 200, "Login should return 200");
    const loginData = await loginRes.json();
    assert.strictEqual(loginData.profile.name, 'Test User', "Profile name should match");
    console.log("✅ Login test passed.");

    // 2. Test Logging functionality
    console.log("TEST 2: Save Log Entry API");
    const logRes = await fetch(`http://localhost:${PORT}/api/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '1234567890', mood: 'Calm', triggers: ['Sleep'], journal: 'Test log' })
    });
    assert.strictEqual(logRes.status, 200, "Log save should return 200");
    console.log("✅ Log save test passed.");

    // 3. Test Fetching Logs
    console.log("TEST 3: Fetch Logs API");
    const getLogRes = await fetch(`http://localhost:${PORT}/api/logs?phone=1234567890`);
    const getLogData = await getLogRes.json();
    assert.ok(getLogData.length > 0, "Should return logs");
    assert.strictEqual(getLogData[getLogData.length-1].journal, 'Test log', "Journal content should match");
    console.log("✅ Log fetch test passed.");

    // 4. Test Wipe Data API
    console.log("TEST 4: Wipe User Data");
    const wipeRes = await fetch(`http://localhost:${PORT}/api/wipe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '1234567890' })
    });
    assert.strictEqual(wipeRes.status, 200, "Wipe data should return 200");
    const afterWipeRes = await fetch(`http://localhost:${PORT}/api/logs?phone=1234567890`);
    const afterWipeData = await afterWipeRes.json();
    assert.strictEqual(afterWipeData.length, 0, "Logs should be wiped");
    console.log("✅ Data wipe test passed.");

    console.log("\nAll 4 tests passed successfully! 🚀");
  } catch (err) {
    console.error("❌ Test Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runTests();
