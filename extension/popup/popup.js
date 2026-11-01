// Popup logic: read session state directly from chrome.storage and render.

const SESSION_KEY = 'focuslock:session';

const sessionEl = document.getElementById('session');
const noSessionEl = document.getElementById('no-session');
const timerEl = document.getElementById('timer');
const blockedCountEl = document.getElementById('blocked-count');
const domainListEl = document.getElementById('domain-list');
const startBtn = document.getElementById('start-btn');
const dashboardBtn = document.getElementById('dashboard-btn');
const endBtn = document.getElementById('end-btn');

const DASHBOARD_URL_KEY = 'focuslock:dashboardUrl';
let DASHBOARD_URL = 'http://localhost:5173';

chrome.storage.local.get(DASHBOARD_URL_KEY).then((result) => {
  if (result[DASHBOARD_URL_KEY]) DASHBOARD_URL = result[DASHBOARD_URL_KEY];
});

function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function render() {
  chrome.storage.local.get(SESSION_KEY).then((result) => {
    const session = result[SESSION_KEY];
    const active = session && session.sessionStatus === 'active' && Date.now() < session.sessionEndTime;

    if (!active) {
      sessionEl.hidden = true;
      noSessionEl.hidden = false;
      return;
    }

    noSessionEl.hidden = true;
    sessionEl.hidden = false;
    const remaining = (session.sessionEndTime - Date.now()) / 1000;
    timerEl.textContent = formatClock(remaining);
    blockedCountEl.textContent = `${session.blockedDomains.length} website${session.blockedDomains.length === 1 ? '' : 's'} blocked`;
    domainListEl.innerHTML = '';
    for (const domain of session.blockedDomains) {
      const li = document.createElement('li');
      li.textContent = domain;
      domainListEl.appendChild(li);
    }
  });
}

function openDashboard() {
  chrome.tabs.create({ url: DASHBOARD_URL });
}
startBtn.addEventListener('click', openDashboard);
dashboardBtn.addEventListener('click', openDashboard);

// Ending early is forced through the dashboard so the Escape Challenge runs.
endBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: `${DASHBOARD_URL}/?endSession=1` });
  window.close();
});

chrome.runtime.onMessage.addListener((message) => {
  // The dashboard calls SESSION_COMPLETE at the end of a challenge; state re-read happens here.
  if (message && message.type === 'SESSION_COMPLETE') {
    setTimeout(render, 200);
  }
});

render();
const interval = setInterval(render, 1000);
window.addEventListener('unload', () => clearInterval(interval));
