const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const statusText = document.getElementById('status-text');
const statusDot = document.getElementById('status-dot');
const countEl = document.getElementById('count');
const sessionEl = document.getElementById('session');
const usernameInput = document.getElementById('username');
const pageHint = document.getElementById('page-hint');
const hintUrl = document.getElementById('hint-url');
const mainContent = document.getElementById('main-content');
const notX = document.getElementById('not-x');

let selectedAction = null;
let sessionTotal = 0;

const pageMap = {
  tweets: (u) => `x.com/${u}`,
  retweets: (u) => `x.com/${u}`,
  likes: (u) => `x.com/${u}/likes`,
  replies: (u) => `x.com/${u}/with_replies`
};

// Check if we're on X
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const url = tabs[0]?.url || '';
  if (!url.includes('x.com') && !url.includes('twitter.com')) {
    mainContent.style.display = 'none';
    notX.style.display = 'block';
  }
});

// Action buttons
document.querySelectorAll('.action-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.action-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedAction = btn.dataset.action;
    updateHint();
    checkReady();
  });
});

// Username input
usernameInput.addEventListener('input', () => {
  updateHint();
  checkReady();
});

function updateHint() {
  const u = usernameInput.value.trim();
  if (selectedAction && u) {
    pageHint.classList.add('visible');
    hintUrl.textContent = pageMap[selectedAction](u);
  } else {
    pageHint.classList.remove('visible');
  }
}

function checkReady() {
  const ready = selectedAction && usernameInput.value.trim();
  startBtn.disabled = !ready;
}

function setStatus(text, type = 'idle') {
  statusText.textContent = text;
  statusDot.className = 'status-dot';
  if (type === 'active') statusDot.classList.add('active');
  if (type === 'done') statusDot.classList.add('done');
  if (type === 'error') statusDot.classList.add('error');
}

// Listen for updates from content script
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'UPDATE') {
    countEl.textContent = msg.count;
    sessionEl.textContent = msg.count;
    setStatus(msg.status, 'active');
  }
  if (msg.type === 'DONE') {
    countEl.textContent = msg.count;
    sessionEl.textContent = msg.count;
    setStatus(`✓ Done! ${msg.count} processed`, 'done');
    startBtn.style.display = 'block';
    startBtn.disabled = false;
    stopBtn.style.display = 'none';
  }
});

startBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  if (!username || !selectedAction) return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: 'START',
      action: selectedAction,
      username: username
    });

    countEl.textContent = '0';
    startBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    setStatus('Starting...', 'active');
  });
});

stopBtn.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { type: 'STOP' });
    startBtn.style.display = 'block';
    startBtn.disabled = false;
    stopBtn.style.display = 'none';
    setStatus('Stopped', 'idle');
  });
});
