// Data layer: loading, per-bracket stats, matchup/synergy scoring and filtering. No DOM access.
import { t } from './i18n.js';

export const CDN = 'https://cdn.cloudflare.steamstatic.com';
export const BRACKETS = ['pub', '1', '2', '3', '4', '5', '6', '7', '8', 'turbo', 'pro'];
export const BRACKET_NAMES = { 1: 'Herald', 2: 'Guardian', 3: 'Crusader', 4: 'Archon', 5: 'Legend', 6: 'Ancient', 7: 'Divine', 8: 'Immortal' };
export const ATTRS = ['str', 'agi', 'int', 'all'];
export const META_WEIGHTS = { off: 0, low: 0.15, mid: 0.35, high: 0.7 }; // bracket win-rate share of the counter score
const SMOOTHING = 40; // pseudo-games pulling low-sample matchups toward the expected win rate

export const store = {
  get(k, d) { try { const v = localStorage.getItem(`d2c:${k}`); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(`d2c:${k}`, JSON.stringify(v)); } catch { /* private mode */ } },
};

export const emptyFilters = () => ({ q: '', attrs: [], attack: '', roles: [], tags: [], tagMode: 'and', favOnly: false });

export const S = {
  heroes: [], byId: new Map(), byKey: new Map(), meta: null, mu: null, muCache: new Map(),
  totals: {}, stats: new Map(),
  enemy: store.get('enemy', []), ally: store.get('ally', []),
  fav: new Set(store.get('fav', [])),
  bracket: store.get('bracket', 'pub'),
  filters: { ...emptyFilters(), ...store.get('filters', {}) },
  metaSort: store.get('metaSort', 'tier'), metaDir: store.get('metaDir', -1), minPr: store.get('minPr', 0.5),
  metaWeight: store.get('metaWeight', 'low'),
  installPrompt: null,
};

export const saveDraft = () => { store.set('enemy', S.enemy); store.set('ally', S.ally); };

// ---------------------------------------------------------------------------
// Formatting helpers shared by the views
// ---------------------------------------------------------------------------
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const pct = (x, d = 1) => `${(x * 100).toFixed(d)}%`;
export const signed = (x, d = 1) => `${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(d)}`;
export const img = (p) => (p ? `${CDN}${p.replace(/\?$/, '')}` : '');
export const heroImg = (h) => img(h.img);
export const heroIcon = (h) => img(h.icon);
export const heroCrop = (h) => `${CDN}/apps/dota2/images/dota_react/heroes/crops/${h.key}.png`;
export const itemImg = (k) => `${CDN}/apps/dota2/images/dota_react/items/${k}.png`;
export const attrIcon = (a) => `${CDN}/apps/dota2/images/dota_react/icons/hero_${{ str: 'strength', agi: 'agility', int: 'intelligence', all: 'universal' }[a]}.png`;
export const attrName = (a) => t({ str: 'str', agi: 'agi', int: 'int', all: 'universal' }[a]);
export const bracketName = (b) => (b === 'pub' ? t('allPub') : b === 'turbo' ? t('turbo') : b === 'pro' ? t('pro') : BRACKET_NAMES[b]);
export const compact = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K` : String(Math.round(n)));

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------
export async function loadData() {
  const res = await fetch('data/heroes.json');
  if (!res.ok) throw new Error('heroes.json');
  const hd = await res.json();
  S.meta = hd.meta;
  S.heroes = hd.heroes;
  for (const h of S.heroes) { S.byId.set(h.id, h); S.byKey.set(h.key, h); }
  S.enemy = S.enemy.filter((id) => S.byId.has(id));
  S.ally = S.ally.filter((id) => S.byId.has(id));
  computeStats();
  if (!bracketAvailable(S.bracket)) S.bracket = 'pub';
  await ensureMatchups();
}

// Matchup datasets: STRATZ per bracket group ('all', 'hg', 'ca', 'la', 'di') with vs + with data,
// or OpenDota's pro/high-level matchups ('pro', vs only).
const MU_GROUP = { pub: 'all', turbo: 'all', 1: 'hg', 2: 'hg', 3: 'ca', 4: 'ca', 5: 'la', 6: 'la', 7: 'di', 8: 'di', pro: 'pro' };
const MU_LABEL = { all: () => t('allPub'), hg: () => 'Herald–Guardian', ca: () => 'Crusader–Archon', la: () => 'Legend–Ancient', di: () => 'Divine–Immortal', pro: () => 'Pro / High MMR' };
const muKeyFor = (b) => { const k = MU_GROUP[b] || 'all'; return k !== 'pro' && S.meta?.brackets?.includes(k) ? k : 'pro'; };
export const muLabel = () => `${S.mu?.key === 'pro' ? 'OpenDota' : 'STRATZ'} · ${MU_LABEL[S.mu?.key || 'all']()}`;

async function fetchMatchups(key) {
  if (S.muCache.has(key)) return S.muCache.get(key);
  const res = await fetch(key === 'pro' ? 'data/matchups.json' : `data/matchups-${key}.json`);
  if (!res.ok) throw new Error(`matchups ${key}`);
  const raw = (await res.json()).matchups;
  const data = { key, v: {}, w: {}, base: new Map() };
  for (const [id, row] of Object.entries(raw)) {
    data.v[id] = row.v || row; // OpenDota files store the vs map directly
    data.w[id] = row.w || {};
    let g = 0, wins = 0;
    for (const [games, won] of Object.values(data.v[id])) { g += games; wins += won; }
    data.base.set(+id, g ? wins / g : 0.5);
  }
  S.muCache.set(key, data);
  return data;
}

export async function ensureMatchups() {
  const key = muKeyFor(S.bracket);
  try {
    S.mu = await fetchMatchups(key);
  } catch (err) {
    console.warn(err);
    if (key !== 'pro') S.mu = await fetchMatchups('pro').catch(() => null);
  }
}

export const hasSynergy = () => !!S.mu && Object.values(S.mu.w).some((r) => Object.keys(r).length);

// ---------------------------------------------------------------------------
// Per-bracket stats
// ---------------------------------------------------------------------------
function rawBracket(h, b) {
  const s = h.stats;
  if (b === 'pub') return s.pub;
  if (b === 'turbo') return s.turbo;
  if (b === 'pro') return s.pro;
  return s.brackets[b] || [0, 0];
}

// Per bracket: win rate, pick rate, trend and a tier letter for every hero.
function computeStats() {
  for (const b of BRACKETS) S.totals[b] = S.heroes.reduce((a, h) => a + rawBracket(h, b)[0], 0) / 10;
  for (const b of BRACKETS) {
    const matches = S.totals[b] || 1;
    const rows = S.heroes.map((h) => {
      const [p, w] = rawBracket(h, b);
      return { id: h.id, picks: p, wins: w, wr: p ? w / p : 0, pr: p / matches, ban: b === 'pro' ? h.stats.pro[2] : 0 };
    });
    const valid = rows.filter((r) => r.picks >= 20);
    const mean = (arr) => arr.reduce((a, x) => a + x, 0) / (arr.length || 1);
    const sd = (arr, m) => Math.sqrt(mean(arr.map((x) => (x - m) ** 2))) || 1;
    const wrs = valid.map((r) => r.wr), prs = valid.map((r) => Math.log(r.pr + 1e-4));
    const mw = mean(wrs), sw = sd(wrs, mw), mp = mean(prs), sp = sd(prs, mp);
    const map = new Map();
    for (const r of rows) {
      if (r.picks < 20) { r.z = -9; r.tier = '–'; } else {
        r.z = 0.75 * ((r.wr - mw) / sw) + 0.25 * ((Math.log(r.pr + 1e-4) - mp) / sp);
        r.tier = r.z > 1.2 ? 'S' : r.z > 0.5 ? 'A' : r.z > -0.2 ? 'B' : r.z > -0.9 ? 'C' : 'D';
      }
      const [pt, wt] = S.byId.get(r.id).stats.pubTrend;
      r.trend = pt.length >= 2 ? wt[wt.length - 1] / (pt[pt.length - 1] || 1) - wt[0] / (pt[0] || 1) : 0;
      map.set(r.id, r);
    }
    S.stats.set(b, map);
  }
}

export const statOf = (id, b = S.bracket) => S.stats.get(b)?.get(id) || { wr: 0, pr: 0, picks: 0, tier: '–', z: -9, trend: 0 };
export const bracketAvailable = (b) => (S.totals[b] || 0) > 50;

// ---------------------------------------------------------------------------
// Matchups
// ---------------------------------------------------------------------------
const clampWr = (x) => Math.min(0.9, Math.max(0.1, x));

// Advantage of hero `a` when facing hero `b`, in win-rate points (0.03 = +3%).
export function advantage(a, b) {
  if (!S.mu || a === b) return { adv: 0, games: 0 };
  let games = 0, wins = 0;
  const row = S.mu.v[a]?.[b];
  if (row) { [games, wins] = row; } else {
    const rev = S.mu.v[b]?.[a];
    if (rev) { games = rev[0]; wins = rev[0] - rev[1]; }
  }
  const baseA = S.mu.base.get(a) ?? 0.5, baseB = S.mu.base.get(b) ?? 0.5;
  const expected = clampWr(0.5 + (baseA - 0.5) - (baseB - 0.5));
  const smoothed = (wins + SMOOTHING * expected) / (games + SMOOTHING);
  return { adv: smoothed - expected, games, wr: games ? wins / games : null };
}

// Synergy of hero `a` playing together with ally `b`, in win-rate points.
export function synergy(a, b) {
  if (!S.mu || a === b) return { adv: 0, games: 0 };
  const [games, wins] = S.mu.w[a]?.[b] || S.mu.w[b]?.[a] || [0, 0];
  const baseA = S.mu.base.get(a) ?? 0.5, baseB = S.mu.base.get(b) ?? 0.5;
  const expected = clampWr(baseA + baseB - 0.5);
  const smoothed = (wins + SMOOTHING * expected) / (games + SMOOTHING);
  return { adv: smoothed - expected, games, wr: games ? wins / games : null };
}

export function rankAgainst(targets, exclude, allies = []) {
  const ex = new Set(exclude);
  const useSyn = allies.length && hasSynergy();
  return S.heroes
    .filter((h) => !ex.has(h.id))
    .map((h) => {
      const parts = targets.map((e) => ({ id: e, ...advantage(h.id, e) }));
      const syn = useSyn ? allies.map((a) => ({ id: a, ...synergy(h.id, a) })) : [];
      const adv = parts.reduce((a, p) => a + p.adv, 0);
      const synSum = syn.reduce((a, p) => a + p.adv, 0);
      const st = statOf(h.id);
      const w = META_WEIGHTS[S.metaWeight] ?? META_WEIGHTS.low;
      const metaBonus = st.picks >= 20 ? (st.wr - 0.5) * w * Math.max(1, targets.length) : 0;
      return { hero: h, parts, syn, adv, synSum, score: adv + synSum + metaBonus, st };
    })
    .sort((x, y) => y.score - x.score);
}

export function tagCounts(ids) {
  const c = {};
  for (const id of ids) for (const x of S.byId.get(id).tags) c[x] = (c[x] || 0) + 1;
  return c;
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------
export function applyFilters(list, get = (x) => x) {
  const f = S.filters;
  const q = f.q.trim().toLowerCase();
  return list.filter((item) => {
    const h = get(item);
    if (q && !h.name.toLowerCase().includes(q) && !h.key.includes(q)) return false;
    if (f.attrs.length && !f.attrs.includes(h.attr)) return false;
    if (f.attack && h.attack !== f.attack) return false;
    if (f.roles.length && !f.roles.every((r) => h.roles.includes(r))) return false;
    if (f.tags.length) {
      const ok = f.tagMode === 'or' ? f.tags.some((x) => h.tags.includes(x)) : f.tags.every((x) => h.tags.includes(x));
      if (!ok) return false;
    }
    if (f.favOnly && !S.fav.has(h.id)) return false;
    return true;
  });
}

export const activeFilterCount = () => {
  const f = S.filters;
  return f.attrs.length + (f.attack ? 1 : 0) + f.roles.length + f.tags.length + (f.favOnly ? 1 : 0);
};
