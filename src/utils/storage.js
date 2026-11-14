// localStorage can throw (private mode, blocked site data). These helpers never do.

export function readStorage(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: the preference simply won't persist */
  }
}
