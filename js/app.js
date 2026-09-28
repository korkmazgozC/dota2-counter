import { t, lang, setLang, tagLabel, roleLabel, TAGS, ROLES, ITEM_ADVICE, ITEM_NAMES } from './i18n.js';

const CDN = 'https://cdn.cloudflare.steamstatic.com';
const BRACKETS = ['pub', '1', '2', '3', '4', '5', '6', '7', '8', 'turbo', 'pro'];
const BRACKET_NAMES = { 1: 'Herald', 2: 'Guardian', 3: 'Crusader', 4: 'Archon', 5: 'Legend', 6: 'Ancient', 7: 'Divine', 8: 'Immortal' };
const ATTRS = ['str', 'agi', 'int', 'all'];
const SMOOTHING = 40; // pseudo-games pulling low-sample matchups toward the expected win rate
const META_WEIGHTS = { off: 0, low: 0.15, mid: 0.35, high: 0.7 }; // bracket win-rate share of the counter score

// ---------------------------------------------------------------------------
// Storage & state
// ---------------------------------------------------------------------------
const store = {
  get(k, d) { try { const v = localStorage.getItem(`d2c:${k}`); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(`d2c:${k}`, JSON.stringify(v)); } catch { /* private mode */ } },
};

const emptyFilters = () => ({ q: '', attrs: [], attack: '', roles: [], tags: [], tagMode: 'and', favOnly: false });

const S = {
  heroes: [], byId: new Map(), byKey: new Map(), meta: null, mu: null, muCache: new Map(),
  totals: {}, stats: new Map(),
  enemy: store.get('enemy', []), ally: store.get('ally', []),
  fav: new Set(store.get('fav', [])),
  bracket: store.get('bracket', 'pub'),
  filters: { ...emptyFilters(), ...store.get('filters', {}) },
  metaSort: store.get('metaSort', 'tier'), minPr: store.get('minPr', 0.5),
  metaWeight: store.get('metaWeight', 'low'),
  installPrompt: null,
};

const saveDraft = () => { store.set('enemy', S.enemy); store.set('ally', S.ally); };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const $ = (sel, el = document) => el.querySelector(sel);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = (x, d = 1) => `${(x * 100).toFixed(d)}%`;
const signed = (x, d = 1) => `${x >= 0 ? '+' : ''}${x.toFixed(d)}`;
const img = (p) => (p ? `${CDN}${p.replace(/\?$/, '')}` : '');
const heroImg = (h) => img(h.img);
const heroIcon = (h) => img(h.icon);
const itemImg = (k) => `${CDN}/apps/dota2/images/dota_react/items/${k}.png`;
const attrName = (a) => t({ str: 'str', agi: 'agi', int: 'int', all: 'universal' }[a]);
const bracketName = (b) => (b === 'pub' ? t('allPub') : b === 'turbo' ? t('turbo') : b === 'pro' ? t('pro') : BRACKET_NAMES[b]);

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast.tm);
  toast.tm = setTimeout(() => el.classList.remove('show'), 2200);
}

const ICONS = {
  counter: '<svg viewBox="0 0 24 24"><path d="M6.2 3 3 6.2l4.4 4.4-2.1 2.1 1.4 1.4 2.1-2.1 2.1 2.1-5.5 5.5L6.8 21l5.2-5.2 5.2 5.2 1.4-1.4-5.5-5.5 2.1-2.1 2.1 2.1 1.4-1.4-2.1-2.1L21 6.2 17.8 3l-5.8 5.8z" fill="currentColor"/></svg>',
  meta: '<svg viewBox="0 0 24 24"><path d="M4 20V10h3v10H4zm6 0V4h3v16h-3zm6 0v-7h3v7h-3z" fill="currentColor"/></svg>',
  heroes: '<svg viewBox="0 0 24 24"><path d="M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z" fill="currentColor"/></svg>',
  more: '<svg viewBox="0 0 24 24"><path d="M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="currentColor"/></svg>',
  filter: '<svg viewBox="0 0 24 24"><path d="M3 5h18l-7 8v6l-4-2v-4z" fill="currentColor"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z" fill="currentColor"/></svg>',
  share: '<svg viewBox="0 0 24 24"><path d="M18 16a3 3 0 0 0-2.4 1.2l-6.7-3.4a3 3 0 0 0 0-1.6l6.7-3.4A3 3 0 1 0 15 7l-6.7 3.4a3 3 0 1 0 0 3.2L15 17a3 3 0 1 0 3-1z" fill="currentColor"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z" fill="currentColor"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z" fill="currentColor"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="m14 5 1.4 1.4L9.8 12l5.6 5.6L14 19l-7-7z" fill="currentColor"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M9 3h6l1 2h4v2H4V5h4zm-3 6h12l-1 12H7z" fill="currentColor"/></svg>',
};

// ---------------------------------------------------------------------------
// Data loading & derived stats
// ---------------------------------------------------------------------------
async function loadData() {
  const hRes = await fetch('data/heroes.json');
  if (!hRes.ok) throw new Error('heroes.json');
  const hd = await hRes.json();
  S.meta = hd.meta;
  S.heroes = hd.heroes;
  for (const h of S.heroes) { S.byId.set(h.id, h); S.byKey.set(h.key, h); }
  S.enemy = S.enemy.filter((id) => S.byId.has(id));
  S.ally = S.ally.filter((id) => S.byId.has(id));
  computeStats();
}

// Matchup datasets: STRATZ per bracket group ('all', 'hg', 'ca', 'la', 'di') with vs + with data,
// or OpenDota's pro/high-level matchups ('pro', vs only).
const MU_GROUP = { pub: 'all', turbo: 'all', 1: 'hg', 2: 'hg', 3: 'ca', 4: 'ca', 5: 'la', 6: 'la', 7: 'di', 8: 'di', pro: 'pro' };
const MU_LABEL = { all: () => t('allPub'), hg: () => 'Herald–Guardian', ca: () => 'Crusader–Archon', la: () => 'Legend–Ancient', di: () => 'Divine–Immortal', pro: () => 'Pro / High MMR' };
const muKeyFor = (b) => { const k = MU_GROUP[b] || 'all'; return k !== 'pro' && S.meta?.brackets?.includes(k) ? k : 'pro'; };

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

async function ensureMatchups() {
  const key = muKeyFor(S.bracket);
  try {
    S.mu = await fetchMatchups(key);
  } catch (err) {
    console.warn(err);
    if (key !== 'pro') S.mu = await fetchMatchups('pro').catch(() => null);
  }
}

const hasSynergy = () => !!S.mu && Object.values(S.mu.w).some((r) => Object.keys(r).length);

function rawBracket(h, b) {
  const s = h.stats;
  if (b === 'pub') return s.pub;
  if (b === 'turbo') return s.turbo;
  if (b === 'pro') return s.pro;
  return s.brackets[b] || [0, 0];
}

// Per bracket: win rate, pick rate, trend and a tier letter for every hero.
function computeStats() {
  for (const b of BRACKETS) {
    const picks = S.heroes.reduce((a, h) => a + rawBracket(h, b)[0], 0);
    S.totals[b] = picks / 10;
  }
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
    for (const r of rows) {
      if (r.picks < 20) { r.z = -9; r.tier = '–'; } else {
        r.z = 0.75 * ((r.wr - mw) / sw) + 0.25 * ((Math.log(r.pr + 1e-4) - mp) / sp);
        r.tier = r.z > 1.2 ? 'S' : r.z > 0.5 ? 'A' : r.z > -0.2 ? 'B' : r.z > -0.9 ? 'C' : 'D';
      }
      if (b === 'pub') {
        const h = S.byId.get(r.id);
        const [pt, wt] = h.stats.pubTrend;
        if (pt.length >= 2) {
          const first = wt[0] / (pt[0] || 1), last = wt[wt.length - 1] / (pt[pt.length - 1] || 1);
          r.trend = last - first;
        } else r.trend = 0;
      }
      if (!S.stats.has(b)) S.stats.set(b, new Map());
      S.stats.get(b).set(r.id, r);
    }
  }
}

const statOf = (id, b = S.bracket) => S.stats.get(b)?.get(id) || { wr: 0, pr: 0, picks: 0, tier: '–', z: -9 };
const bracketAvailable = (b) => (S.totals[b] || 0) > 50;

const clampWr = (x) => Math.min(0.9, Math.max(0.1, x));

// Advantage of hero `a` when facing hero `b`, in win-rate points (0.03 = +3%).
function advantage(a, b) {
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
function synergy(a, b) {
  if (!S.mu || a === b) return { adv: 0, games: 0 };
  const [games, wins] = S.mu.w[a]?.[b] || S.mu.w[b]?.[a] || [0, 0];
  const baseA = S.mu.base.get(a) ?? 0.5, baseB = S.mu.base.get(b) ?? 0.5;
  const expected = clampWr(baseA + baseB - 0.5);
  const smoothed = (wins + SMOOTHING * expected) / (games + SMOOTHING);
  return { adv: smoothed - expected, games, wr: games ? wins / games : null };
}

function rankAgainst(targets, exclude, allies = []) {
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

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------
function applyFilters(list, get = (x) => x) {
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

const activeFilterCount = () => {
  const f = S.filters;
  return f.attrs.length + (f.attack ? 1 : 0) + f.roles.length + f.tags.length + (f.favOnly ? 1 : 0);
};

function filterBar({ showSearch = true } = {}) {
  const n = activeFilterCount();
  const chips = [
    ...S.filters.tags.map((x) => `<button class="chip on" data-act="rmTag" data-v="${x}" style="--c:${TAGS[x].color}">${esc(tagLabel(x))} ${ICONS.x}</button>`),
    ...S.filters.roles.map((x) => `<button class="chip on" data-act="rmRole" data-v="${x}">${esc(roleLabel(x))} ${ICONS.x}</button>`),
    ...S.filters.attrs.map((x) => `<button class="chip on" data-act="rmAttr" data-v="${x}">${esc(attrName(x))} ${ICONS.x}</button>`),
  ];
  return `
    <div class="filterbar">
      ${showSearch ? `<input class="search" type="search" placeholder="${t('search')}" value="${esc(S.filters.q)}" data-act="search" autocomplete="off">` : ''}
      <button class="btn ${n ? 'accent' : ''}" data-act="openFilters">${ICONS.filter}<span>${t('filters')}${n ? ` · ${n}` : ''}</span></button>
    </div>
    ${chips.length ? `<div class="chips active-chips">${chips.join('')}<button class="chip ghost" data-act="resetFilters">${t('resetFilters')}</button></div>` : ''}
    <div class="quick-tags chips scroll-x">
      ${['stun', 'root', 'slow', 'silence', 'hex', 'aoeDisable', 'save', 'heal', 'invis', 'illusion'].map((x) =>
        `<button class="chip ${S.filters.tags.includes(x) ? 'on' : ''}" data-act="toggleTag" data-v="${x}" style="--c:${TAGS[x].color}"><i class="dot"></i>${esc(tagLabel(x))}</button>`).join('')}
    </div>`;
}

function openFilters() {
  const f = S.filters;
  const row = (title, body) => `<div class="fgroup"><h4>${title}</h4><div class="chips wrap">${body}</div></div>`;
  openSheet(`
    <div class="sheet-head"><h3>${t('filters')}</h3><button class="icon-btn" data-act="closeSheet">${ICONS.x}</button></div>
    <div class="sheet-body">
      ${row(t('attribute'), ATTRS.map((a) => `<button class="chip ${f.attrs.includes(a) ? 'on' : ''}" data-act="toggleAttr" data-v="${a}"><i class="attr attr-${a}"></i>${esc(attrName(a))}</button>`).join(''))}
      ${row(t('attackType'), ['', 'Melee', 'Ranged'].map((a) => `<button class="chip ${f.attack === a ? 'on' : ''}" data-act="setAttack" data-v="${a}">${a ? t(a.toLowerCase()) : t('all')}</button>`).join(''))}
      ${row(t('roles'), Object.keys(ROLES).map((r) => `<button class="chip ${f.roles.includes(r) ? 'on' : ''}" data-act="toggleRole" data-v="${r}">${esc(roleLabel(r))}</button>`).join(''))}
      ${row(t('abilities'), Object.keys(TAGS).map((x) => `<button class="chip ${f.tags.includes(x) ? 'on' : ''}" data-act="toggleTag" data-v="${x}" style="--c:${TAGS[x].color}"><i class="dot"></i>${esc(tagLabel(x))}</button>`).join(''))}
      ${row(t('tagMode'), `<button class="chip ${f.tagMode === 'and' ? 'on' : ''}" data-act="tagMode" data-v="and">${t('tagAnd')}</button><button class="chip ${f.tagMode === 'or' ? 'on' : ''}" data-act="tagMode" data-v="or">${t('tagOr')}</button>`)}
      ${row(t('favorites'), `<button class="chip ${f.favOnly ? 'on' : ''}" data-act="favOnly">${ICONS.star} ${t('favOnly')}</button>`)}
    </div>
    <div class="sheet-foot"><button class="btn ghost" data-act="resetFilters">${t('resetFilters')}</button><button class="btn accent" data-act="closeSheet">${t('apply')}</button></div>
  `, 'filters');
}

function toggleIn(arr, v) { const i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); }

function filtersChanged() {
  store.set('filters', S.filters);
  if (S.sheetKind === 'filters') openFilters();
  render({ keepScroll: true, keepFocus: true });
}

// ---------------------------------------------------------------------------
// Sheet (bottom modal) & hero picker
// ---------------------------------------------------------------------------
function openSheet(html, kind) {
  const sheet = $('#sheet');
  const panel = $('.sheet-panel', sheet);
  const scroll = S.sheetKind === kind ? $('.sheet-body', panel)?.scrollTop : 0;
  panel.innerHTML = html;
  panel.dataset.kind = kind;
  S.sheetKind = kind;
  sheet.hidden = false;
  requestAnimationFrame(() => sheet.classList.add('open'));
  const body = $('.sheet-body', panel);
  if (body && scroll) body.scrollTop = scroll;
  document.body.classList.add('noscroll');
}

function closeSheet() {
  const sheet = $('#sheet');
  sheet.classList.remove('open');
  S.sheetKind = null;
  document.body.classList.remove('noscroll');
  setTimeout(() => { if (!S.sheetKind) sheet.hidden = true; }, 220);
}

function openPicker(team) {
  S.pickTeam = team;
  const taken = new Set([...S.enemy, ...S.ally]);
  const byAttr = ATTRS.map((a) => {
    const hs = S.heroes.filter((h) => h.attr === a);
    return `<div class="pick-group"><h4><i class="attr attr-${a}"></i>${esc(attrName(a))}</h4><div class="pick-grid">
      ${hs.map((h) => `<button class="pick ${taken.has(h.id) ? 'taken' : ''}" data-act="pick" data-id="${h.id}" data-name="${esc(h.name.toLowerCase())}" ${taken.has(h.id) ? 'disabled' : ''}>
        <img loading="lazy" src="${heroImg(h)}" alt=""><span>${esc(h.name)}</span></button>`).join('')}
    </div></div>`;
  }).join('');
  openSheet(`
    <div class="sheet-head"><h3>${t('pickHeroFor', { team: team === 'enemy' ? t('enemyTeam') : t('yourTeam') })}</h3><button class="icon-btn" data-act="closeSheet">${ICONS.x}</button></div>
    <div class="sheet-search"><input class="search" type="search" placeholder="${t('search')}" data-act="pickSearch" autocomplete="off"></div>
    <div class="sheet-body picker">${byAttr}</div>
  `, 'picker');
  if (!matchMedia('(pointer: coarse)').matches) setTimeout(() => $('.sheet-search input')?.focus(), 50);
}

function pickHero(id) {
  const team = S.pickTeam === 'ally' ? S.ally : S.enemy;
  const max = S.pickTeam === 'ally' ? 4 : 5;
  if (team.length < max && !S.enemy.includes(id) && !S.ally.includes(id)) team.push(id);
  saveDraft();
  if (team.length >= max) closeSheet(); else openPicker(S.pickTeam);
  render({ keepScroll: true });
}

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------
function heroChip(h, extra = '') {
  return `<a class="hero-chip" href="#/hero/${h.key}"><img loading="lazy" src="${heroIcon(h)}" alt="">${esc(h.name)}${extra}</a>`;
}

function tagPills(tags, max = 99) {
  const shown = tags.slice(0, max);
  return shown.map((x) => `<span class="tag" style="--c:${TAGS[x]?.color || '#888'}">${esc(tagLabel(x))}</span>`).join('') +
    (tags.length > max ? `<span class="tag more">+${tags.length - max}</span>` : '');
}

function advClass(a) { return a > 0.015 ? 'pos' : a < -0.015 ? 'neg' : 'neu'; }

function slots(team, max, label) {
  const ids = team === 'enemy' ? S.enemy : S.ally;
  let html = '';
  for (let i = 0; i < max; i++) {
    const h = S.byId.get(ids[i]);
    html += h
      ? `<button class="slot filled ${team}" data-act="unpick" data-team="${team}" data-id="${h.id}" title="${t('removeHint')}"><img src="${heroImg(h)}" alt=""><span>${esc(h.name)}</span><i class="rm">${ICONS.x}</i></button>`
      : `<button class="slot empty" data-act="openPicker" data-team="${team}" ${i > ids.length ? 'tabindex="-1"' : ''}>${ICONS.plus}<span>${t('addHero')}</span></button>`;
  }
  return `<div class="team ${team}"><div class="team-head"><h3>${label}</h3><span class="count">${ids.length}/${max}</span></div><div class="slots">${html}</div></div>`;
}

function viewCounter() {
  const enemies = S.enemy, allies = S.ally;
  let out = `
    <section class="card draft">
      ${slots('enemy', 5, t('enemyTeam'))}
      ${slots('ally', 4, t('yourTeam'))}
      <div class="draft-actions">
        <button class="btn ghost" data-act="clearDraft" ${enemies.length + allies.length ? '' : 'disabled'}>${ICONS.trash}<span>${t('clear')}</span></button>
        <button class="btn ghost" data-act="shareDraft" ${enemies.length ? '' : 'disabled'}>${ICONS.share}<span>${t('share')}</span></button>
      </div>
    </section>`;

  if (!enemies.length) {
    const popular = [...S.heroes].sort((a, b) => statOf(b.id).pr - statOf(a.id).pr).slice(0, 12);
    out += `
      <section class="card hint">
        <p>${t('counterHint')}</p>
        <h4>${t('quickAdd')} · ${esc(bracketName(S.bracket))}</h4>
        <div class="quick-grid">${popular.map((h) => `<button class="quick" data-act="quickEnemy" data-id="${h.id}"><img loading="lazy" src="${heroImg(h)}" alt=""><span>${esc(h.name)}</span><small>${pct(statOf(h.id).pr)}</small></button>`).join('')}</div>
      </section>`;
    return out;
  }

  // Suggestions
  const ranked = applyFilters(rankAgainst(enemies, [...enemies, ...allies], allies), (r) => r.hero);
  const top = ranked.slice(0, 40);
  out += `
    <section class="card">
      <div class="card-head"><div><h2>${t('suggestions')}</h2><p class="sub">${t(allies.length && hasSynergy() ? 'suggestionsSubSyn' : 'suggestionsSub')}</p>
        <p class="sub">${t('matchupData')}: <b>${S.mu?.key === 'pro' ? 'OpenDota' : 'STRATZ'} · ${esc(MU_LABEL[S.mu?.key || 'all']())}</b></p></div></div>
      <div class="toolbar"><label>${t('metaWeight')} <select class="select" data-act="metaWeight">
        ${Object.keys(META_WEIGHTS).map((k) => `<option value="${k}" ${S.metaWeight === k ? 'selected' : ''}>${t(`mw_${k}`)}</option>`).join('')}
      </select></label></div>
      ${filterBar()}
      ${top.length ? `<ol class="rank-list">${top.map((r, i) => suggestionRow(r, i)).join('')}</ol>` : `<p class="empty">${t('noResults')}</p>`}
      <p class="note">${t('matchupNote')}</p>
    </section>`;

  out += threatsCard(enemies);
  if (allies.length) out += teamCard(allies);
  if (allies.length) {
    const danger = rankAgainst(allies, [...enemies, ...allies]).slice(0, 8);
    out += `<section class="card"><h2>${t('dangerous')}</h2><div class="hero-chips">${danger.map((r) =>
      heroChip(r.hero, `<b class="adv ${advClass(r.adv)}">${signed(r.adv * 100)}</b>`)).join('')}</div></section>`;
  }
  return out;
}

function suggestionRow(r, i) {
  const h = r.hero;
  const allyFull = S.ally.length >= 4;
  return `
    <li class="rank-row">
      <a class="rank-main" href="#/hero/${h.key}">
        <span class="rank-n">${i + 1}</span>
        <img class="hero-img" loading="lazy" src="${heroImg(h)}" alt="">
        <span class="rank-info">
          <b>${esc(h.name)} ${S.fav.has(h.id) ? `<i class="fav-mini">${ICONS.star}</i>` : ''}</b>
          <small>${h.roles.slice(0, 3).map(roleLabel).join(' · ')}</small>
          <span class="tags">${tagPills(h.tags.filter((x) => S.filters.tags.includes(x)).concat(h.tags.filter((x) => !S.filters.tags.includes(x))), 4)}</span>
        </span>
        <span class="rank-score">
          <b class="adv ${advClass(r.score)}" title="${t('score')}">${signed(r.score * 100)}</b>
          <small>${t('advantage')} ${signed(r.adv * 100)}%</small>
          ${r.syn.length ? `<small>${t('synergy')} ${signed(r.synSum * 100)}%</small>` : ''}
          <small>WR ${r.st.picks ? pct(r.st.wr) : '–'}</small>
        </span>
      </a>
      <div class="rank-parts">
        ${r.parts.map((p) => { const e = S.byId.get(p.id); return `<span class="part ${advClass(p.adv)}" title="${t('vs')} ${esc(e.name)} · ${p.games.toLocaleString()} ${t('games')}"><img src="${heroIcon(e)}" alt="">${signed(p.adv * 100)}${p.games < 15 ? '<i class="low">*</i>' : ''}</span>`; }).join('')}
        ${r.syn.map((p) => { const a = S.byId.get(p.id); return `<span class="part syn ${advClass(p.adv)}" title="${t('with')} ${esc(a.name)} · ${p.games.toLocaleString()} ${t('games')}"><img src="${heroIcon(a)}" alt="">${signed(p.adv * 100)}</span>`; }).join('')}
        <button class="mini-btn" data-act="addAlly" data-id="${h.id}" ${allyFull ? 'disabled' : ''}>${ICONS.plus}${t('addToAlly')}</button>
      </div>
    </li>`;
}

function tagCounts(ids) {
  const c = {};
  for (const id of ids) for (const x of S.byId.get(id).tags) c[x] = (c[x] || 0) + 1;
  return c;
}

function threatsCard(enemies) {
  const c = tagCounts(enemies);
  const order = Object.keys(ITEM_ADVICE)
    .filter((k) => c[k] && (k !== 'stun' || c[k] >= 2) && (k !== 'slow' || c[k] >= 3) && (k !== 'heal' || c[k] >= 2) && (k !== 'mobility' || c[k] >= 2))
    .sort((a, b) => c[b] - c[a]).slice(0, 6);
  const tagSummary = Object.entries(c).sort((a, b) => b[1] - a[1]);
  return `
    <section class="card">
      <h2>${t('threats')}</h2>
      <div class="tag-summary">${tagSummary.map(([k, n]) => `<span class="tag" style="--c:${TAGS[k]?.color}">${esc(tagLabel(k))} <b>×${n}</b></span>`).join('')}</div>
      ${order.length ? `<div class="advice">${order.map((k) => {
        const a = ITEM_ADVICE[k];
        const who = enemies.filter((id) => S.byId.get(id).tags.includes(k)).map((id) => S.byId.get(id));
        return `<div class="advice-row">
          <div class="advice-text"><b>${esc(a[lang()])}</b><span class="who">${who.map((h) => `<img src="${heroIcon(h)}" alt="${esc(h.name)}" title="${esc(h.name)}">`).join('')}</span></div>
          <div class="items">${a.items.map((it) => `<figure class="item"><img loading="lazy" src="${itemImg(it)}" alt=""><figcaption>${esc(ITEM_NAMES[it])}</figcaption></figure>`).join('')}</div>
        </div>`; }).join('')}</div>` : ''}
    </section>`;
}

function teamCard(allies) {
  const c = tagCounts(allies);
  const hs = allies.map((id) => S.byId.get(id));
  const melee = hs.filter((h) => h.attack === 'Melee').length;
  const warn = [];
  if (!c.stun && !c.hex) warn.push(t('noStun'));
  if (!c.save) warn.push(t('noSave'));
  if (!c.heal) warn.push(t('noHeal'));
  if (!c.aoeDisable && allies.length >= 2) warn.push(t('noAoe'));
  if (allies.length >= 3 && melee === allies.length) warn.push(t('allMelee'));
  if (allies.length >= 3 && melee === 0) warn.push(t('allRanged'));
  const key = ['stun', 'root', 'slow', 'silence', 'hex', 'aoeDisable', 'save', 'heal', 'dispel', 'mobility', 'invis', 'pureDamage'];
  return `
    <section class="card">
      <h2>${t('teamAnalysis')}</h2>
      <div class="coverage">${key.map((k) => `<span class="cov ${c[k] ? 'have' : 'miss'}" style="--c:${TAGS[k].color}">${esc(tagLabel(k))}<b>${c[k] || 0}</b></span>`).join('')}</div>
      <div class="split"><span>${t('melee')} ${melee}</span><span>${t('ranged')} ${allies.length - melee}</span>
        ${ATTRS.map((a) => `<span><i class="attr attr-${a}"></i>${hs.filter((h) => h.attr === a).length}</span>`).join('')}</div>
      <ul class="warnings">${(warn.length ? warn : [t('goodComp')]).map((w) => `<li class="${warn.length ? 'warn' : 'ok'}">${esc(w)}</li>`).join('')}</ul>
    </section>`;
}

function bracketSelect() {
  return `<select class="select" data-act="bracket" aria-label="${t('bracket')}">
    ${BRACKETS.filter(bracketAvailable).map((b) => `<option value="${b}" ${b === S.bracket ? 'selected' : ''}>${esc(bracketName(b))}</option>`).join('')}
  </select>`;
}

function viewMeta() {
  const b = S.bracket;
  const rows = applyFilters(S.heroes.map((h) => ({ hero: h, st: statOf(h.id), trend: statOf(h.id, 'pub').trend || 0 })), (r) => r.hero)
    .filter((r) => r.st.pr * 100 >= S.minPr || S.minPr === 0);
  const sorters = {
    tier: (a, b2) => b2.st.z - a.st.z,
    wr: (a, b2) => b2.st.wr - a.st.wr,
    pr: (a, b2) => b2.st.pr - a.st.pr,
    ban: (a, b2) => (b2.hero.stats.pro[2] + b2.hero.stats.pro[0]) - (a.hero.stats.pro[2] + a.hero.stats.pro[0]),
    trend: (a, b2) => b2.trend - a.trend,
    name: (a, b2) => a.hero.name.localeCompare(b2.hero.name),
  };
  rows.sort(sorters[S.metaSort] || sorters.tier);
  const maxPr = Math.max(...rows.map((r) => r.st.pr), 0.01);
  const proMatches = S.totals.pro || 1;
  return `
    <section class="card">
      <div class="card-head"><div><h2>${t('metaTitle')} ${S.meta.patch ? `<span class="badge">${esc(S.meta.patch)}</span>` : ''}</h2>
        <p class="sub">${esc(bracketName(b))} · ${Math.round(S.totals[b]).toLocaleString()} ${t('games')}</p></div></div>
      <div class="toolbar">
        <label>${t('bracket')} ${bracketSelect()}</label>
        <label>${t('sortBy')} <select class="select" data-act="metaSort">
          ${[['tier', 'sortTier'], ['wr', 'sortWr'], ['pr', 'sortPr'], ['trend', 'sortTrend'], ['ban', 'sortBan'], ['name', 'sortName']].map(([v, k]) => `<option value="${v}" ${S.metaSort === v ? 'selected' : ''}>${t(k)}</option>`).join('')}
        </select></label>
        <label>${t('minPr')} <select class="select" data-act="minPr">
          ${[0, 0.5, 1, 2, 5].map((v) => `<option value="${v}" ${S.minPr === v ? 'selected' : ''}>${v}%</option>`).join('')}
        </select></label>
      </div>
      ${filterBar()}
      <div class="meta-list">
        <div class="meta-row head"><span>${t('tier')}</span><span></span><span>${t('winRate')}</span><span>${t('pickRate')}</span><span class="hide-sm">${b === 'pro' ? t('bans') : t('trend')}</span></div>
        ${rows.map((r) => `
          <a class="meta-row" href="#/hero/${r.hero.key}">
            <span class="tier tier-${r.st.tier}">${r.st.tier}</span>
            <span class="meta-hero"><img loading="lazy" src="${heroImg(r.hero)}" alt=""><b>${esc(r.hero.name)}</b></span>
            <span class="bar-cell"><b class="${r.st.wr >= 0.5 ? 'pos' : 'neg'}">${r.st.picks ? pct(r.st.wr) : '–'}</b><i class="bar wr" style="--w:${Math.max(0, Math.min(1, (r.st.wr - 0.4) / 0.2)) * 100}%"></i></span>
            <span class="bar-cell"><b>${pct(r.st.pr)}</b><i class="bar pr" style="--w:${(r.st.pr / maxPr) * 100}%"></i></span>
            <span class="hide-sm">${b === 'pro' ? pct(r.hero.stats.pro[2] / proMatches) : `<b class="${r.trend >= 0 ? 'pos' : 'neg'}">${signed(r.trend * 100)}</b>`}</span>
          </a>`).join('') || `<p class="empty">${t('noResults')}</p>`}
      </div>
      <p class="note">${t('tierNote')}</p>
    </section>`;
}

function viewHeroes() {
  const list = applyFilters(S.heroes);
  return `
    <section class="card">
      <div class="card-head"><div><h2>${t('heroesTitle')}</h2><p class="sub">${t('heroCount', { n: list.length })}</p></div></div>
      ${filterBar()}
      <div class="hero-grid">
        ${list.map((h) => `<a class="hero-card" href="#/hero/${h.key}">
          <img loading="lazy" src="${heroImg(h)}" alt="">
          ${S.fav.has(h.id) ? `<i class="fav-badge">${ICONS.star}</i>` : ''}
          <span class="tier-badge tier-${statOf(h.id).tier}">${statOf(h.id).tier}</span>
          <span class="hc-name"><i class="attr attr-${h.attr}"></i>${esc(h.name)}</span>
          <span class="hc-tags">${tagPills(S.filters.tags.length ? h.tags.filter((x) => S.filters.tags.includes(x)) : h.tags, 3)}</span>
        </a>`).join('') || `<p class="empty">${t('noResults')}</p>`}
      </div>
    </section>`;
}

function sparkline(values, cls) {
  if (!values.length) return '';
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1 || 1)) * 100},${30 - ((v - min) / span) * 26 - 2}`).join(' ');
  return `<svg class="spark ${cls}" viewBox="0 0 100 30" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
}

function viewHero(key) {
  const h = S.byKey.get(key);
  if (!h) return `<section class="card"><p class="empty">404</p></section>`;
  const st = statOf(h.id);
  const others = S.heroes.filter((o) => o.id !== h.id);
  const vs = others.map((o) => ({ hero: o, ...advantage(o.id, h.id) }));
  const counters = [...vs].sort((a, b) => b.adv - a.adv).slice(0, 10);
  const goodVs = [...vs].sort((a, b) => a.adv - b.adv).slice(0, 10);
  const mates = hasSynergy() ? others.map((o) => ({ hero: o, ...synergy(h.id, o.id) })).sort((a, b) => b.adv - a.adv).slice(0, 10) : [];
  const [pt, wt] = h.stats.pubTrend;
  const wrTrend = pt.map((p, i) => (p ? wt[i] / p : 0));
  const brs = ['1', '2', '3', '4', '5', '6', '7', '8'].filter(bracketAvailable);
  const inEnemy = S.enemy.includes(h.id), inAlly = S.ally.includes(h.id);
  const base = h.base;

  return `
    <section class="hero-hero" style="--bg:url('${heroImg(h)}')">
      <button class="icon-btn back" data-act="back" aria-label="back">${ICONS.back}</button>
      <div class="hh-inner">
        <img class="hh-img" src="${heroImg(h)}" alt="">
        <div>
          <h1>${esc(h.name)}</h1>
          <p class="hh-meta"><i class="attr attr-${h.attr}"></i>${esc(attrName(h.attr))} · ${t(h.attack.toLowerCase())}</p>
          <p class="hh-roles">${h.roles.map((r) => `<span>${esc(roleLabel(r))}</span>`).join('')}</p>
        </div>
      </div>
      <div class="hh-actions">
        <button class="btn ${S.fav.has(h.id) ? 'accent' : 'ghost'}" data-act="fav" data-id="${h.id}">${ICONS.star}<span>${S.fav.has(h.id) ? t('unfavorite') : t('favorite')}</span></button>
        <button class="btn ghost" data-act="counterThis" data-id="${h.id}" ${inEnemy || inAlly || S.enemy.length >= 5 ? 'disabled' : ''}>${ICONS.counter}<span>${inEnemy ? t('picked') : t('counterThis')}</span></button>
        <button class="btn ghost" data-act="addAlly" data-id="${h.id}" ${inEnemy || inAlly || S.ally.length >= 4 ? 'disabled' : ''}>${ICONS.plus}<span>${inAlly ? t('inTeam') : t('addToAlly')}</span></button>
        <button class="btn ghost" data-act="shareHero" data-key="${h.key}">${ICONS.share}<span>${t('share')}</span></button>
      </div>
    </section>

    <section class="card stats-card">
      <h2>${t('stats')} <small>${esc(bracketName(S.bracket))}</small></h2>
      <div class="kpis">
        <div class="kpi"><span>${t('tier')}</span><b class="tier tier-${st.tier}">${st.tier}</b></div>
        <div class="kpi"><span>${t('winRate')}</span><b class="${st.wr >= 0.5 ? 'pos' : 'neg'}">${st.picks ? pct(st.wr) : '–'}</b></div>
        <div class="kpi"><span>${t('pickRate')}</span><b>${pct(st.pr)}</b></div>
        <div class="kpi"><span>Pro</span><b>${h.stats.pro[0]}P · ${h.stats.pro[2]}B</b></div>
      </div>
      ${pt.length ? `<div class="trend-box"><h4>${t('last7')}</h4>
        <div class="trend-row"><span>${t('winRate')}</span>${sparkline(wrTrend, 'wr')}<b>${pct(wrTrend[wrTrend.length - 1] || 0)}</b></div>
        <div class="trend-row"><span>${t('picks')}</span>${sparkline(pt, 'pr')}<b>${pt[pt.length - 1].toLocaleString()}</b></div></div>` : ''}
      <h4>${t('byBracket')}</h4>
      <div class="bracket-bars">${brs.map((b) => { const s = statOf(h.id, b); return `
        <div class="bb"><span>${BRACKET_NAMES[b]}</span><i class="bar wr" style="--w:${Math.max(0, Math.min(1, (s.wr - 0.4) / 0.2)) * 100}%"></i><b class="${s.wr >= 0.5 ? 'pos' : 'neg'}">${pct(s.wr)}</b><small>${pct(s.pr)}</small></div>`; }).join('')}</div>
    </section>

    ${S.mu ? `<section class="card two-col">
      <div><h2>${t('counteredBy')}</h2><ol class="mini-list">${counters.map((r) => `<li><a href="#/hero/${r.hero.key}"><img loading="lazy" src="${heroIcon(r.hero)}" alt="">${esc(r.hero.name)}</a><b class="adv ${advClass(r.adv)}">${signed(r.adv * 100)}%</b><small>${r.games.toLocaleString()} ${t('games')}</small></li>`).join('')}</ol></div>
      <div><h2>${t('goodAgainst')}</h2><ol class="mini-list">${goodVs.map((r) => `<li><a href="#/hero/${r.hero.key}"><img loading="lazy" src="${heroIcon(r.hero)}" alt="">${esc(r.hero.name)}</a><b class="adv ${advClass(-r.adv)}">${signed(-r.adv * 100)}%</b><small>${r.games.toLocaleString()} ${t('games')}</small></li>`).join('')}</ol></div>
      ${mates.length ? `<div><h2>${t('bestTeammates')}</h2><ol class="mini-list">${mates.map((r) => `<li><a href="#/hero/${r.hero.key}"><img loading="lazy" src="${heroIcon(r.hero)}" alt="">${esc(r.hero.name)}</a><b class="adv ${advClass(r.adv)}">${signed(r.adv * 100)}%</b><small>${r.games.toLocaleString()} ${t('games')}</small></li>`).join('')}</ol></div>` : ''}
      <p class="note">${t('matchupData')}: ${S.mu.key === 'pro' ? 'OpenDota' : 'STRATZ'} · ${esc(MU_LABEL[S.mu.key]())}. ${t('matchupNote')}</p>
    </section>` : ''}

    <section class="card">
      <h2>${t('tags')}</h2>
      <div class="tag-summary">${h.tags.map((x) => `<button class="tag as-btn" data-act="filterTag" data-v="${x}" style="--c:${TAGS[x]?.color}">${esc(tagLabel(x))}</button>`).join('')}</div>
      <h2>${t('abilitiesTitle')}</h2>
      <div class="abilities">${h.abilities.filter((a) => a.desc).map((a) => `
        <details class="ability">
          <summary><img loading="lazy" src="${img(a.img)}" alt="" onerror="this.style.visibility='hidden'"><span><b>${esc(a.name)}</b><span class="tags">${tagPills(a.tags)}</span></span></summary>
          <p>${esc(a.desc)}</p>
          <p class="ab-meta">${a.dmgType ? `<span>${esc(a.dmgType)}</span>` : ''}${a.bkb ? `<span>BKB: ${esc(a.bkb)}</span>` : ''}${a.cd ? `<span>CD: ${esc([].concat(a.cd).join('/'))}</span>` : ''}${a.mc ? `<span>Mana: ${esc([].concat(a.mc).join('/'))}</span>` : ''}</p>
        </details>`).join('')}</div>
      ${h.aghs ? `<div class="aghs">${h.aghs.scepter ? `<p><img src="${itemImg('ultimate_scepter')}" alt="">${esc(h.aghs.scepter)}</p>` : ''}${h.aghs.shard ? `<p><img src="${itemImg('aghanims_shard')}" alt="">${esc(h.aghs.shard)}</p>` : ''}</div>` : ''}
    </section>

    <section class="card">
      <h2>${t('baseStats')}</h2>
      <div class="base-grid">
        <span><i class="attr attr-str"></i>${base.str} +${base.strGain}</span>
        <span><i class="attr attr-agi"></i>${base.agi} +${base.agiGain}</span>
        <span><i class="attr attr-int"></i>${base.int} +${base.intGain}</span>
        <span>DMG ${base.dmgMin}–${base.dmgMax}</span><span>Range ${base.range}</span><span>MS ${base.ms}</span>
        <span>Armor ${base.armor}</span><span>BAT ${base.bat}</span><span>MR ${base.mr}%</span>
      </div>
    </section>`;
}

function viewMore() {
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const updated = S.meta?.updated ? new Date(S.meta.updated).toLocaleString(lang() === 'tr' ? 'tr-TR' : 'en-US') : '–';
  return `
    <section class="card">
      <h2>${t('moreTitle')}</h2>
      <div class="setting"><span>${t('language')}</span>
        <div class="seg"><button class="${lang() === 'tr' ? 'on' : ''}" data-act="lang" data-v="tr">Türkçe</button><button class="${lang() === 'en' ? 'on' : ''}" data-act="lang" data-v="en">English</button></div></div>
      <div class="setting"><span>${t('bracket')}</span>${bracketSelect()}</div>
    </section>
    <section class="card">
      <h2>${t('install')}</h2>
      ${standalone ? `<p class="ok-text">${t('installed')}</p>` : `
        ${S.installPrompt ? `<button class="btn accent block" data-act="install">${t('installNow')}</button>` : ''}
        <ul class="install-list"><li>${t('installIos')}</li><li>${t('installAndroid')}</li><li>${t('installDesktop')}</li></ul>`}
    </section>
    <section class="card">
      <h2>${t('dataInfo')}</h2>
      <dl class="info">
        <dt>${t('patch')}</dt><dd>${esc(S.meta?.patch || '–')}</dd>
        <dt>${t('updated')}</dt><dd>${esc(updated)}</dd>
        <dt>Heroes</dt><dd>${S.heroes.length}</dd>
        <dt>${t('dataSource')}</dt><dd><a href="https://www.opendota.com" target="_blank" rel="noopener">OpenDota</a></dd>
      </dl>
      <p class="note">${t('dataNote')}</p>
      <button class="btn ghost block" data-act="resetAll">${ICONS.trash}<span>${t('resetAll')}</span></button>
    </section>
    <p class="footer-note">Dota 2 is a registered trademark of Valve Corporation. This app is not affiliated with Valve.</p>`;
}

// ---------------------------------------------------------------------------
// Router & rendering
// ---------------------------------------------------------------------------
function parseRoute() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [path, query] = hash.split('?');
  const parts = path.split('/').filter(Boolean);
  return { name: parts[0] || 'counter', arg: parts[1], params: new URLSearchParams(query || '') };
}

function render({ keepScroll = false, keepFocus = false } = {}) {
  const r = parseRoute();
  const view = $('#view');
  const focused = keepFocus && document.activeElement?.dataset?.act === 'search' ? document.activeElement : null;
  const caret = focused ? focused.selectionStart : 0;
  const y = window.scrollY;
  let html;
  switch (r.name) {
    case 'meta': html = viewMeta(); break;
    case 'heroes': html = viewHeroes(); break;
    case 'hero': html = viewHero(r.arg); break;
    case 'more': html = viewMore(); break;
    default: html = viewCounter();
  }
  view.innerHTML = html;
  document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('on', a.dataset.route === (r.name === 'hero' ? 'heroes' : r.name)));
  $('#bracketTop').innerHTML = bracketSelect();
  if (focused) { const el = $('[data-act="search"]', view); if (el) { el.focus(); el.setSelectionRange(caret, caret); } }
  if (keepScroll) window.scrollTo(0, y); else window.scrollTo(0, 0);
}

function handleRouteParams() {
  const r = parseRoute();
  if (r.name === 'counter' && (r.params.has('e') || r.params.has('a'))) {
    const ids = (k) => (r.params.get(k) || '').split(',').map(Number).filter((id) => S.byId.has(id));
    S.enemy = [...new Set(ids('e'))].slice(0, 5);
    S.ally = [...new Set(ids('a'))].filter((id) => !S.enemy.includes(id)).slice(0, 4);
    saveDraft();
    history.replaceState(null, '', '#/counter');
  }
}

async function share(url, title) {
  if (navigator.share) {
    try { await navigator.share({ title, url }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(url); toast(t('copied')); } catch { prompt('URL', url); }
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
const actions = {
  openPicker: (el) => openPicker(el.dataset.team),
  pick: (el) => pickHero(+el.dataset.id),
  unpick: (el) => {
    const id = +el.dataset.id;
    if (el.dataset.team === 'ally') S.ally = S.ally.filter((x) => x !== id); else S.enemy = S.enemy.filter((x) => x !== id);
    saveDraft(); render({ keepScroll: true });
  },
  quickEnemy: (el) => { const id = +el.dataset.id; if (!S.enemy.includes(id)) S.enemy.push(id); saveDraft(); render({ keepScroll: true }); },
  addAlly: (el) => {
    const id = +el.dataset.id;
    if (S.ally.length < 4 && !S.ally.includes(id) && !S.enemy.includes(id)) { S.ally.push(id); saveDraft(); toast(`${S.byId.get(id).name} → ${t('yourTeam')}`); }
    render({ keepScroll: true });
  },
  counterThis: (el) => { const id = +el.dataset.id; if (!S.enemy.includes(id) && S.enemy.length < 5) S.enemy.push(id); saveDraft(); location.hash = '#/counter'; },
  clearDraft: () => { S.enemy = []; S.ally = []; saveDraft(); render(); },
  shareDraft: () => {
    const url = `${location.origin}${location.pathname}#/counter?e=${S.enemy.join(',')}${S.ally.length ? `&a=${S.ally.join(',')}` : ''}`;
    share(url, `${t('appName')}: ${S.enemy.map((id) => S.byId.get(id).name).join(', ')}`);
  },
  shareHero: (el) => share(`${location.origin}${location.pathname}#/hero/${el.dataset.key}`, S.byKey.get(el.dataset.key).name),
  fav: (el) => { const id = +el.dataset.id; if (S.fav.has(id)) S.fav.delete(id); else S.fav.add(id); store.set('fav', [...S.fav]); render({ keepScroll: true }); },
  openFilters: () => openFilters(),
  closeSheet: () => closeSheet(),
  toggleTag: (el) => { toggleIn(S.filters.tags, el.dataset.v); filtersChanged(); },
  rmTag: (el) => { toggleIn(S.filters.tags, el.dataset.v); filtersChanged(); },
  toggleRole: (el) => { toggleIn(S.filters.roles, el.dataset.v); filtersChanged(); },
  rmRole: (el) => { toggleIn(S.filters.roles, el.dataset.v); filtersChanged(); },
  toggleAttr: (el) => { toggleIn(S.filters.attrs, el.dataset.v); filtersChanged(); },
  rmAttr: (el) => { toggleIn(S.filters.attrs, el.dataset.v); filtersChanged(); },
  setAttack: (el) => { S.filters.attack = el.dataset.v; filtersChanged(); },
  tagMode: (el) => { S.filters.tagMode = el.dataset.v; filtersChanged(); },
  favOnly: () => { S.filters.favOnly = !S.filters.favOnly; filtersChanged(); },
  resetFilters: () => { S.filters = emptyFilters(); filtersChanged(); },
  filterTag: (el) => { S.filters = emptyFilters(); S.filters.tags = [el.dataset.v]; store.set('filters', S.filters); location.hash = '#/heroes'; },
  back: () => { if (history.length > 1) history.back(); else location.hash = '#/heroes'; },
  lang: (el) => { setLang(el.dataset.v); applyStaticText(); render({ keepScroll: true }); },
  install: async () => { if (!S.installPrompt) return; S.installPrompt.prompt(); await S.installPrompt.userChoice; S.installPrompt = null; render({ keepScroll: true }); },
  resetAll: () => {
    if (!confirm(t('resetConfirm'))) return;
    S.enemy = []; S.ally = []; S.fav.clear(); S.filters = emptyFilters();
    ['enemy', 'ally', 'fav', 'filters'].forEach((k) => store.set(k, k === 'filters' ? S.filters : []));
    render();
  },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.tagName === 'INPUT' || el.tagName === 'SELECT') return;
  if (el.id === 'sheet' && e.target !== el) return;
  const fn = actions[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el); }
});

document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.dataset.act === 'search') {
    S.filters.q = el.value;
    clearTimeout(render.tm);
    render.tm = setTimeout(() => render({ keepScroll: true, keepFocus: true }), 120);
  } else if (el.dataset.act === 'pickSearch') {
    const q = el.value.trim().toLowerCase();
    document.querySelectorAll('.picker .pick').forEach((b) => { b.hidden = q && !b.dataset.name.includes(q); });
    document.querySelectorAll('.picker .pick-group').forEach((g) => { g.hidden = !g.querySelector('.pick:not([hidden])'); });
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && S.sheetKind) closeSheet();
  if (e.key === 'Enter' && e.target.dataset?.act === 'pickSearch') {
    const first = document.querySelector('.picker .pick:not([hidden]):not([disabled])');
    if (first) pickHero(+first.dataset.id);
  }
});

document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset.act === 'bracket') {
    S.bracket = el.value; store.set('bracket', S.bracket);
    ensureMatchups().then(() => render({ keepScroll: true }));
  }
  if (el.dataset.act === 'metaSort') { S.metaSort = el.value; store.set('metaSort', S.metaSort); render({ keepScroll: true }); }
  if (el.dataset.act === 'metaWeight') { S.metaWeight = el.value; store.set('metaWeight', S.metaWeight); render({ keepScroll: true }); }
  if (el.dataset.act === 'minPr') { S.minPr = +el.value; store.set('minPr', S.minPr); render({ keepScroll: true }); }
});

window.addEventListener('hashchange', () => { closeSheet(); handleRouteParams(); render(); });
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); S.installPrompt = e; if (parseRoute().name === 'more') render({ keepScroll: true }); });
window.addEventListener('appinstalled', () => { S.installPrompt = null; });
window.addEventListener('online', () => document.body.classList.remove('is-offline'));
window.addEventListener('offline', () => document.body.classList.add('is-offline'));

function applyStaticText() {
  document.documentElement.lang = lang();
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  if (S.meta) $('#patchBadge').textContent = S.meta.patch ? `${t('patch')} ${S.meta.patch}` : '';
}

async function boot() {
  const nav = $('.nav');
  nav.innerHTML = [['counter', 'navCounter'], ['meta', 'navMeta'], ['heroes', 'navHeroes'], ['more', 'navMore']]
    .map(([r, k]) => `<a href="#/${r}" data-route="${r}">${ICONS[r]}<span data-i18n="${k}">${t(k)}</span></a>`).join('');
  if (!navigator.onLine) document.body.classList.add('is-offline');
  applyStaticText();
  try {
    await loadData();
  } catch (err) {
    console.error(err);
    $('#view').innerHTML = `<section class="card center"><p>${t('loadError')}</p><button class="btn accent" onclick="location.reload()">${t('retry')}</button></section>`;
    return;
  }
  if (!bracketAvailable(S.bracket)) S.bracket = 'pub';
  await ensureMatchups();
  applyStaticText();
  handleRouteParams();
  render();
}

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

boot();
