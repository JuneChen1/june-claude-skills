import { writeFile } from 'fs/promises';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const MAX_MESSAGES = 20;
const SESSION_TTL_DAYS = 7;
const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../data');
const SESSIONS_FILE = join(DATA_DIR, 'sessions.json');

function load() {
  if (!existsSync(SESSIONS_FILE)) return {};
  try {
    return JSON.parse(readFileSync(SESSIONS_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function save() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFile(SESSIONS_FILE, JSON.stringify(store, null, 2), 'utf-8').catch(console.error);
}

const store = load();

export function createSession(userId, skill) {
  const allPrefs = store[userId]?.preferences ?? {};
  store[userId] = { messages: [], skill, updatedAt: Date.now(), preferences: allPrefs, currentPrefs: allPrefs[skill] ?? null };
  save();
}

export function hasSession(userId) {
  return userId in store;
}

export function getSession(userId) {
  return store[userId];
}

export function getSkill(userId) {
  return store[userId]?.skill;
}

export function deleteSession(userId) {
  delete store[userId];
  save();
}

export function clearSession(userId) {
  if (!store[userId]) return;
  const prefs = store[userId].preferences ?? {};
  store[userId] = { messages: [], updatedAt: Date.now(), preferences: prefs };
  save();
}

export function saveSkillPreferences(userId, skill, prefs) {
  if (!store[userId]) store[userId] = { messages: [], updatedAt: Date.now(), preferences: {} };
  if (!store[userId].preferences) store[userId].preferences = {};
  store[userId].preferences[skill] = prefs;
  store[userId].updatedAt = Date.now();
  save();
}

export function getSkillPreferences(userId, skill) {
  return store[userId]?.preferences?.[skill] ?? null;
}

export function addMessages(userId, newMessages) {
  if (!store[userId]) return;
  store[userId].messages.push(...newMessages);
  if (store[userId].messages.length > MAX_MESSAGES) {
    store[userId].messages = store[userId].messages.slice(-MAX_MESSAGES);
  }
  store[userId].updatedAt = Date.now();
  save();
}

export function cleanupSessions() {
  const cutoff = Date.now() - SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
  let cleaned = 0;
  for (const userId of Object.keys(store)) {
    const session = store[userId];
    if ((session.updatedAt ?? 0) < cutoff && session.messages.length > 0) {
      session.messages = [];
      delete session.skill;
      session.updatedAt = Date.now();
      cleaned++;
    }
  }
  if (cleaned > 0) {
    save();
    console.log(`已清除 ${cleaned} 個逾期對話紀錄（${SESSION_TTL_DAYS} 天），偏好設定保留。`);
  }
}
