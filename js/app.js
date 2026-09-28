// UI layer: routing, views and event handling. Data and scoring live in data.js.
import { t, lang, setLang, tagLabel, roleLabel, TAGS, ROLES, ITEM_ADVICE, ITEM_NAMES } from './i18n.js';
import {
  S, store, saveDraft, emptyFilters, BRACKETS, BRACKET_NAMES, ATTRS, META_WEIGHTS,
  esc, pct, signed, img, heroImg, heroIcon, heroCrop, itemImg, attrIcon, attrName, bracketName, compact,
  loadData, ensureMatchups, hasSynergy, muLabel, statOf, bracketAvailable, advantage, synergy, rankAgainst,
  tagCounts, applyFilters, activeFilterCount,
} from './data.js';

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

// Lucide-style stroke icons.
const svg = (d, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  counter: svg('<polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" x2="19" y1="19" y2="13"/><line x1="16" x2="20" y1="16" y2="20"/><line x1="19" x2="21" y1="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" x2="9" y1="14" y2="18"/><line x1="7" x2="4" y1="17" y2="20"/><line x1="3" x2="5" y1="19" y2="21"/>'),
  meta: svg('<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>'),
  heroes: svg('<rect width="7" height="7" x="3" y="3" rx="1.5"/><rect width="7" height="7" x="14" y="3" rx="1.5"/><rect width="7" height="7" x="14" y="14" rx="1.5"/><rect width="7" height="7" x="3" y="14" rx="1.5"/>'),
  more: svg('<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
  sliders: svg('<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>'),
  x: svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
  plus: svg('<path d="M5 12h14"/><path d="M12 5v14"/>'),
  star: svg('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'),
  starFill: svg('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>', 'fill'),
  share: svg('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>'),
  trash: svg('<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>'),
  back: svg('<path d="m15 18-6-6 6-6"/>'),
  up: svg('<path d="m18 15-6-6-6 6"/>'),
  down: svg('<path d="m6 9 6 6 6-6"/>'),
  trendUp: svg('<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>'),
  trendDown: svg('<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>'),
  shield: svg('<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>'),
  users: svg('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
  alert: svg('<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>'),
  check: svg('<path d="M20 6 9 17l-5-5"/>'),
  checkCircle: svg('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'),
  download: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>'),
  ban: svg('<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>'),
  globe: svg('<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>'),
  database: svg('<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>'),
  info: svg('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'),
  target: svg('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),
  smartphone: svg('<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>'),
};

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast.tm);
  toast.tm = setTimeout(() => el.classList.remove('show'), 2200);
}

const heatClass = (a) => (a > 0.005 ? 'pos' : a < -0.005 ? 'neg' : 'neu');
const heatAlpha = (a) => Math.round(Math.min(1, Math.abs(a) / 0.07) * 42);
const tierBadge = (tier, cls = '') => `<span class="tier tier-${tier === '–' ? 'x' : tier} ${cls}">${tier}</span>`;
const attrImg = (a, cls = 'attr-ic') => `<img class="${cls}" src="${attrIcon(a)}" alt="${esc(attrName(a))}" title="${esc(attrName(a))}">`;

function tagList(tags, { max = 99, highlight = [] } = {}) {
  const sorted = [...tags].sort((a, b) => highlight.includes(b) - highlight.includes(a));
  return sorted.slice(0, max).map((x) => `<span class="tag ${highlight.includes(x) ? 'hl' : ''}" style="--c:${TAGS[x]?.color || '#888'}"><i></i>${esc(tagLabel(x))}</span>`).join('') +
    (sorted.length > max ? `<span class="tag more">+${sorted.length - max}</span>` : '');
}

// ---------------------------------------------------------------------------
// Shared controls
// ---------------------------------------------------------------------------
function bracketSelect(id = '') {
  return `<label class="select-wrap" ${id ? `id="${id}"` : ''}><span>${t('bracket')}</span><select class="select" data-act="bracket">
    ${BRACKETS.filter(bracketAvailable).map((b) => `<option value="${b}" ${b === S.bracket ? 'selected' : ''}>${esc(bracketName(b))}</option>`).join('')}
  </select>${I.down}</label>`;
}

function toolbar({ attrSeg = true } = {}) {
  const n = activeFilterCount();
  const active = [
    ...S.filters.tags.map((x) => `<button class="chip on" data-act="toggleTag" data-v="${x}" style="--c:${TAGS[x].color}"><i></i>${esc(tagLabel(x))}${I.x}</button>`),
    ...S.filters.roles.map((x) => `<button class="chip on" data-act="toggleRole" data-v="${x}">${esc(roleLabel(x))}${I.x}</button>`),
    ...(S.filters.attack ? [`<button class="chip on" data-act="setAttack" data-v="">${t(S.filters.attack.toLowerCase())}${I.x}</button>`] : []),
    ...(S.filters.favOnly ? [`<button class="chip on" data-act="favOnly">${I.starFill}${t('favorites')}${I.x}</button>`] : []),
  ];
  return `
    <div class="toolbar">
      <label class="search">${I.search}<input type="search" placeholder="${t('search')}" value="${esc(S.filters.q)}" data-act="search" autocomplete="off" spellcheck="false"></label>
      ${attrSeg ? `<div class="seg attr-seg" role="group" aria-label="${t('attribute')}">${ATTRS.map((a) => `<button class="${S.filters.attrs.includes(a) ? 'on' : ''}" data-act="toggleAttr" data-v="${a}" title="${esc(attrName(a))}">${attrImg(a)}</button>`).join('')}</div>` : ''}
      <button class="btn ${n ? 'primary-soft' : ''}" data-act="openFilters">${I.sliders}<span>${t('filters')}</span>${n ? `<b class="count-badge">${n}</b>` : ''}</button>
    </div>
    <div class="chip-row scroll-x">
      ${['stun', 'root', 'slow', 'silence', 'hex', 'aoeDisable', 'bkbPierce', 'save', 'heal', 'invis', 'illusion', 'mobility']
        .filter((x) => !S.filters.tags.includes(x))
        .map((x) => `<button class="chip" data-act="toggleTag" data-v="${x}" style="--c:${TAGS[x].color}"><i></i>${esc(tagLabel(x))}</button>`).join('')}
    </div>
    ${active.length ? `<div class="chip-row wrap active">${active.join('')}<button class="link-btn" data-act="resetFilters">${t('resetFilters')}</button></div>` : ''}`;
}

// ---------------------------------------------------------------------------
// Modal (hero picker & filters)
// ---------------------------------------------------------------------------
function openModal(html, kind) {
  const modal = $('#modal');
  const panel = $('.modal-panel', modal);
  const keep = S.modalKind === kind ? $('.modal-body', panel)?.scrollTop : 0;
  panel.innerHTML = html;
  panel.dataset.kind = kind;
  S.modalKind = kind;
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('open'));
  if (keep) $('.modal-body', panel).scrollTop = keep;
  document.body.classList.add('noscroll');
}

function closeModal() {
  const modal = $('#modal');
  modal.classList.remove('open');
  S.modalKind = null;
  document.body.classList.remove('noscroll');
  setTimeout(() => { if (!S.modalKind) modal.hidden = true; }, 200);
}

function openFilters() {
  const f = S.filters;
  const group = (title, body) => `<section class="fgroup"><h4>${title}</h4><div class="chip-row wrap">${body}</div></section>`;
  openModal(`
    <header class="modal-head"><h3>${t('filters')}</h3><button class="icon-btn" data-act="closeModal" aria-label="${t('close')}">${I.x}</button></header>
    <div class="modal-body">
      ${group(t('abilities'), Object.keys(TAGS).map((x) => `<button class="chip ${f.tags.includes(x) ? 'on' : ''}" data-act="toggleTag" data-v="${x}" style="--c:${TAGS[x].color}"><i></i>${esc(tagLabel(x))}</button>`).join(''))}
      ${group(t('tagMode'), `<div class="seg text"><button class="${f.tagMode === 'and' ? 'on' : ''}" data-act="tagMode" data-v="and">${t('tagAnd')}</button><button class="${f.tagMode === 'or' ? 'on' : ''}" data-act="tagMode" data-v="or">${t('tagOr')}</button></div>`)}
      ${group(t('attribute'), ATTRS.map((a) => `<button class="chip ${f.attrs.includes(a) ? 'on' : ''}" data-act="toggleAttr" data-v="${a}">${attrImg(a, 'attr-ic sm')}${esc(attrName(a))}</button>`).join(''))}
      ${group(t('attackType'), `<div class="seg text">${['', 'Melee', 'Ranged'].map((a) => `<button class="${f.attack === a ? 'on' : ''}" data-act="setAttack" data-v="${a}">${a ? t(a.toLowerCase()) : t('all')}</button>`).join('')}</div>`)}
      ${group(t('roles'), Object.keys(ROLES).map((r) => `<button class="chip ${f.roles.includes(r) ? 'on' : ''}" data-act="toggleRole" data-v="${r}">${esc(roleLabel(r))}</button>`).join(''))}
      ${group(t('favorites'), `<button class="chip ${f.favOnly ? 'on' : ''}" data-act="favOnly">${I.starFill}${t('favOnly')}</button>`)}
    </div>
    <footer class="modal-foot"><button class="btn ghost" data-act="resetFilters">${t('resetFilters')}</button><button class="btn primary" data-act="closeModal">${t('showResults', { n: applyFilters(S.heroes).length })}</button></footer>
  `, 'filters');
}

function openPicker(team = S.pickTeam || 'enemy') {
  S.pickTeam = team;
  const taken = new Set([...S.enemy, ...S.ally]);
  const q = S.pickQuery || '';
  const groups = ATTRS.map((a) => `
    <section class="pick-group" data-attr="${a}">
      <h4>${attrImg(a, 'attr-ic sm')}${esc(attrName(a))}</h4>
      <div class="pick-grid">${S.heroes.filter((h) => h.attr === a).map((h) => `
        <button class="pick" data-act="pick" data-id="${h.id}" data-name="${esc(h.name.toLowerCase())}" ${taken.has(h.id) ? 'disabled' : ''}>
          <img loading="lazy" src="${heroImg(h)}" alt=""><span>${esc(h.name)}</span>
          ${S.enemy.includes(h.id) ? '<em class="pick-mark dire"></em>' : S.ally.includes(h.id) ? '<em class="pick-mark radiant"></em>' : ''}
        </button>`).join('')}</div>
    </section>`).join('');
  openModal(`
    <header class="modal-head">
      <div class="seg text team-switch">
        <button class="${team === 'enemy' ? 'on dire' : ''}" data-act="pickTeam" data-v="enemy"><i class="team-dot dire"></i>${t('enemyTeam')} <small>${S.enemy.length}/5</small></button>
        <button class="${team === 'ally' ? 'on radiant' : ''}" data-act="pickTeam" data-v="ally"><i class="team-dot radiant"></i>${t('yourTeam')} <small>${S.ally.length}/4</small></button>
      </div>
      <button class="icon-btn" data-act="closeModal" aria-label="${t('close')}">${I.x}</button>
    </header>
    <div class="modal-search"><label class="search">${I.search}<input type="search" placeholder="${t('search')}" value="${esc(q)}" data-act="pickSearch" autocomplete="off" spellcheck="false"></label></div>
    <div class="modal-body picker">${groups}</div>
  `, 'picker');
  filterPicker(q);
  if (!matchMedia('(pointer: coarse)').matches) setTimeout(() => $('[data-act="pickSearch"]')?.focus(), 30);
}

function filterPicker(q) {
  q = q.trim().toLowerCase();
  $$('.picker .pick').forEach((b) => { b.hidden = !!q && !b.dataset.name.includes(q); });
  $$('.picker .pick-group').forEach((g) => { g.hidden = !g.querySelector('.pick:not([hidden])'); });
}

function pickHero(id) {
  const team = S.pickTeam === 'ally' ? S.ally : S.enemy;
  const max = S.pickTeam === 'ally' ? 4 : 5;
  if (team.length < max && !S.enemy.includes(id) && !S.ally.includes(id)) team.push(id);
  saveDraft();
  S.pickQuery = '';
  if (team.length >= max) closeModal(); else openPicker(S.pickTeam);
  render({ keepScroll: true });
}

// ---------------------------------------------------------------------------
// Counter view
// ---------------------------------------------------------------------------
function slotRow(team, max) {
  const ids = team === 'enemy' ? S.enemy : S.ally;
  let html = '';
  for (let i = 0; i < max; i++) {
    const h = S.byId.get(ids[i]);
    html += h
      ? `<div class="slot filled"><a href="#/hero/${h.key}" class="slot-link"><img src="${heroImg(h)}" alt=""><span class="slot-name">${esc(h.name)}</span></a>
          <button class="slot-x" data-act="unpick" data-team="${team}" data-id="${h.id}" aria-label="${t('remove')} ${esc(h.name)}">${I.x}</button></div>`
      : `<button class="slot empty" data-act="openPicker" data-team="${team}" aria-label="${t('addHero')}">${I.plus}</button>`;
  }
  const side = team === 'enemy' ? 'dire' : 'radiant';
  return `
    <div class="team ${side}">
      <div class="team-head"><span class="team-name"><i class="team-dot ${side}"></i>${team === 'enemy' ? t('enemyTeam') : t('yourTeam')}</span><span class="muted">${ids.length}/${max}</span></div>
      <div class="slots" style="--n:${max}">${html}</div>
    </div>`;
}

function draftPanel() {
  const any = S.enemy.length + S.ally.length;
  return `
    <section class="panel draft">
      <header class="panel-head"><h2>${t('draft')}</h2>
        <div class="head-actions">
          <button class="icon-btn" data-act="shareDraft" ${S.enemy.length ? '' : 'disabled'} title="${t('share')}" aria-label="${t('share')}">${I.share}</button>
          <button class="icon-btn" data-act="clearDraft" ${any ? '' : 'disabled'} title="${t('clear')}" aria-label="${t('clear')}">${I.trash}</button>
        </div>
      </header>
      ${slotRow('enemy', 5)}
      ${slotRow('ally', 4)}
    </section>`;
}

function startPanel() {
  const popular = [...S.heroes].sort((a, b) => statOf(b.id).pr - statOf(a.id).pr).slice(0, 18);
  return `
    <section class="panel start">
      <div class="empty-state">
        <div class="empty-icon">${I.target}</div>
        <h2>${t('startTitle')}</h2>
        <p>${t('counterHint')}</p>
        <button class="btn primary lg" data-act="openPicker" data-team="enemy">${I.plus}<span>${t('pickEnemy')}</span></button>
      </div>
      <h3 class="section-label">${t('popularHeroes')} <span>· ${esc(bracketName(S.bracket))}</span></h3>
      <div class="tile-grid">${popular.map((h) => `
        <button class="tile" data-act="quickEnemy" data-id="${h.id}">
          <img loading="lazy" src="${heroImg(h)}" alt="">
          <span class="tile-body"><b>${esc(h.name)}</b><small>${pct(statOf(h.id).pr)} ${t('pickShort')}</small></span>
          <span class="tile-add">${I.plus}</span>
        </button>`).join('')}</div>
    </section>`;
}

function suggestionsPanel(enemies, allies) {
  const ranked = applyFilters(rankAgainst(enemies, [...enemies, ...allies], allies), (r) => r.hero);
  const top = ranked.slice(0, 50);
  const syn = allies.length && hasSynergy() ? allies : [];
  const cols = enemies.length + syn.length;
  const maxScore = Math.max(0.01, ...top.map((r) => Math.abs(r.score)));
  const allyFull = S.ally.length >= 4;
  const head = `
    <div class="mx-row mx-head">
      <span class="c-rank">#</span><span class="c-hero">${t('hero')}</span>
      <span class="mx-cells">
        ${enemies.map((id) => { const e = S.byId.get(id); return `<span class="cell-h" title="${t('vs')} ${esc(e.name)}"><img src="${heroIcon(e)}" alt=""><i class="team-dot dire"></i></span>`; }).join('')}
        ${syn.map((id) => { const a = S.byId.get(id); return `<span class="cell-h" title="${t('with')} ${esc(a.name)}"><img src="${heroIcon(a)}" alt=""><i class="team-dot radiant"></i></span>`; }).join('')}
      </span>
      <span class="c-wr">${t('winRateShort')}</span><span class="c-score">${t('score')}</span><span class="c-act"></span>
    </div>`;
  const rows = top.map((r, i) => {
    const h = r.hero;
    const cell = (p, other, kind) => `<span class="cell ${heatClass(p.adv)} ${kind}" style="--a:${heatAlpha(p.adv)}%" title="${kind === 'syn' ? t('with') : t('vs')} ${esc(other.name)} · ${p.games.toLocaleString()} ${t('games')}"><img src="${heroIcon(other)}" alt="">${signed(p.adv * 100)}${p.games < 30 ? '<sup>*</sup>' : ''}</span>`;
    return `
      <div class="mx-row">
        <span class="c-rank">${i + 1}</span>
        <a class="c-hero" href="#/hero/${h.key}">
          <img class="hero-thumb" loading="lazy" src="${heroImg(h)}" alt="">
          <span class="hero-meta"><b>${esc(h.name)}${S.fav.has(h.id) ? `<em class="fav">${I.starFill}</em>` : ''}</b><small>${h.roles.slice(0, 3).map(roleLabel).join(' · ')}</small></span>
        </a>
        <span class="mx-cells">
          ${r.parts.map((p) => cell(p, S.byId.get(p.id), 'vs')).join('')}
          ${r.syn.map((p) => cell(p, S.byId.get(p.id), 'syn')).join('')}
        </span>
        <span class="c-wr ${r.st.wr >= 0.5 ? 'pos' : 'neg'}">${r.st.picks ? pct(r.st.wr) : '–'}</span>
        <span class="c-score"><b class="${heatClass(r.score)}">${signed(r.score * 100)}</b><i class="scorebar ${heatClass(r.score)}" style="--w:${(Math.abs(r.score) / maxScore) * 100}%"></i></span>
        <span class="c-act"><button class="icon-btn sm" data-act="addAlly" data-id="${h.id}" ${allyFull ? 'disabled' : ''} title="${t('addToAlly')}" aria-label="${t('addToAlly')}">${I.plus}</button></span>
      </div>`;
  }).join('');
  return `
    <section class="panel">
      <header class="panel-head wrap">
        <div><h2>${t('suggestions')}</h2><p class="sub">${t(syn.length ? 'suggestionsSubSyn' : 'suggestionsSub')}</p></div>
        <div class="seg text sm" role="group" aria-label="${t('metaWeight')}" title="${t('metaWeight')}">
          <span class="seg-label">${t('metaWeight')}</span>
          ${Object.keys(META_WEIGHTS).map((k) => `<button class="${S.metaWeight === k ? 'on' : ''}" data-act="setMetaWeight" data-v="${k}">${t(`mw_${k}`)}</button>`).join('')}
        </div>
      </header>
      ${toolbar()}
      <div class="data-note">${I.database}<span>${t('matchupData')}: <b>${esc(muLabel())}</b> · ${t('resultsCount', { n: ranked.length })}</span></div>
      ${top.length ? `<div class="matrix" style="--cols:${cols}">${head}${rows}</div>` : `<p class="empty">${t('noResults')}</p>`}
      <p class="footnote">${t('matchupNote')} <sup>*</sup> ${t('lowSample')}</p>
    </section>`;
}

function threatsPanel(enemies) {
  const c = tagCounts(enemies);
  const keys = Object.keys(ITEM_ADVICE)
    .filter((k) => c[k] && (k !== 'stun' || c[k] >= 2) && (k !== 'slow' || c[k] >= 3) && (k !== 'heal' || c[k] >= 2) && (k !== 'mobility' || c[k] >= 2))
    .sort((a, b) => c[b] - c[a]).slice(0, 6);
  if (!keys.length) return '';
  return `
    <section class="panel">
      <header class="panel-head"><h2>${t('threats')}</h2></header>
      <ul class="advice">${keys.map((k) => {
        const a = ITEM_ADVICE[k];
        const who = enemies.map((id) => S.byId.get(id)).filter((h) => h.tags.includes(k));
        return `<li>
          <div class="advice-top"><span class="tag" style="--c:${TAGS[k]?.color}"><i></i>${esc(tagLabel(k))} ×${c[k]}</span>
            <span class="who">${who.map((h) => `<img src="${heroIcon(h)}" alt="${esc(h.name)}" title="${esc(h.name)}">`).join('')}</span></div>
          <p>${esc(a[lang()])}</p>
          <div class="items">${a.items.map((it) => `<img loading="lazy" src="${itemImg(it)}" alt="${esc(ITEM_NAMES[it])}" title="${esc(ITEM_NAMES[it])}">`).join('')}</div>
        </li>`; }).join('')}</ul>
    </section>`;
}

function teamPanel(allies) {
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
  const keys = ['stun', 'root', 'slow', 'silence', 'hex', 'aoeDisable', 'save', 'heal', 'dispel', 'mobility', 'invis', 'pureDamage'];
  return `
    <section class="panel">
      <header class="panel-head"><h2>${t('teamAnalysis')}</h2></header>
      <div class="coverage">${keys.map((k) => `<span class="cov ${c[k] ? 'have' : 'miss'}">${c[k] ? I.check : I.x}${esc(tagLabel(k))}${c[k] ? `<b>${c[k]}</b>` : ''}</span>`).join('')}</div>
      <div class="split-bar"><i style="flex:${melee || 0.001}" class="melee"></i><i style="flex:${allies.length - melee || 0.001}" class="ranged"></i></div>
      <div class="split-legend"><span><i class="melee"></i>${t('melee')} ${melee}</span><span><i class="ranged"></i>${t('ranged')} ${allies.length - melee}</span>
        <span class="attrs">${ATTRS.map((a) => `<span>${attrImg(a, 'attr-ic xs')}${hs.filter((h) => h.attr === a).length}</span>`).join('')}</span></div>
      <ul class="notes">${(warn.length ? warn : [t('goodComp')]).map((w) => `<li class="${warn.length ? 'warn' : 'ok'}">${warn.length ? I.alert : I.checkCircle}<span>${esc(w)}</span></li>`).join('')}</ul>
    </section>`;
}

function dangerPanel(enemies, allies) {
  const danger = rankAgainst(allies, [...enemies, ...allies]).slice(0, 10);
  return `
    <section class="panel">
      <header class="panel-head"><div><h2>${t('dangerous')}</h2><p class="sub">${t('dangerousSub')}</p></div></header>
      <div class="chip-grid">${danger.map((r) => `
        <a class="hero-pill" href="#/hero/${r.hero.key}"><img loading="lazy" src="${heroIcon(r.hero)}" alt=""><span>${esc(r.hero.name)}</span><b class="${heatClass(r.adv)}">${signed(r.adv * 100)}</b></a>`).join('')}</div>
    </section>`;
}

function viewCounter() {
  const enemies = S.enemy, allies = S.ally;
  const main = enemies.length
    ? suggestionsPanel(enemies, allies) + (allies.length ? dangerPanel(enemies, allies) : '')
    : startPanel();
  return `
    <div class="counter-layout">
      <div class="cl-draft">${draftPanel()}</div>
      <div class="cl-main">${main}</div>
      ${enemies.length ? `<div class="cl-threats">${threatsPanel(enemies)}</div>` : ''}
      ${allies.length ? `<div class="cl-team">${teamPanel(allies)}</div>` : ''}
    </div>`;
}

// The matrix switches to a stacked card layout when its columns don't fit the available width.
const matrixObserver = 'ResizeObserver' in window ? new ResizeObserver((entries) => {
  for (const { target } of entries) {
    const cols = +target.style.getPropertyValue('--cols') || 1;
    target.classList.toggle('stacked', target.clientWidth < 420 + cols * 54);
  }
}) : null;

// ---------------------------------------------------------------------------
// Meta view
// ---------------------------------------------------------------------------
function viewMeta() {
  const b = S.bracket;
  const rows = applyFilters(S.heroes.map((h) => ({ hero: h, st: statOf(h.id) })), (r) => r.hero)
    .filter((r) => S.minPr === 0 || r.st.pr * 100 >= S.minPr);
  const key = {
    tier: (r) => r.st.z, wr: (r) => r.st.wr, pr: (r) => r.st.pr, trend: (r) => r.st.trend || 0,
    games: (r) => r.st.picks, ban: (r) => r.hero.stats.pro[2], name: (r) => r.hero.name,
  }[S.metaSort] || ((r) => r.st.z);
  const dir = S.metaDir;
  rows.sort((a, c) => { const x = key(a), y = key(c); return (typeof x === 'string' ? x.localeCompare(y) : x - y) * dir; });
  const maxPr = Math.max(0.01, ...rows.map((r) => r.st.pr));
  const proMatches = S.totals.pro || 1;
  const th = (k, label, cls = '') => `<th class="${cls} ${S.metaSort === k ? 'sorted' : ''}"><button data-act="sortMeta" data-v="${k}">${label}${S.metaSort === k ? (dir < 0 ? I.down : I.up) : ''}</button></th>`;
  const wrBar = (wr) => {
    const d = Math.max(-1, Math.min(1, (wr - 0.5) / 0.06));
    return `<i class="dbar"><i class="${d >= 0 ? 'pos' : 'neg'}" style="${d >= 0 ? 'left:50%' : 'right:50%'};width:${Math.abs(d) * 50}%"></i></i>`;
  };
  const tabs = BRACKETS.filter(bracketAvailable).map((x) => `<button class="${x === b ? 'on' : ''}" data-act="setBracket" data-v="${x}">${esc(bracketName(x))}</button>`).join('');
  return `
    <section class="panel">
      <div class="tabs scroll-x" role="tablist">${tabs}</div>
      <div class="meta-summary">
        <div><span>${t('matchesAnalyzed')}</span><b>${compact(S.totals[b] || 0)}</b></div>
        <div><span>${t('heroCountLabel')}</span><b>${rows.length}</b></div>
        <div><span>${t('patch')}</span><b>${esc(S.meta.patch || '–')}</b></div>
        <label class="select-wrap"><span>${t('minPr')}</span><select class="select" data-act="minPr">${[0, 0.5, 1, 2, 5].map((v) => `<option value="${v}" ${S.minPr === v ? 'selected' : ''}>${v}%</option>`).join('')}</select>${I.down}</label>
      </div>
      ${toolbar()}
      <div class="table-wrap">
        <table class="meta-table">
          <thead><tr>
            ${th('tier', t('tier'), 'c-tier')}${th('name', t('hero'), 'c-name')}${th('wr', t('winRate'))}${th('pr', t('pickRate'))}
            ${b === 'pro' ? th('ban', t('bans'), 'hide-sm') : th('trend', t('trend7'), 'hide-sm')}${th('games', t('matches'), 'hide-md')}
          </tr></thead>
          <tbody>${rows.map((r) => `
            <tr data-act="go" data-href="#/hero/${r.hero.key}">
              <td class="c-tier">${tierBadge(r.st.tier)}</td>
              <td class="c-name"><a href="#/hero/${r.hero.key}"><img loading="lazy" src="${heroImg(r.hero)}" alt=""><span><b>${esc(r.hero.name)}</b><small>${attrImg(r.hero.attr, 'attr-ic xs')}${r.hero.roles.slice(0, 2).map(roleLabel).join(' · ')}</small></span></a></td>
              <td><div class="num-bar"><b class="${r.st.wr >= 0.5 ? 'pos' : 'neg'}">${r.st.picks ? pct(r.st.wr) : '–'}</b>${wrBar(r.st.wr)}</div></td>
              <td><div class="num-bar"><b>${pct(r.st.pr)}</b><i class="pbar"><i style="width:${(r.st.pr / maxPr) * 100}%"></i></i></div></td>
              <td class="hide-sm">${b === 'pro' ? `<b>${pct(r.hero.stats.pro[2] / proMatches)}</b>` : `<span class="trend ${r.st.trend >= 0 ? 'pos' : 'neg'}">${r.st.trend >= 0 ? I.trendUp : I.trendDown}${signed((r.st.trend || 0) * 100)}</span>`}</td>
              <td class="hide-md muted">${compact(r.st.picks)}</td>
            </tr>`).join('')}</tbody>
        </table>
        ${rows.length ? '' : `<p class="empty">${t('noResults')}</p>`}
      </div>
      <p class="footnote">${t('tierNote')}</p>
    </section>`;
}

// ---------------------------------------------------------------------------
// Heroes view
// ---------------------------------------------------------------------------
function portrait(h) {
  const st = statOf(h.id);
  return `<a class="portrait" href="#/hero/${h.key}">
    <img loading="lazy" src="${heroImg(h)}" alt="">
    ${tierBadge(st.tier, 'corner')}
    ${S.fav.has(h.id) ? `<em class="fav">${I.starFill}</em>` : ''}
    <span class="p-foot"><b>${esc(h.name)}</b><small>${st.picks ? pct(st.wr) : '–'}</small></span>
  </a>`;
}

function viewHeroes() {
  const list = applyFilters(S.heroes);
  const groups = S.filters.attrs.length ? S.filters.attrs : ATTRS;
  const sections = groups.map((a) => {
    const hs = list.filter((h) => h.attr === a);
    if (!hs.length) return '';
    return `<section class="attr-section"><h3>${attrImg(a)}${esc(attrName(a))}<span>${hs.length}</span></h3><div class="portrait-grid">${hs.map(portrait).join('')}</div></section>`;
  }).join('');
  return `
    <section class="panel">
      ${toolbar()}
      <div class="data-note">${I.info}<span>${t('heroCount', { n: list.length })} · ${t('winRate')}: ${esc(bracketName(S.bracket))}</span></div>
      ${sections || `<p class="empty">${t('noResults')}</p>`}
    </section>`;
}

// ---------------------------------------------------------------------------
// Hero detail
// ---------------------------------------------------------------------------
function sparkline(values, cls) {
  if (values.length < 2) return '';
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * 100, 36 - ((v - min) / span) * 30 - 3]);
  const line = pts.map((p) => p.join(',')).join(' ');
  return `<svg class="spark ${cls}" viewBox="0 0 100 40" preserveAspectRatio="none">
    <polygon points="0,40 ${line} 100,40" class="area"/><polyline points="${line}" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`;
}

function matchList(title, rows, invert = false) {
  return `<section class="panel">
    <header class="panel-head"><h2>${title}</h2></header>
    <ol class="rank-list">${rows.map((r, i) => { const v = invert ? -r.adv : r.adv; return `
      <li><span class="muted">${i + 1}</span><a href="#/hero/${r.hero.key}"><img loading="lazy" src="${heroImg(r.hero)}" alt=""><b>${esc(r.hero.name)}</b></a>
        <span class="rl-val"><b class="${heatClass(v)}">${signed(v * 100)}%</b><small>${compact(r.games)} ${t('games')}</small></span></li>`; }).join('')}</ol>
  </section>`;
}

function viewHero(key) {
  const h = S.byKey.get(key);
  if (!h) return `<section class="panel"><p class="empty">404</p></section>`;
  const st = statOf(h.id);
  const others = S.heroes.filter((o) => o.id !== h.id);
  const vs = others.map((o) => ({ hero: o, ...advantage(o.id, h.id) }));
  const counters = [...vs].sort((a, b) => b.adv - a.adv).slice(0, 8);
  const goodVs = [...vs].sort((a, b) => a.adv - b.adv).slice(0, 8);
  const mates = hasSynergy() ? others.map((o) => ({ hero: o, ...synergy(h.id, o.id) })).sort((a, b) => b.adv - a.adv).slice(0, 8) : [];
  const [pt, wt] = h.stats.pubTrend;
  const wrTrend = pt.map((p, i) => (p ? wt[i] / p : 0));
  const brs = ['1', '2', '3', '4', '5', '6', '7', '8'].filter(bracketAvailable);
  const inEnemy = S.enemy.includes(h.id), inAlly = S.ally.includes(h.id);
  const base = h.base;
  const fav = S.fav.has(h.id);

  return `
    <section class="hero-banner attr-${h.attr}">
      <img class="hb-crop" src="${heroCrop(h)}" alt="" onerror="this.src='${heroImg(h)}'">
      <div class="hb-content">
        <button class="back-link" data-act="back">${I.back}${t('back')}</button>
        <div class="hb-attr">${attrImg(h.attr, 'attr-ic sm')}${esc(attrName(h.attr))} · ${t(h.attack.toLowerCase())}</div>
        <h1>${esc(h.name)}</h1>
        <div class="hb-roles">${h.roles.map((r) => `<span>${esc(roleLabel(r))}</span>`).join('')}</div>
        <div class="hb-actions">
          <button class="btn primary" data-act="counterThis" data-id="${h.id}" ${inEnemy || inAlly || S.enemy.length >= 5 ? 'disabled' : ''}>${I.counter}<span>${inEnemy ? t('picked') : t('counterThis')}</span></button>
          <button class="btn" data-act="addAlly" data-id="${h.id}" ${inEnemy || inAlly || S.ally.length >= 4 ? 'disabled' : ''}>${I.users}<span>${inAlly ? t('inTeam') : t('addToAlly')}</span></button>
          <button class="icon-btn ${fav ? 'on' : ''}" data-act="fav" data-id="${h.id}" title="${fav ? t('unfavorite') : t('favorite')}" aria-label="${fav ? t('unfavorite') : t('favorite')}">${fav ? I.starFill : I.star}</button>
          <button class="icon-btn" data-act="shareHero" data-key="${h.key}" title="${t('share')}" aria-label="${t('share')}">${I.share}</button>
        </div>
      </div>
    </section>

    <div class="stat-tiles">
      <div class="stat"><span>${t('tier')}</span>${tierBadge(st.tier, 'lg')}</div>
      <div class="stat"><span>${t('winRate')}</span><b class="${st.wr >= 0.5 ? 'pos' : 'neg'}">${st.picks ? pct(st.wr) : '–'}</b></div>
      <div class="stat"><span>${t('pickRate')}</span><b>${pct(st.pr)}</b></div>
      <div class="stat"><span>${t('matches')}</span><b>${compact(st.picks)}</b></div>
      <div class="stat"><span>Pro</span><b>${h.stats.pro[0]}<small> P</small> · ${h.stats.pro[2]}<small> B</small></b></div>
      <p class="stat-note">${esc(bracketName(S.bracket))} · ${t('patch')} ${esc(S.meta.patch || '')}</p>
    </div>

    <div class="grid-2">
      <section class="panel">
        <header class="panel-head"><h2>${t('byBracket')}</h2></header>
        <div class="col-chart" style="--base:${((0.5 - 0.44) / 0.12) * 100}%">${brs.map((b) => { const s = statOf(h.id, b); const hgt = Math.max(3, Math.min(100, ((s.wr - 0.44) / 0.12) * 100)); return `
          <div class="cc ${b === S.bracket ? 'cur' : ''}" title="${BRACKET_NAMES[b]} · ${pct(s.wr)} · ${pct(s.pr)} ${t('pickShort')}">
            <b class="${s.wr >= 0.5 ? 'pos' : 'neg'}">${(s.wr * 100).toFixed(1)}</b>
            <span class="cc-track"><i style="height:${hgt}%" class="${s.wr >= 0.5 ? 'pos' : 'neg'}"></i></span>
            <span class="cc-name">${BRACKET_NAMES[b].slice(0, 3)}</span>
          </div>`; }).join('')}
        </div>
        <p class="footnote">${t('chartNote')}</p>
      </section>
      <section class="panel">
        <header class="panel-head"><h2>${t('last7')}</h2></header>
        ${pt.length ? `
          <div class="trend-block"><div class="tb-head"><span>${t('winRate')}</span><b class="${wrTrend.at(-1) >= 0.5 ? 'pos' : 'neg'}">${pct(wrTrend.at(-1) || 0)}</b></div>${sparkline(wrTrend, 'wr')}</div>
          <div class="trend-block"><div class="tb-head"><span>${t('picks')}</span><b>${pt.at(-1).toLocaleString()}</b></div>${sparkline(pt, 'pr')}</div>` : `<p class="empty">–</p>`}
      </section>
    </div>

    ${S.mu ? `<div class="grid-3">
      ${matchList(t('counteredBy'), counters)}
      ${matchList(t('goodAgainst'), goodVs, true)}
      ${mates.length ? matchList(t('bestTeammates'), mates) : ''}
    </div>
    <p class="footnote">${I.database} ${t('matchupData')}: ${esc(muLabel())}. ${t('matchupNote')}</p>` : ''}

    <section class="panel">
      <header class="panel-head"><h2>${t('abilitiesTitle')}</h2><div class="tag-row">${h.tags.map((x) => `<button class="tag as-btn" data-act="filterTag" data-v="${x}" style="--c:${TAGS[x]?.color}"><i></i>${esc(tagLabel(x))}</button>`).join('')}</div></header>
      <div class="abilities">${h.abilities.filter((a) => a.desc).map((a) => `
        <article class="ability">
          <img loading="lazy" src="${img(a.img)}" alt="" onerror="this.style.visibility='hidden'">
          <div>
            <h3>${esc(a.name)}</h3>
            ${a.tags.length ? `<div class="tag-row">${tagList(a.tags)}</div>` : ''}
            <p>${esc(a.desc)}</p>
            <div class="ab-meta">${a.dmgType ? `<span>${esc(a.dmgType)}</span>` : ''}${a.bkb ? `<span>BKB: ${esc(a.bkb)}</span>` : ''}${a.cd ? `<span>CD ${esc([].concat(a.cd).join(' / '))}</span>` : ''}${a.mc ? `<span>Mana ${esc([].concat(a.mc).join(' / '))}</span>` : ''}</div>
          </div>
        </article>`).join('')}</div>
    </section>

    <div class="grid-2">
      ${h.aghs && (h.aghs.scepter || h.aghs.shard) ? `<section class="panel"><header class="panel-head"><h2>Aghanim's</h2></header>
        <div class="aghs">${h.aghs.scepter ? `<div><img src="${itemImg('ultimate_scepter')}" alt=""><p><b>Scepter</b>${esc(h.aghs.scepter)}</p></div>` : ''}${h.aghs.shard ? `<div><img src="${itemImg('aghanims_shard')}" alt=""><p><b>Shard</b>${esc(h.aghs.shard)}</p></div>` : ''}</div></section>` : ''}
      <section class="panel"><header class="panel-head"><h2>${t('baseStats')}</h2></header>
        <dl class="base-grid">
          <div>${attrImg('str', 'attr-ic xs')}<dt>${t('str')}</dt><dd>${base.str} <small>+${base.strGain}</small></dd></div>
          <div>${attrImg('agi', 'attr-ic xs')}<dt>${t('agi')}</dt><dd>${base.agi} <small>+${base.agiGain}</small></dd></div>
          <div>${attrImg('int', 'attr-ic xs')}<dt>${t('int')}</dt><dd>${base.int} <small>+${base.intGain}</small></dd></div>
          <div><dt>${t('damage')}</dt><dd>${base.dmgMin}–${base.dmgMax}</dd></div>
          <div><dt>${t('attackRange')}</dt><dd>${base.range}</dd></div>
          <div><dt>${t('moveSpeed')}</dt><dd>${base.ms}</dd></div>
          <div><dt>${t('armor')}</dt><dd>${base.armor}</dd></div>
          <div><dt>BAT</dt><dd>${base.bat}</dd></div>
          <div><dt>${t('magicRes')}</dt><dd>${base.mr}%</dd></div>
        </dl>
      </section>
    </div>`;
}

// ---------------------------------------------------------------------------
// Settings view
// ---------------------------------------------------------------------------
function viewMore() {
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const updated = S.meta?.updated ? new Date(S.meta.updated).toLocaleString(lang() === 'tr' ? 'tr-TR' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '–';
  return `
    <div class="settings">
      <section class="panel">
        <header class="panel-head"><h2>${t('preferences')}</h2></header>
        <div class="setting"><div>${I.globe}<span>${t('language')}</span></div>
          <div class="seg text"><button class="${lang() === 'tr' ? 'on' : ''}" data-act="lang" data-v="tr">Türkçe</button><button class="${lang() === 'en' ? 'on' : ''}" data-act="lang" data-v="en">English</button></div></div>
        <div class="setting"><div>${I.meta}<span>${t('bracket')}</span></div>${bracketSelect()}</div>
      </section>
      <section class="panel">
        <header class="panel-head"><h2>${t('install')}</h2>${standalone ? `<span class="pill ok">${I.check}${t('installed')}</span>` : ''}</header>
        ${!standalone && S.installPrompt ? `<button class="btn primary block" data-act="install">${I.download}<span>${t('installNow')}</span></button>` : ''}
        <ol class="steps">
          <li>${I.smartphone}<div><b>iPhone / iPad</b><p>${t('installIos')}</p></div></li>
          <li>${I.smartphone}<div><b>Android</b><p>${t('installAndroid')}</p></div></li>
          <li>${I.download}<div><b>${t('desktop')}</b><p>${t('installDesktop')}</p></div></li>
        </ol>
      </section>
      <section class="panel">
        <header class="panel-head"><h2>${t('dataInfo')}</h2></header>
        <dl class="info">
          <div><dt>${t('patch')}</dt><dd>${esc(S.meta?.patch || '–')}</dd></div>
          <div><dt>${t('updated')}</dt><dd>${esc(updated)}</dd></div>
          <div><dt>Heroes</dt><dd>${S.heroes.length}</dd></div>
          <div><dt>${t('dataSource')}</dt><dd><a href="https://www.opendota.com" target="_blank" rel="noopener">OpenDota</a>${S.meta?.matchupSource === 'stratz' ? ` · <a href="https://stratz.com" target="_blank" rel="noopener">STRATZ</a>` : ''}</dd></div>
        </dl>
        <p class="footnote">${t('dataNote')}</p>
        <button class="btn ghost danger block" data-act="resetAll">${I.trash}<span>${t('resetAll')}</span></button>
      </section>
      <p class="legal">Dota 2 is a registered trademark of Valve Corporation. This app is not affiliated with Valve.</p>
    </div>`;
}

// ---------------------------------------------------------------------------
// Router & rendering
// ---------------------------------------------------------------------------
const ROUTES = {
  counter: { icon: 'counter', label: 'navCounter', title: 'pageCounter', sub: 'pageCounterSub', view: viewCounter },
  meta: { icon: 'meta', label: 'navMeta', title: 'pageMeta', sub: 'pageMetaSub', view: viewMeta },
  heroes: { icon: 'heroes', label: 'navHeroes', title: 'pageHeroes', sub: 'pageHeroesSub', view: viewHeroes },
  more: { icon: 'more', label: 'navMore', title: 'pageMore', sub: 'pageMoreSub', view: viewMore },
};

function parseRoute() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [path, query] = hash.split('?');
  const parts = path.split('/').filter(Boolean);
  return { name: parts[0] || 'counter', arg: parts[1], params: new URLSearchParams(query || '') };
}

function renderNav() {
  const items = Object.entries(ROUTES).map(([r, def]) => `<a href="#/${r}" data-route="${r}">${I[def.icon]}<span>${t(def.label)}</span></a>`).join('');
  $('#sideNav').innerHTML = items;
  $('#tabbar').innerHTML = items;
  $('#sideFoot').innerHTML = S.meta ? `
    <div class="side-meta"><span class="pill">${t('patch')} ${esc(S.meta.patch || '–')}</span></div>
    ${bracketSelect()}
    <p class="side-src">${I.database}${S.meta.matchupSource === 'stratz' ? 'OpenDota + STRATZ' : 'OpenDota'}</p>` : '';
}

function render({ keepScroll = false, keepFocus = false } = {}) {
  const r = parseRoute();
  const route = ROUTES[r.name] || ROUTES.counter;
  const navKey = r.name === 'hero' ? 'heroes' : (ROUTES[r.name] ? r.name : 'counter');
  const view = $('#view');
  const focused = keepFocus && document.activeElement?.dataset?.act === 'search' ? document.activeElement : null;
  const caret = focused ? focused.selectionStart : 0;
  const y = window.scrollY;

  const hero = r.name === 'hero' ? S.byKey.get(r.arg) : null;
  $('#pageTitle').textContent = hero ? hero.name : t(route.title);
  $('#pageSub').textContent = hero ? `${attrName(hero.attr)} · ${hero.roles.slice(0, 3).map(roleLabel).join(', ')}` : t(route.sub);
  $('#topBracket').innerHTML = bracketSelect();
  document.title = `${hero ? hero.name : t(route.title)} · ${t('appName')}`;
  document.body.dataset.route = navKey;

  view.innerHTML = r.name === 'hero' ? viewHero(r.arg) : route.view();
  view.classList.remove('enter'); void view.offsetWidth; if (!keepScroll) view.classList.add('enter');
  $$('[data-route]').forEach((a) => a.classList.toggle('on', a.dataset.route === navKey));
  $$('#sideFoot [data-act="bracket"]').forEach((s) => { s.value = S.bracket; });
  const mx = $('.matrix', view);
  if (mx) { matrixObserver?.disconnect(); matrixObserver?.observe(mx); if (!matrixObserver) mx.classList.add('stacked'); }
  if (focused) { const el = $('[data-act="search"]', view); if (el) { el.focus(); el.setSelectionRange(caret, caret); } }
  window.scrollTo(0, keepScroll ? y : 0);
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

async function changeBracket(b) {
  if (!bracketAvailable(b)) return;
  S.bracket = b;
  store.set('bracket', b);
  await ensureMatchups();
  renderNav();
  render({ keepScroll: true });
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
function toggleIn(arr, v) { const i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); }

function filtersChanged() {
  store.set('filters', S.filters);
  if (S.modalKind === 'filters') openFilters();
  render({ keepScroll: true, keepFocus: true });
}

const actions = {
  openPicker: (el) => { S.pickQuery = ''; openPicker(el.dataset.team); },
  pickTeam: (el) => { S.pickQuery = $('[data-act="pickSearch"]')?.value || ''; openPicker(el.dataset.v); },
  pick: (el) => pickHero(+el.dataset.id),
  unpick: (el) => {
    const id = +el.dataset.id;
    if (el.dataset.team === 'ally') S.ally = S.ally.filter((x) => x !== id); else S.enemy = S.enemy.filter((x) => x !== id);
    saveDraft(); render({ keepScroll: true });
  },
  quickEnemy: (el) => { const id = +el.dataset.id; if (!S.enemy.includes(id) && S.enemy.length < 5) S.enemy.push(id); saveDraft(); render({ keepScroll: true }); },
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
  closeModal: () => closeModal(),
  toggleTag: (el) => { toggleIn(S.filters.tags, el.dataset.v); filtersChanged(); },
  toggleRole: (el) => { toggleIn(S.filters.roles, el.dataset.v); filtersChanged(); },
  toggleAttr: (el) => { toggleIn(S.filters.attrs, el.dataset.v); filtersChanged(); },
  setAttack: (el) => { S.filters.attack = el.dataset.v; filtersChanged(); },
  tagMode: (el) => { S.filters.tagMode = el.dataset.v; filtersChanged(); },
  favOnly: () => { S.filters.favOnly = !S.filters.favOnly; filtersChanged(); },
  resetFilters: () => { S.filters = emptyFilters(); filtersChanged(); },
  filterTag: (el) => { S.filters = emptyFilters(); S.filters.tags = [el.dataset.v]; store.set('filters', S.filters); location.hash = '#/heroes'; },
  setBracket: (el) => changeBracket(el.dataset.v),
  setMetaWeight: (el) => { S.metaWeight = el.dataset.v; store.set('metaWeight', S.metaWeight); render({ keepScroll: true }); },
  sortMeta: (el) => {
    const k = el.dataset.v;
    S.metaDir = S.metaSort === k ? -S.metaDir : (k === 'name' ? 1 : -1);
    S.metaSort = k;
    store.set('metaSort', k); store.set('metaDir', S.metaDir);
    render({ keepScroll: true });
  },
  go: (el, e) => { if (!e.target.closest('a')) location.hash = el.dataset.href; },
  back: () => { if (history.length > 1) history.back(); else location.hash = '#/heroes'; },
  lang: (el) => { setLang(el.dataset.v); renderNav(); render({ keepScroll: true }); },
  install: async () => { if (!S.installPrompt) return; S.installPrompt.prompt(); await S.installPrompt.userChoice; S.installPrompt = null; render({ keepScroll: true }); },
  resetAll: () => {
    if (!confirm(t('resetConfirm'))) return;
    S.enemy = []; S.ally = []; S.fav.clear(); S.filters = emptyFilters();
    ['enemy', 'ally', 'fav'].forEach((k) => store.set(k, []));
    store.set('filters', S.filters);
    render();
  },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'LABEL') return;
  if (el.id === 'modal' && e.target !== el) return;
  const fn = actions[el.dataset.act];
  if (fn) { if (el.dataset.act !== 'go') e.preventDefault(); fn(el, e); }
});

document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.dataset.act === 'search') {
    S.filters.q = el.value;
    clearTimeout(render.tm);
    render.tm = setTimeout(() => render({ keepScroll: true, keepFocus: true }), 120);
  } else if (el.dataset.act === 'pickSearch') {
    S.pickQuery = el.value;
    filterPicker(el.value);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && S.modalKind) closeModal();
  if (e.key === 'Enter' && e.target.dataset?.act === 'pickSearch') {
    const first = $('.picker .pick:not([hidden]):not([disabled])');
    if (first) pickHero(+first.dataset.id);
  }
  // "/" focuses search, like most data tools.
  if (e.key === '/' && !S.modalKind && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) {
    const s = $('[data-act="search"]');
    if (s) { e.preventDefault(); s.focus(); }
  }
});

document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset.act === 'bracket') changeBracket(el.value);
  if (el.dataset.act === 'minPr') { S.minPr = +el.value; store.set('minPr', S.minPr); render({ keepScroll: true }); }
});

window.addEventListener('hashchange', () => { closeModal(); handleRouteParams(); render(); });
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); S.installPrompt = e; if (parseRoute().name === 'more') render({ keepScroll: true }); });
window.addEventListener('appinstalled', () => { S.installPrompt = null; });
window.addEventListener('online', () => document.body.classList.remove('is-offline'));
window.addEventListener('offline', () => document.body.classList.add('is-offline'));
window.addEventListener('scroll', () => document.body.classList.toggle('scrolled', window.scrollY > 4), { passive: true });

async function boot() {
  document.documentElement.lang = lang();
  if (!navigator.onLine) document.body.classList.add('is-offline');
  $('#offlineText').textContent = t('offline');
  renderNav();
  try {
    await loadData();
  } catch (err) {
    console.error(err);
    $('#view').innerHTML = `<section class="panel"><div class="empty-state"><div class="empty-icon">${I.alert}</div><h2>${t('loadError')}</h2><button class="btn primary" onclick="location.reload()">${t('retry')}</button></div></section>`;
    return;
  }
  handleRouteParams();
  renderNav();
  render();
  document.body.classList.add('ready');
}

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

boot();
