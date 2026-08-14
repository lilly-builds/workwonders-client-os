import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
export function createIdempotencyStore(file) {
  async function load() { try { return JSON.parse(await readFile(file, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return { bugs: {}, updates: {} }; throw e; } }
  return { async claim(kind, cardId, action) { const state = await load(); const existing = state[kind]?.[cardId]; if (existing) return { duplicate: true, ...existing }; state[kind] ||= {}; state[kind][cardId] = { action, claimedAt: new Date().toISOString() }; await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, JSON.stringify(state, null, 2)); return { duplicate: false, ...state[kind][cardId] }; }, async read() { return load(); } };
}
