// FocusLock blocked page: shows remaining session time; no distractions, no links.

const SESSION_KEY = 'focuslock:session';

const timerEl = document.getElementById('timer');
const domainEl = document.getElementById('domain');
const backBtn = document.getElementById('back-btn');

const params = new URLSearchParams(location.search);
const domainParam = params.get('domain');
if (domainParam) domainEl.textContent = domainParam;
const endFromQuery = Number(params.get('end'));

function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function endTimeFromStorage(result) {
  const session = result[SESSION_KEY];
  if (session && session.sessionStatus === 'active' && session.sessionEndTime > Date.now()) {
    return session.sessionEndTime;
  }
  // No session record at all (fresh install): fall back to the redirect-time query param.
  if (!session && Number.isFinite(endFromQuery) && endFromQuery > Date.now()) return endFromQuery;
  return null;
}

function render(result) {
  const end = endTimeFromStorage(result);
  if (end === null) {
    timerEl.textContent = '0:00';
    return;
  }
  timerEl.textContent = formatClock((end - Date.now()) / 1000);
}

// Instant paint from query params, then authoritative values from storage.
if (Number.isFinite(endFromQuery) && endFromQuery > Date.now()) {
  timerEl.textContent = formatClock((endFromQuery - Date.now()) / 1000);
}

chrome.storage.local.get(SESSION_KEY).then(render);

setInterval(() => chrome.storage.local.get(SESSION_KEY).then(render), 1000);

// Go back to whatever the user was doing before hitting the blocked site.
backBtn.addEventListener('click', () => {
  if (history.length > 1) history.back();
  else location.href = 'about:blank';
});
