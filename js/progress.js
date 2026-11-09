import { STORAGE_KEY_PROGRESS } from "./config.js";
function load() { try { const raw = localStorage.getItem(STORAGE_KEY_PROGRESS); return raw ? JSON.parse(raw) : {}; } catch (_) { return {}; } }
function save(obj) { try { localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(obj)); } catch (_) {} }
export function markDone(activityId, payload) { const all = load(); all[activityId] = Object.assign({}, all[activityId], payload, { at: Date.now() }); save(all); }
export function isDone(activityId) { return !!load()[activityId]; }
export function getDone(activityId) { return load()[activityId] || null; }
export function clearAll() { save({}); }