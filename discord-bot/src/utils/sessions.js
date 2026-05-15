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
  store[userId] = { messages: [], skill, updatedAt: Date.now() };
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
  let removed = 0;
  for (const userId of Object.keys(store)) {
    if ((store[userId].updatedAt ?? 0) < cutoff) {
      delete store[userId];
      removed++;
    }
  }
  if (removed > 0) {
    save();
    console.log(`已清除 ${removed} 個逾期 session（${SESSION_TTL_DAYS} 天）`);
  }
}
