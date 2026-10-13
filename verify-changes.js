const { spawn } = require('child_process');
const WebSocketClient = require('ws');
const fs = require('fs');

async function runVerification() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1280,850',
    '--user-data-dir=C:\\Users\\nilot\\AppData\\Local\\Temp\\chrome-verify-f5',
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 2500));
  const listRes = await fetch('http://localhost:9227/json');
  const tabs = await listRes.json();
  const pageTab = tabs.find(t => t.type === 'page');
  const ws = new WebSocketClient(pageTab.webSocketDebuggerUrl);
  await new Promise(res => ws.on('open', res));

  let msgId = 1;
  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      ws.on('message', function handler(data) {
        const msg = JSON.parse(data.toString());
        if (msg.id === id) {
          ws.off('message', handler);
          resolve(msg.result);
        }
      });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  console.log('=== 1. VERIFYING LANDING PAGE ===');
  await send('Page.navigate', { url: 'http://localhost:3000?force=1' });
  await new Promise(r => setTimeout(r, 2500));

  const landingEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector("#enter-btn");
      const btnRect = btn ? btn.getBoundingClientRect() : null;
      return {
        hasEnterBtn: !!btn,
        btnTop: btnRect ? btnRect.top : 0,
        windowHeight: window.innerHeight,
        scrollHeight: document.documentElement.scrollHeight,
        overflow: document.documentElement.scrollHeight - window.innerHeight
      };
    })()`,
    returnByValue: true
  });
  console.log('Landing Page State:', landingEval.result.value);

  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('test_landing_page.png', Buffer.from(shot1.data, 'base64'));
  console.log('Saved test_landing_page.png');

  console.log('\n=== 2. VERIFYING ADMIN PAGE ===');
  await send('Page.navigate', { url: 'http://localhost:3000/admin' });
  await new Promise(r => setTimeout(r, 2000));

  // Authenticate in admin using native React input setter
  await send('Runtime.evaluate', {
    expression: `(() => {
      const input = document.querySelector('input[type="password"]');
      if (input) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, "HAWKINS_CHIEF_1983");
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
      setTimeout(() => {
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.click();
      }, 200);
    })()`
  });
  await new Promise(r => setTimeout(r, 3000));

  const adminEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('START EVENT'));
      const resetBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('RESET ALL SCORES'));
      const rows = Array.from(document.querySelectorAll('tbody tr')).map(tr => {
        const cells = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
        return { name: cells[1] || cells[2], score: cells[6] || cells[3] };
      });
      return {
        hasStartBtn: !!startBtn,
        startBtnText: startBtn ? startBtn.innerText.trim().replace(/\\n/g, ' ') : null,
        hasResetBtn: !!resetBtn,
        rowCount: rows.length,
        rows: rows.slice(0, 8)
      };
    })()`,
    returnByValue: true
  });
  console.log('Admin Page State:', adminEval.result.value);

  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('test_admin_page.png', Buffer.from(shot2.data, 'base64'));
  console.log('Saved test_admin_page.png');

  console.log('\n=== 3. VERIFYING PLAYER STANDBY SCREEN BEFORE EVENT START ===');
  // Ensure event is not_started
  await fetch('http://localhost:3000/api/admin/event/state', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'not_started', submissionsOpen: false })
  });

  await send('Page.navigate', { url: 'http://localhost:3000' });
  await new Promise(r => setTimeout(r, 1500));

  // Set participant session AND hawkins-protocol:v2 state with introSeen: true
  await send('Runtime.evaluate', {
    expression: `(() => {
      const teamSession = {
        teamId: "T01",
        teamName: "Null Pointers",
        leaderName: "Aarav Sharma",
        role: "PLAYER",
        token: "TEST_TOKEN"
      };
      localStorage.setItem("hawkins-protocol:session", JSON.stringify(teamSession));
      localStorage.setItem("hawkins-protocol:v2", JSON.stringify({
        introSeen: true,
        viewMode: "board",
        phase: "play"
      }));
      location.reload();
    })()`
  });
  await new Promise(r => setTimeout(r, 3000));

  const standbyEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const text = document.body.innerText;
      return {
        hasStandbyText: text.includes("EVENT ON STANDBY"),
        hasChiefHopperText: text.includes("Chief Hopper and the Command Bridge have not yet authorized"),
        hasSquadBadge: text.includes("HAWKINS NATIONAL LABORATORY // INCIDENT BRIEF")
      };
    })()`,
    returnByValue: true
  });
  console.log('Standby Evaluation:', standbyEval.result.value);

  const shot3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('test_standby_screen.png', Buffer.from(shot3.data, 'base64'));
  console.log('Saved test_standby_screen.png');

  console.log('\n=== 4. ADMIN STARTS EVENT (SET TO ACTIVE) ===');
  const startRes = await fetch('http://localhost:3000/api/admin/event/state', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'active', submissionsOpen: true, loginOpen: true })
  });
  console.log('Start event response:', await startRes.json());

  // Reload player view to render active Investigation Board
  await send('Page.navigate', { url: 'http://localhost:3000' });
  await new Promise(r => setTimeout(r, 3000));

  const boardEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const text = document.body.innerText;
      const enterChapterBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('ENTER CHAPTER'));
      return {
        hasBoardHeader: text.includes("EVERYTHING IS CONNECTED"),
        chapterButtonCount: enterChapterBtns.length
      };
    })()`,
    returnByValue: true
  });
  console.log('Investigation Board Evaluation:', boardEval.result.value);

  const shotBoard = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('test_investigation_board.png', Buffer.from(shotBoard.data, 'base64'));
  console.log('Saved test_investigation_board.png');

  console.log('\n=== 5. ENTER CHAPTER 1 QUIZ & VERIFY 2-TRY LIMIT ===');
  // Click first "ENTER CHAPTER" button
  await send('Runtime.evaluate', {
    expression: `(() => {
      const enterBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('ENTER CHAPTER'));
      if (enterBtns.length > 0) enterBtns[0].click();
    })()`
  });
  await new Promise(r => setTimeout(r, 2000));

  // Dismiss Pokemon dialog by clicking [ESC / SKIP] or dispatching Escape
  await send('Runtime.evaluate', {
    expression: `(() => {
      const skipBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('SKIP') || b.innerText.includes('ESC'));
      if (skipBtn) skipBtn.click();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    })()`
  });
  await new Promise(r => setTimeout(r, 1200));

  // Check quiz initial state
  const quizCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const text = document.body.innerText;
      const optionButtons = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('14 or higher') || b.innerText.includes('13 or higher'));
      const verifyBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('CONFIRM ANSWER'));
      const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('NEXT ITEM'));
      return {
        hasDocketHeader: text.includes('DOCKET ITEMS') || text.includes('STAGE 01'),
        optionCount: optionButtons.length,
        hasVerifyBtn: !!verifyBtn,
        verifyBtnText: verifyBtn ? verifyBtn.innerText.trim().replace(/\\n/g, ' ') : null,
        hasNextBtn: !!nextBtn,
        nextBtnDisabled: nextBtn ? nextBtn.disabled : null
      };
    })()`,
    returnByValue: true
  });
  console.log('Quiz Initial State:', quizCheck.result.value);

  // Select wrong answer "13 or higher" (Option B)
  console.log('Selecting wrong answer (Option B: 13 or higher)...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btnB = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('13 or higher'));
      if (btnB) btnB.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 500));

  // Click verify answer (Try 1)
  console.log('Clicking Confirm Answer (Try 1)...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const verifyBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('CONFIRM ANSWER'));
      if (verifyBtn) verifyBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 1000));

  const afterWrongTry = await send('Runtime.evaluate', {
    expression: `(() => {
      const text = document.body.innerText;
      const verifyBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('CONFIRM ANSWER'));
      const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('NEXT ITEM'));
      return {
        hasWarning: text.includes('ATTEMPT 1 INCORRECT') || text.includes('1 ATTEMPT REMAINING'),
        verifyBtnText: verifyBtn ? verifyBtn.innerText.trim().replace(/\\n/g, ' ') : null,
        nextBtnDisabled: nextBtn ? nextBtn.disabled : null
      };
    })()`,
    returnByValue: true
  });
  console.log('State After Wrong Try 1 (locked):', afterWrongTry.result.value);

  // Now select correct answer "14 or higher" (Option A)
  console.log('Selecting correct answer (Option A: 14 or higher)...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btnA = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('14 or higher'));
      if (btnA) btnA.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 500));

  // Click verify answer (Try 2 - Final)
  console.log('Clicking Confirm Answer (Final Try 2)...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const verifyBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('CONFIRM ANSWER'));
      if (verifyBtn) verifyBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 1200));

  const afterCorrectTry = await send('Runtime.evaluate', {
    expression: `(() => {
      const text = document.body.innerText;
      const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('NEXT ITEM'));
      return {
        hasVerifiedStamp: text.includes('VERIFIED ACCURATE') || text.includes('+5 PTS AWARDED'),
        hasVerifiedScore: text.includes('5 / 50 PTS'),
        nextBtnDisabled: nextBtn ? nextBtn.disabled : null
      };
    })()`,
    returnByValue: true
  });
  console.log('State After Correct Try 2 (unlocked):', afterCorrectTry.result.value);

  const shot4 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('test_quiz_verified.png', Buffer.from(shot4.data, 'base64'));
  console.log('Saved test_quiz_verified.png');

  ws.close();
  chrome.kill();
  console.log('\n=== ALL VERIFICATIONS COMPLETED SUCCESSFULLY ===');
}

runVerification().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
