// Translations. Turkish is the default language; English is selectable in Settings.

const STRINGS = {
  tr: {
    appName: 'Dota 2 Counter',
    navCounter: 'Counter', navMeta: 'Meta', navHeroes: 'Heroes', navMore: 'Diğer',
    patch: 'Patch', updated: 'Güncellendi', loading: 'Veriler yükleniyor…', loadError: 'Veriler yüklenemedi. İnternet bağlantını kontrol edip tekrar dene.',
    retry: 'Tekrar dene',
    enemyTeam: 'Rakip takım', yourTeam: 'Senin takımın', addHero: 'Hero ekle', clear: 'Temizle', share: 'Paylaş', copied: 'Bağlantı kopyalandı',
    counterHint: 'Rakibin seçtiği heroları ekle, sana en iyi counter\'ları sıralayalım. Birden fazla rakip ekleyebilirsin; öneriler hepsine karşı toplam avantaja göre hesaplanır.',
    quickAdd: 'Hızlı ekle — en çok picklenenler',
    suggestions: 'Önerilen counter\'lar', suggestionsSub: 'Skor = rakiplere karşı toplam avantaj + seçili ligdeki meta win rate',
    advantage: 'Avantaj', winRate: 'Win rate', pickRate: 'Pick rate', picks: 'Pick (günlük)', games: 'maç', score: 'Skor',
    noResults: 'Filtrelere uyan hero yok.', resetFilters: 'Filtreleri sıfırla',
    addToAlly: 'Takımıma ekle', addToEnemy: 'Rakibe ekle', inTeam: 'Takımda', picked: 'Seçili',
    threats: 'Rakip tehditleri & önerilen itemler', teamAnalysis: 'Takım analizi', dangerous: 'Takımına karşı tehlikeli (banla / dikkat et)',
    missing: 'Eksik', have: 'Var', melee: 'Yakın dövüş', ranged: 'Menzilli',
    noStun: 'Takımında güvenilir stun yok — stun\'lu bir hero düşün.',
    noSave: 'Takımında kurtarma/koruma yeteneği yok.',
    noHeal: 'Takımında iyileştirme yok; uzun savaşlarda zorlanabilirsin.',
    noAoe: 'Takım savaşı için alan kontrolü (AoE disable) eksik.',
    allMelee: 'Takımın tamamen yakın dövüş — menzilli bir hero dengeler.',
    allRanged: 'Takımın tamamen menzilli — ön cephe (dayanıklı) eksik olabilir.',
    goodComp: 'Takım dengesi iyi görünüyor.',
    filters: 'Filtreler', search: 'Hero ara…', attribute: 'Özellik', attackType: 'Saldırı tipi', roles: 'Roller', abilities: 'Yetenek özellikleri',
    tagMode: 'Eşleşme', tagAnd: 'Hepsi (VE)', tagOr: 'Herhangi biri (VEYA)', favOnly: 'Sadece favoriler', all: 'Tümü', apply: 'Uygula', close: 'Kapat',
    str: 'Güç', agi: 'Çeviklik', int: 'Zeka', universal: 'Evrensel',
    bracket: 'Lig', allPub: 'Tüm Pub', turbo: 'Turbo', pro: 'Pro',
    metaTitle: 'Meta — mevcut patch', sortBy: 'Sırala', sortWr: 'Win rate', sortPr: 'Pick rate', sortTier: 'Tier', sortName: 'İsim', sortBan: 'Ban (Pro)', sortTrend: 'Trend (7 gün)',
    minPr: 'Min. pick rate', tier: 'Tier', trend: 'Trend', bans: 'Ban', contest: 'Contest',
    heroesTitle: 'Heroes', heroCount: '{n} hero',
    counteredBy: 'Bu heroya karşı güçlü olanlar', goodAgainst: 'Bu heronun iyi olduğu rakipler', stats: 'İstatistikler', byBracket: 'Liglere göre win rate', abilitiesTitle: 'Yetenekler',
    last7: 'Son 7 gün (pub)', baseStats: 'Temel değerler', favorite: 'Favori', unfavorite: 'Favoriden çıkar', counterThis: 'Bunu counterla',
    moreTitle: 'Ayarlar & Hakkında', language: 'Dil', install: 'Uygulamayı yükle',
    installIos: 'iPhone / iPad: Safari\'de alttaki <b>Paylaş</b> ⎋ butonuna dokun → <b>Ana Ekrana Ekle</b>.',
    installAndroid: 'Android: Chrome menüsü ⋮ → <b>Ana ekrana ekle</b> veya <b>Uygulamayı yükle</b>.',
    installDesktop: 'Masaüstü: Adres çubuğundaki yükle simgesine tıkla.',
    installNow: 'Şimdi yükle', installed: 'Uygulama yüklü ✓',
    dataInfo: 'Veriler', dataSource: 'Kaynak', dataNote: 'Hero istatistikleri son 7 günün pub maçlarından (OpenDota); counter ve sinerji verileri STRATZ\'ın lig bazlı milyonlarca maçından, Pro ligi için OpenDota\'dan gelir. Veriler her gün otomatik güncellenir.',
    resetAll: 'Tüm yerel verileri sıfırla', resetConfirm: 'Favoriler ve draft silinsin mi?',
    offline: 'Çevrimdışı — kayıtlı veriler gösteriliyor',
    matchupNote: 'Avantaj: iki heronun genel güçlerine göre beklenenden ne kadar fazla kazandığı (az maçlı eşleşmeler ortalamaya çekilir).',
    vs: 'vs', you: 'Sen', none: 'Yok', tags: 'Özellikler', favorites: 'Favoriler',
    pickHeroFor: '{team} için hero seç', removeHint: 'Kaldırmak için dokun',
    tierNote: 'Tier: win rate (%75) ve pick rate (%25) birleşik skoru.',
    lowSample: 'az veri',
    suggestionsSubSyn: 'Skor = rakiplere karşı avantaj + takımınla sinerji + meta win rate',
    matchupData: 'Eşleşme verisi', synergy: 'Sinerji', with: 'ile', bestTeammates: 'En iyi takım arkadaşları',
    metaWeight: 'Meta ağırlığı', mw_off: 'Yok (sadece counter)', mw_low: 'Düşük', mw_mid: 'Orta', mw_high: 'Yüksek',
  },
  en: {
    appName: 'Dota 2 Counter',
    navCounter: 'Counter', navMeta: 'Meta', navHeroes: 'Heroes', navMore: 'More',
    patch: 'Patch', updated: 'Updated', loading: 'Loading data…', loadError: 'Could not load data. Check your connection and try again.',
    retry: 'Retry',
    enemyTeam: 'Enemy team', yourTeam: 'Your team', addHero: 'Add hero', clear: 'Clear', share: 'Share', copied: 'Link copied',
    counterHint: 'Add the heroes the enemy picked and we\'ll rank the best counters for you. Add several enemies; suggestions use the total advantage against all of them.',
    quickAdd: 'Quick add — most picked',
    suggestions: 'Suggested counters', suggestionsSub: 'Score = total advantage vs. enemies + meta win rate in the selected bracket',
    advantage: 'Advantage', winRate: 'Win rate', pickRate: 'Pick rate', picks: 'Picks (daily)', games: 'games', score: 'Score',
    noResults: 'No heroes match the filters.', resetFilters: 'Reset filters',
    addToAlly: 'Add to my team', addToEnemy: 'Add to enemy', inTeam: 'In team', picked: 'Picked',
    threats: 'Enemy threats & suggested items', teamAnalysis: 'Team analysis', dangerous: 'Dangerous vs. your team (ban / watch out)',
    missing: 'Missing', have: 'Have', melee: 'Melee', ranged: 'Ranged',
    noStun: 'Your team has no reliable stun — consider a stunner.',
    noSave: 'Your team has no save/protection ability.',
    noHeal: 'Your team has no healing; long fights may be hard.',
    noAoe: 'Your team lacks area disables for teamfights.',
    allMelee: 'Your team is all melee — a ranged hero would balance it.',
    allRanged: 'Your team is all ranged — you may lack a frontline.',
    goodComp: 'Team composition looks balanced.',
    filters: 'Filters', search: 'Search hero…', attribute: 'Attribute', attackType: 'Attack type', roles: 'Roles', abilities: 'Ability traits',
    tagMode: 'Match', tagAnd: 'All (AND)', tagOr: 'Any (OR)', favOnly: 'Favorites only', all: 'All', apply: 'Apply', close: 'Close',
    str: 'Strength', agi: 'Agility', int: 'Intelligence', universal: 'Universal',
    bracket: 'Bracket', allPub: 'All Pub', turbo: 'Turbo', pro: 'Pro',
    metaTitle: 'Meta — current patch', sortBy: 'Sort', sortWr: 'Win rate', sortPr: 'Pick rate', sortTier: 'Tier', sortName: 'Name', sortBan: 'Bans (Pro)', sortTrend: 'Trend (7 days)',
    minPr: 'Min. pick rate', tier: 'Tier', trend: 'Trend', bans: 'Bans', contest: 'Contest',
    heroesTitle: 'Heroes', heroCount: '{n} heroes',
    counteredBy: 'Strong against this hero', goodAgainst: 'This hero is good against', stats: 'Stats', byBracket: 'Win rate by bracket', abilitiesTitle: 'Abilities',
    last7: 'Last 7 days (pub)', baseStats: 'Base stats', favorite: 'Favorite', unfavorite: 'Unfavorite', counterThis: 'Counter this',
    moreTitle: 'Settings & About', language: 'Language', install: 'Install the app',
    installIos: 'iPhone / iPad: in Safari tap <b>Share</b> ⎋ → <b>Add to Home Screen</b>.',
    installAndroid: 'Android: Chrome menu ⋮ → <b>Add to Home screen</b> or <b>Install app</b>.',
    installDesktop: 'Desktop: click the install icon in the address bar.',
    installNow: 'Install now', installed: 'App installed ✓',
    dataInfo: 'Data', dataSource: 'Source', dataNote: 'Hero stats come from the last 7 days of public matches (OpenDota); counter and synergy data come from millions of STRATZ matches per bracket, and from OpenDota for Pro. Data refreshes automatically every day.',
    resetAll: 'Reset all local data', resetConfirm: 'Delete favorites and draft?',
    offline: 'Offline — showing saved data',
    matchupNote: 'Advantage: how much more a hero wins than expected from both heroes\' overall strength (low-sample matchups are pulled toward average).',
    vs: 'vs', you: 'You', none: 'None', tags: 'Traits', favorites: 'Favorites',
    pickHeroFor: 'Pick a hero for {team}', removeHint: 'Tap to remove',
    tierNote: 'Tier: combined score of win rate (75%) and pick rate (25%).',
    lowSample: 'low data',
    suggestionsSubSyn: 'Score = advantage vs. enemies + synergy with your team + meta win rate',
    matchupData: 'Matchup data', synergy: 'Synergy', with: 'with', bestTeammates: 'Best teammates',
    metaWeight: 'Meta weight', mw_off: 'Off (counter only)', mw_low: 'Low', mw_mid: 'Medium', mw_high: 'High',
  },
};

export const TAGS = {
  stun:          { tr: 'Stun', en: 'Stun', color: '#f5a623' },
  root:          { tr: 'Root', en: 'Root', color: '#7cb342' },
  slow:          { tr: 'Slow', en: 'Slow', color: '#4fc3f7' },
  silence:       { tr: 'Silence', en: 'Silence', color: '#ba68c8' },
  hex:           { tr: 'Hex', en: 'Hex', color: '#aed581' },
  disarm:        { tr: 'Disarm', en: 'Disarm', color: '#ffb74d' },
  taunt:         { tr: 'Taunt / Fear', en: 'Taunt / Fear', color: '#e57373' },
  displace:      { tr: 'İtme / Çekme', en: 'Displacement', color: '#90a4ae' },
  aoeDisable:    { tr: 'Alan kontrolü', en: 'AoE disable', color: '#ff8a65' },
  bkbPierce:     { tr: 'BKB delen', en: 'Pierces BKB', color: '#ffd54f' },
  breakPassive:  { tr: 'Break', en: 'Break', color: '#a1887f' },
  dispel:        { tr: 'Dispel', en: 'Dispel', color: '#80deea' },
  invis:         { tr: 'Görünmezlik', en: 'Invisibility', color: '#9575cd' },
  mobility:      { tr: 'Mobilite', en: 'Mobility', color: '#4db6ac' },
  heal:          { tr: 'İyileştirme', en: 'Healing', color: '#66bb6a' },
  save:          { tr: 'Kurtarma', en: 'Save', color: '#64b5f6' },
  illusion:      { tr: 'İllüzyon', en: 'Illusions', color: '#b39ddb' },
  summon:        { tr: 'Summon', en: 'Summons', color: '#bcaaa4' },
  armorReduction:{ tr: 'Zırh azaltma', en: 'Armor reduction', color: '#ef9a9a' },
  manaBurn:      { tr: 'Mana yakma', en: 'Mana burn', color: '#7986cb' },
  pureDamage:    { tr: 'Pure hasar', en: 'Pure damage', color: '#fff176' },
  global:        { tr: 'Global', en: 'Global', color: '#4dd0e1' },
};

export const ROLES = {
  Carry: { tr: 'Carry', en: 'Carry' },
  Support: { tr: 'Support', en: 'Support' },
  Nuker: { tr: 'Nuker', en: 'Nuker' },
  Disabler: { tr: 'Disabler', en: 'Disabler' },
  Initiator: { tr: 'Initiator', en: 'Initiator' },
  Durable: { tr: 'Dayanıklı', en: 'Durable' },
  Escape: { tr: 'Kaçış', en: 'Escape' },
  Pusher: { tr: 'Pusher', en: 'Pusher' },
};

// Counter items keyed by the enemy trait they answer.
export const ITEM_ADVICE = {
  invis:    { items: ['dust', 'ward_sentry', 'gem'], tr: 'Görünmez rakip var: tespit al.', en: 'Invisible enemy: buy detection.' },
  illusion: { items: ['mjollnir', 'bfury', 'radiance', 'shivas_guard'], tr: 'İllüzyonlara karşı alan hasarı.', en: 'Area damage against illusions.' },
  summon:   { items: ['mjollnir', 'maelstrom', 'crimson_guard'], tr: 'Summon\'lara karşı alan hasarı ve blok.', en: 'Area damage and block against summons.' },
  heal:     { items: ['spirit_vessel', 'shivas_guard', 'skadi'], tr: 'İyileşmeyi azalt.', en: 'Reduce enemy healing.' },
  stun:     { items: ['black_king_bar', 'aeon_disk', 'lotus_orb'], tr: 'Çok stun var: büyü bağışıklığı.', en: 'Lots of stuns: spell immunity.' },
  silence:  { items: ['manta', 'lotus_orb', 'black_king_bar'], tr: 'Silence\'ı dispel et.', en: 'Dispel silences.' },
  hex:      { items: ['sphere', 'lotus_orb', 'black_king_bar'], tr: 'Tek hedefli disable\'ı engelle.', en: 'Block single-target disables.' },
  root:     { items: ['manta', 'cyclone', 'black_king_bar'], tr: 'Root\'u dispel et veya bağışık ol.', en: 'Dispel roots or become immune.' },
  bkbPierce:{ items: ['aeon_disk', 'lotus_orb', 'sphere'], tr: 'BKB delen disable var: Aeon/Linken.', en: 'BKB-piercing disables: Aeon/Linken.' },
  mobility: { items: ['sheepstick', 'orchid', 'rod_of_atos', 'abyssal_blade'], tr: 'Kaçan heroları kilitle.', en: 'Lock down slippery heroes.' },
  save:     { items: ['nullifier', 'sheepstick'], tr: 'Kurtarmaları (Ghost/Glimmer) dispel et.', en: 'Dispel saves (Ghost/Glimmer).' },
  pureDamage:{ items: ['aeon_disk', 'heart', 'blade_mail'], tr: 'Pure hasara karşı can ve Aeon.', en: 'HP and Aeon against pure damage.' },
  slow:     { items: ['manta', 'black_king_bar', 'phase_boots'], tr: 'Slow\'lara karşı dispel/hız.', en: 'Dispel or outrun slows.' },
  armorReduction: { items: ['assault', 'crimson_guard', 'shivas_guard'], tr: 'Zırh azaltmaya karşı zırh.', en: 'Armor against armor reduction.' },
  taunt:    { items: ['aeon_disk', 'black_king_bar', 'blink'], tr: 'Taunt/Fear\'e karşı pozisyon + Aeon.', en: 'Positioning + Aeon vs taunt/fear.' },
  manaBurn: { items: ['arcane_boots', 'bloodstone'], tr: 'Mana yakmaya karşı mana havuzu.', en: 'Bigger mana pool vs mana burn.' },
};

export const ITEM_NAMES = {
  dust: 'Dust of Appearance', ward_sentry: 'Sentry Ward', gem: 'Gem of True Sight', mjollnir: 'Mjollnir', bfury: 'Battle Fury',
  radiance: 'Radiance', shivas_guard: "Shiva's Guard", maelstrom: 'Maelstrom', crimson_guard: 'Crimson Guard', spirit_vessel: 'Spirit Vessel',
  skadi: 'Eye of Skadi', black_king_bar: 'Black King Bar', aeon_disk: 'Aeon Disk', lotus_orb: 'Lotus Orb', manta: 'Manta Style',
  sphere: "Linken's Sphere", cyclone: "Eul's Scepter", sheepstick: 'Scythe of Vyse', orchid: 'Orchid Malevolence', rod_of_atos: 'Rod of Atos',
  abyssal_blade: 'Abyssal Blade', nullifier: 'Nullifier', heart: 'Heart of Tarrasque', blade_mail: 'Blade Mail', phase_boots: 'Phase Boots',
  assault: 'Assault Cuirass', blink: 'Blink Dagger', arcane_boots: 'Arcane Boots', bloodstone: 'Bloodstone',
};

let current = 'tr';
try {
  const saved = JSON.parse(localStorage.getItem('d2c:lang') || 'null');
  current = saved || ((navigator.language || 'tr').toLowerCase().startsWith('tr') ? 'tr' : 'en');
} catch { /* storage unavailable */ }

export const lang = () => current;
export function setLang(l) {
  current = STRINGS[l] ? l : 'tr';
  try { localStorage.setItem('d2c:lang', JSON.stringify(current)); } catch { /* ignore */ }
  document.documentElement.lang = current;
}
export function t(key, vars) {
  let s = STRINGS[current][key] ?? STRINGS.tr[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
}
export const tagLabel = (tag) => TAGS[tag]?.[current] || tag;
export const roleLabel = (r) => ROLES[r]?.[current] || r;
