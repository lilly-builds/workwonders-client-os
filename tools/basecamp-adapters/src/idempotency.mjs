import { mkdir, readFile, rmdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

// The claim file is protected by a directory lock. A future durable adapter must
// provide an equivalent atomic claim, not replace this with an unlocked read/write.
export function createIdempotencyStore(file, { retryMs = 5, timeoutMs = 2000, staleMs = 30000 } = {}) {
  const lock = `${file}.lock`;
  async function load() {
    try { return JSON.parse(await readFile(file, 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return { bugs: {}, updates: {} }; throw error; }
  }
  async function withLock(action) {
    await mkdir(path.dirname(file), { recursive: true });
    const started = Date.now();
    while (true) {
      try {
        await mkdir(lock);
        break;
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        try {
          const age = Date.now() - (await stat(lock)).mtimeMs;
          if (age > staleMs) await rmdir(lock);
        } catch (statError) {
          if (statError.code !== 'ENOENT') throw statError;
        }
        if (Date.now() - started >= timeoutMs) throw new Error(`Could not claim idempotency store lock within ${timeoutMs}ms.`);
        await wait(retryMs);
      }
    }
    try { return await action(); } finally { await rmdir(lock).catch((error) => { if (error.code !== 'ENOENT') throw error; }); }
  }
  return {
    async claim(kind, cardId, action) {
      return withLock(async () => {
        const state = await load();
        const existing = state[kind]?.[cardId];
        if (existing) return { duplicate: true, ...existing };
        state[kind] ||= {};
        state[kind][cardId] = { action, claimedAt: new Date().toISOString() };
        await writeFile(file, JSON.stringify(state, null, 2), 'utf8');
        return { duplicate: false, ...state[kind][cardId] };
      });
    },
    async read() { return load(); },
  };
}
