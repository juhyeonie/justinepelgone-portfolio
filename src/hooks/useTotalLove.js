import { useEffect, useSyncExternalStore } from 'react';

// The Total Love counter's state, shared by every <TotalLove> on the page (the
// sidebar's and the mobile menu's), so they show the same number and send one
// queue of hearts. The server (api/love.js) owns the count; this only shows the
// number it last returned and never guesses one.
//
// Sending: hearts tapped in quick succession are gathered and sent together once
// the tapping pauses (or every 10 hearts), one request at a time. So a burst of
// taps is one request, a double-click can never be sent twice, and the count
// shown is always the server's.

const ENDPOINT = '/api/love';
const BATCH_DELAY = 450; // ms of no tapping before the hearts go out
const MAX_BATCH = 10; // the most the server accepts in one request
const NOTICE_DURATION = 2400;

let state = {
  status: 'idle', // idle → loading → ready | unavailable
  count: null,
  queued: 0, // tapped, not yet sent
  sending: 0, // in the request on its way
  notice: null, // 'sent' | 'limit' | 'error', shown briefly
};
const listeners = new Set();
let batchTimer = 0;
let noticeTimer = 0;
let isSending = false;

function setState(patch) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function showNotice(notice) {
  clearTimeout(noticeTimer);
  setState({ notice });
  noticeTimer = setTimeout(() => setState({ notice: null }), NOTICE_DURATION);
}

async function load() {
  if (state.status !== 'idle') return;
  setState({ status: 'loading' });
  try {
    const response = await fetch(ENDPOINT, { headers: { Accept: 'application/json' } });
    const data = await response.json();
    if (!response.ok || !Number.isFinite(data.count)) throw new Error('unavailable');
    setState({ status: 'ready', count: data.count });
  } catch {
    setState({ status: 'unavailable' });
  }
}

async function flush() {
  clearTimeout(batchTimer);
  batchTimer = 0;
  if (isSending || state.queued === 0) return;

  const amount = Math.min(state.queued, MAX_BATCH);
  isSending = true;
  setState({ queued: state.queued - amount, sending: amount });

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ count: amount }),
    });
    const data = await response.json().catch(() => ({}));

    if (response.ok && Number.isFinite(data.count)) {
      setState({ count: data.count });
      showNotice('sent');
    } else if (response.status === 429) {
      // Over the limit: drop what is still waiting, show the real total.
      setState({ queued: 0, ...(Number.isFinite(data.count) ? { count: data.count } : {}) });
      showNotice('limit');
    } else {
      throw new Error('failed');
    }
  } catch {
    // Not retried automatically, so hearts are never counted twice.
    setState({ queued: 0 });
    showNotice('error');
  } finally {
    isSending = false;
    setState({ sending: 0 });
  }

  if (state.queued > 0) scheduleFlush();
}

function scheduleFlush() {
  clearTimeout(batchTimer);
  if (state.queued >= MAX_BATCH) {
    flush();
    return;
  }
  batchTimer = setTimeout(flush, BATCH_DELAY);
}

// Returns false when the heart cannot be sent (the counter is not available).
function sendLove() {
  if (state.status !== 'ready') return false;
  setState({ queued: state.queued + 1 });
  scheduleFlush();
  return true;
}

// Hearts still waiting when the visitor leaves go out with the page.
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    if (state.queued === 0 || !navigator.sendBeacon) return;
    const amount = Math.min(state.queued, MAX_BATCH);
    const body = new Blob([JSON.stringify({ count: amount })], { type: 'application/json' });
    if (navigator.sendBeacon(ENDPOINT, body)) setState({ queued: 0 });
  });
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => state;

export function useTotalLove() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => {
    load();
  }, []);
  return { ...snapshot, pending: snapshot.queued + snapshot.sending, sendLove };
}
