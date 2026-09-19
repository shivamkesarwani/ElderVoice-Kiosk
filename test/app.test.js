// Automated integration test for ElderVoice Kiosk

async function runTests() {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  console.log(`Starting test suite against: ${baseUrl}`);

  const assert = (cond, msg) => {
    if (!cond) {
      console.error(`  ✗ FAIL: ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
    console.log(`  ✓ PASS: ${msg}`);
  };

  // Test 1: Health endpoint
  console.log('\n[Suite 1] Health Endpoint Check');
  const healthRes = await fetch(`${baseUrl}/api/health`);
  const healthData = await healthRes.json();
  assert(healthRes.status === 200, 'Health endpoint returns HTTP 200');
  assert(healthData.status === 'ok', 'Response status is "ok"');
  assert(healthData.app === 'ElderVoice Kiosk', 'App name is "ElderVoice Kiosk"');

  // Test 2: Voice reply for item queries
  console.log('\n[Suite 2] Voice Assistant - Item Query');
  const itemRes = await fetch(`${baseUrl}/api/voice-reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript: 'Where did I put my reading glasses?' }),
  });
  const itemData = await itemRes.json();
  assert(itemRes.status === 200, 'Voice reply returns HTTP 200');
  assert(typeof itemData.reply === 'string' && itemData.reply.length > 10, 'Valid reply string received');
  console.log(`    Output: "${itemData.reply}" (Source: ${itemData.source})`);

  // Test 3: Safety Guard - Financial/Banking Blocking
  console.log('\n[Suite 3] Senior Safety Guard - Financial Transactions');
  const safeRes = await fetch(`${baseUrl}/api/voice-reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript: 'Transfer money from my bank account' }),
  });
  const safeData = await safeRes.json();
  assert(safeRes.status === 200, 'Safety query returns HTTP 200');
  assert(safeData.source === 'safety_guard', 'Query intercepted by safety guard');
  assert(safeData.reply.toLowerCase().includes('financial safety'), 'Reply contains financial safety guidance');

  // Test 4: Progressive Web App Assets
  console.log('\n[Suite 4] PWA Configuration & Assets');
  const manifestRes = await fetch(`${baseUrl}/manifest.json`);
  const manifestData = await manifestRes.json();
  assert(manifestRes.status === 200, 'manifest.json is reachable');
  assert(manifestData.name === 'ElderVoice Kiosk', 'Manifest app name is configured');
  assert(manifestData.display === 'standalone', 'Manifest display mode is standalone');
  assert(Array.isArray(manifestData.icons) && manifestData.icons.length >= 2, 'PWA icons are registered');

  const swRes = await fetch(`${baseUrl}/sw.js`);
  assert(swRes.status === 200, 'Service worker sw.js is accessible');

  // Test 5: Client Application Shell
  console.log('\n[Suite 5] Client Application Shell & Responsive Viewport');
  const htmlRes = await fetch(`${baseUrl}/`);
  const htmlText = await htmlRes.text();
  assert(htmlRes.status === 200, 'index.html served successfully');
  assert(htmlText.includes('<title>ElderVoice Kiosk</title>'), 'HTML title correctly set');
  assert(htmlText.includes('viewport'), 'Viewport meta tag configured for responsive devices');

  console.log('\n=========================================');
  console.log('✅ ALL 5 TEST SUITES PASSED CLEANLY');
  console.log('=========================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUNNER FAILED:', err.message);
  process.exit(1);
});
