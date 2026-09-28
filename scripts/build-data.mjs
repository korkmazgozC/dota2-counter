#!/usr/bin/env node
// Builds the static data files used by the app from the public OpenDota API.
// Usage: node scripts/build-data.mjs [--skip-matchups]
// Runs daily from .github/workflows/update-data.yml so the app always shows the current patch.

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data');
const API = 'https://api.opendota.com/api';
const SKIP_MATCHUPS = process.argv.includes('--skip-matchups');
const API_KEY = process.env.OPENDOTA_API_KEY ? `?api_key=${process.env.OPENDOTA_API_KEY}` : '';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(endpoint, tries = 5) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(`${API}${endpoint}${API_KEY}`);
      if (res.status === 429) { await sleep(5000 * (i + 1)); continue; }
      if (!res.ok) throw new Error(`${res.status} ${endpoint}`);
      return await res.json();
    } catch (err) {
      if (i === tries - 1) throw err;
      await sleep(2000 * (i + 1));
    }
  }
  throw new Error(`Failed: ${endpoint}`);
}

// ---------------------------------------------------------------------------
// Ability tagging. Keyword heuristics over the ability description + attribute keys,
// corrected by data/overrides.json for known edge cases.
// ---------------------------------------------------------------------------
const TAG_RULES = {
  stun: { text: /\bstun|\bstuns\b|\bstunned\b|\bstunning\b/i, keys: /stun/i },
  root: { text: /\broot|ensnare|entangle|immobiliz|prohibiting movement|cannot move|unable to move|pinned/i, keys: /root|ensnare|entangle/i },
  slow: { text: /\bslow/i, keys: /slow|movespeed_(reduction|pct)|move_slow/i },
  silence: { text: /silenc/i, keys: /silence/i },
  hex: { text: /\bhex|into a (harmless )?(beast|critter|frog|chicken|sheep|pig)|transforms? an enemy/i, keys: /hex/i },
  disarm: { text: /disarm/i, keys: /disarm/i },
  taunt: { text: /taunt|forc(es|ing|ed) (them|enemies|enemy|the target|units?) to attack|\bfear|terrif|hypnot|forced to (walk|move|attack)|charm/i, keys: /taunt|fear/i },
  displace: { text: /\bpull|\bdrag|knock(s|ed)? back|push(es|ed)? (the )?(target|enemies|units)|hook|toss|swap|hurl|launch(es)? (an|the) enemy|forcing .*to move/i, keys: /knockback|pull|push_/i },
  breakPassive: { text: /\bbreak\b|passives? (are )?disabled|disables passive/i, keys: /^break/i },
  dispel: { text: /dispel|purge|removes? (most )?(negative|positive) (buffs|debuffs)|removes debuffs/i, keys: /dispel|purge/i },
  invis: { text: /invisib|\binvis\b|fades? (away )?into|becomes? hidden|smoke/i, keys: /invis|fade/i },
  mobility: { text: /\bblink|teleport|\bleap|\bjump|\bdash|\bcharges? (toward|at|forward)|rushes|surges? forward|moves? .*quickly|flies|flight|burrow|travels? to|rolls? forward|bonus movement speed|increased movement speed/i, keys: /blink|leap|jump|dash|teleport|bonus_movement_speed|movespeed_bonus|bonus_movespeed|speed_bonus/i },
  heal: { text: /\bheal|restores? .*health|regenerat|lifesteal|restores hp/i, keys: /heal|lifesteal|regen/i },
  save: { text: /invulnerab|banish|disjoint|out of the (fight|world)|spell immun|debuff immun|magic immun|shield|barrier|absorbs? damage|cannot die|prevents? death|untargetable|relocat|returns? (an|the) ally/i, keys: /barrier|shield|absorb/i },
  illusion: { text: /illusion|replicat|clone/i, keys: /illusion/i },
  summon: { text: /summon|spawns?|creates? .*(unit|golem|spirit|wolf|wolves|beetle|spiderling|treant|eidolon|serpent|ward|tower|tombstone|zombie|imp|familiar)/i, keys: /spawn|summon/i },
  armorReduction: { text: /reduc\w* .*armor|armor (reduction|corruption)|minus armor|lowers? .*armor|negative armor/i, keys: /armor_reduction|minus_armor|armor_corruption|negative_armor|armor_reduc/i },
  manaBurn: { text: /mana ?burn|burns? .*mana|drains? .*mana|removes? .*mana|mana (loss|break|void)/i, keys: /mana_burn|mana_break|mana_drain|mana_per_hit/i },
  global: { text: /\bglobal|anywhere on the map|all enemy heroes|every enemy hero|entire map/i, keys: /global/i },
  pureDamage: { dmgType: 'Pure' },
  aoeDisable: { derived: true },
  bkbPierce: { derived: true },
};

const DISABLE_TAGS = ['stun', 'root', 'hex', 'silence', 'taunt', 'disarm', 'displace'];

function abilityText(a) {
  const parts = [a.desc || '', a.dname || ''];
  // Attribute headers often say "STUN DURATION:" or "SLOW:" etc.
  for (const at of a.attrib || []) parts.push(at.header || '');
  return parts.join(' \n ');
}

function attribKeys(a) {
  return (a.attrib || [])
    .filter((at) => {
      const v = Array.isArray(at.value) ? at.value : [at.value];
      // Ignore attributes whose value is always zero (disabled by default / talent-only).
      return v.some((x) => x !== undefined && x !== null && String(x).replace(/[-%s]/g, '') !== '0');
    })
    .map((at) => at.key || '')
    .join(' ');
}

function tagAbility(a) {
  const tags = new Set();
  const text = abilityText(a);
  const keys = attribKeys(a);
  for (const [tag, rule] of Object.entries(TAG_RULES)) {
    if (rule.derived) continue;
    if (rule.dmgType) { if (a.dmg_type === rule.dmgType) tags.add(tag); continue; }
    if ((rule.text && rule.text.test(text)) || (rule.keys && rule.keys.test(keys))) tags.add(tag);
  }
  // "Stun" inside a "slow" description such as "mini-stun" still counts as a stun; but
  // texts like "cannot be stunned" are protective, not disabling.
  if (/(cannot|can't|immune to|unable to) be stun/i.test(a.desc || '') && !/stuns?\s(enemies|the target|units|an enemy)/i.test(a.desc || '')) tags.delete('stun');
  // Slow-type text on self buffs (e.g. "slows the caster") is rare; attack-speed-only slows still count as slow.
  const behavior = [].concat(a.behavior || []);
  const isAoe = behavior.includes('AOE') || /radius|area|nearby|around|all enemies|in a line|path/i.test(text);
  if (isAoe && DISABLE_TAGS.some((t) => tags.has(t) && t !== 'silence' && t !== 'disarm')) tags.add('aoeDisable');
  if (a.bkbpierce === 'Yes' && DISABLE_TAGS.some((t) => tags.has(t))) tags.add('bkbPierce');
  return [...tags];
}

function toNum(v) {
  const x = Array.isArray(v) ? v[v.length - 1] : v;
  const n = parseFloat(String(x ?? '').replace('%', ''));
  return Number.isFinite(n) ? n : null;
}

// ---------------------------------------------------------------------------

async function main() {
  await mkdir(OUT, { recursive: true });
  console.log('Fetching hero stats, abilities and patch info…');
  const [heroStats, abilities, heroAbilities, patches, aghs] = await Promise.all([
    get('/heroStats'),
    get('/constants/abilities'),
    get('/constants/hero_abilities'),
    get('/constants/patch'),
    get('/constants/aghs_desc').catch(() => []),
  ]);

  const overridesPath = path.join(OUT, 'overrides.json');
  const overrides = existsSync(overridesPath) ? JSON.parse(await readFile(overridesPath, 'utf8')) : {};

  const patch = patches[patches.length - 1];
  const aghsByHero = new Map((aghs || []).map((x) => [x.hero_id, x]));

  const heroes = heroStats.map((h) => {
    const key = h.name.replace('npc_dota_hero_', '');
    const ha = heroAbilities[h.name] || { abilities: [] };
    const curated = typeof overrides.heroes?.[key] === 'string'
      ? new Set(overrides.heroes[key].split(/\s+/).filter(Boolean))
      : null;
    if (!curated) console.warn(`  ! No curated tags for ${key}; using auto-detected tags.`);
    const abilityList = [];
    for (const abKey of (ha.abilities || []).flat()) {
      if (!abKey || abKey.startsWith('generic_hidden')) continue;
      const a = abilities[abKey];
      if (!a || !a.dname) continue;
      const ov = overrides.abilities?.[abKey] || {};
      let tags = tagAbility(a);
      // Keyword detection is noisy: only keep tags the curated hero list confirms.
      if (curated) tags = tags.filter((t) => curated.has(t));
      if (ov.add) tags = [...new Set([...tags, ...ov.add])];
      if (ov.remove) tags = tags.filter((t) => !ov.remove.includes(t));
      abilityList.push({
        key: abKey,
        name: a.dname,
        desc: a.desc || '',
        img: a.img || `/apps/dota2/images/dota_react/abilities/${abKey}.png`,
        dmgType: a.dmg_type || null,
        bkb: a.bkbpierce || null,
        dispellable: a.dispellable || null,
        behavior: [].concat(a.behavior || []),
        cd: a.cd ?? null,
        mc: a.mc ?? null,
        tags,
      });
    }
    const heroTags = curated || new Set(abilityList.flatMap((a) => a.tags));

    const brackets = {};
    for (let b = 1; b <= 8; b++) brackets[b] = [h[`${b}_pick`] || 0, h[`${b}_win`] || 0];
    const ag = aghsByHero.get(h.id);

    return {
      id: h.id,
      key,
      name: h.localized_name,
      attr: h.primary_attr,
      attack: h.attack_type,
      roles: h.roles || [],
      img: h.img,
      icon: h.icon,
      tags: [...heroTags].sort(),
      abilities: abilityList,
      aghs: ag ? { scepter: ag.scepter_desc || null, shard: ag.shard_desc || null } : null,
      base: {
        str: h.base_str, agi: h.base_agi, int: h.base_int,
        strGain: h.str_gain, agiGain: h.agi_gain, intGain: h.int_gain,
        hp: h.base_health, mana: h.base_mana, armor: h.base_armor, mr: h.base_mr,
        dmgMin: h.base_attack_min, dmgMax: h.base_attack_max, range: h.attack_range,
        ms: h.move_speed, bat: h.attack_rate, legs: h.legs,
      },
      stats: {
        brackets,
        pub: [h.pub_pick || 0, h.pub_win || 0],
        pubTrend: [h.pub_pick_trend || [], h.pub_win_trend || []],
        turbo: [h.turbo_picks || 0, h.turbo_wins || 0],
        pro: [h.pro_pick || 0, h.pro_win || 0, h.pro_ban || 0],
      },
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const meta = {
    patch: patch?.name || null,
    patchDate: patch?.date || null,
    updated: new Date().toISOString(),
    heroCount: heroes.length,
    source: 'OpenDota API (https://www.opendota.com)',
  };

  await writeFile(path.join(OUT, 'heroes.json'), JSON.stringify({ meta, heroes }));
  console.log(`Wrote heroes.json (${heroes.length} heroes, patch ${meta.patch}).`);

  if (SKIP_MATCHUPS) return;

  // Matchups: for each hero, games and wins against every other hero (recent high-level/pro data).
  console.log('Fetching matchups (≈1 request/sec to respect the rate limit)…');
  const matchups = {};
  let n = 0;
  for (const h of heroes) {
    const rows = await get(`/heroes/${h.id}/matchups`);
    const m = {};
    for (const r of rows) m[r.hero_id] = [r.games_played, r.wins];
    matchups[h.id] = m;
    n++;
    if (n % 10 === 0) console.log(`  ${n}/${heroes.length}`);
    await sleep(API_KEY ? 150 : 1100);
  }
  await writeFile(path.join(OUT, 'matchups.json'), JSON.stringify({ updated: meta.updated, matchups }));
  console.log('Wrote matchups.json.');
}

main().catch((err) => { console.error(err); process.exit(1); });
