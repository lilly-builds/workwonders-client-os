import { BOARDS } from './contracts.mjs';
export function fakeBasecamp() { const cards = { bugs: new Map(), updates: new Map() }; return { contexts: { bugs: { boardUrl: BOARDS.bugs.url }, updates: { boardUrl: BOARDS.updates.url } }, put(kind, card) { cards[kind].set(card.card_id, card); }, get(kind, id) { return cards[kind].get(id); } }; }
