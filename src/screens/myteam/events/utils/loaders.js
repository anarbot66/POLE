// src/utils/loaders.js
export async function loadEventConfig(eventId) {
  console.log('[DEBUG] EventPage load, eventId =', eventId);
    const resp = await fetch(`/events/${eventId}.json`);
    if (!resp.ok) throw new Error(`Event config not found: ${eventId}`);
    return await resp.json();
  }
  
  let _gamesIndexCache = null;
  export async function loadGamesIndex() {
    if (_gamesIndexCache) return _gamesIndexCache;
    const resp = await fetch(`/games/games_index.json`);
    if (!resp.ok) throw new Error('games_index.json not found');
    _gamesIndexCache = await resp.json();
    return _gamesIndexCache;
  }
  
  export async function loadGameById(gameId) {
    const idx = await loadGamesIndex();
    const meta = idx[gameId];
    if (!meta) throw new Error('Game id not found: ' + gameId);
    const resp = await fetch(meta.path);
    if (!resp.ok) throw new Error('Game file not found: ' + meta.path);
    const game = await resp.json();
    return { meta, game };
  }
  
  export function progressKey(eventId, user) {
    return `event_progress_${eventId}_${user?.id || 'guest'}`;
  }
  
  export function loadProgressLocal(eventId, user) {
    const key = progressKey(eventId, user);
    const raw = localStorage.getItem(key);
    if (!raw) return { completed: {}, rewards: [] };
    try {
      return JSON.parse(raw);
    } catch {
      return { completed: {}, rewards: [] };
    }
  }
  export function saveProgressLocal(eventId, user, progress) {
    const key = progressKey(eventId, user);
    localStorage.setItem(key, JSON.stringify(progress));
  }
  