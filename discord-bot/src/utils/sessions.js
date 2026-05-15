import { writeFile } from 'fs/promises';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const MAX_MESSAGES = 20;
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

export function createSession(userId) {
  store[userId] = { messages: [] };
  save();
}

export function hasSession(userId) {
  return userId in store;
}

export function getSession(userId) {
  return store[userId];
}

export function addMessages(userId, newMessages) {
  if (!store[userId]) return;
  store[userId].messages.push(...newMessages);
  if (store[userId].messages.length > MAX_MESSAGES) {
    store[userId].messages = store[userId].messages.slice(-MAX_MESSAGES);
  }
  save();
}
