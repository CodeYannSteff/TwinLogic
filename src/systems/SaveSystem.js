const SAVE_KEY = 'chronos-guardian-save';

export class SaveSystem {
  static save(data) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('Save failed:', e);
      return false;
    }
  }

  static load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('Load failed:', e);
      return null;
    }
  }

  static clear() {
    localStorage.removeItem(SAVE_KEY);
  }

  static hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  }
}
