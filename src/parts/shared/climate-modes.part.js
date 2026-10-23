/* shared/climate-modes: Tryby HVAC (kolory, ikony, nazwy) dla karty klimatyzacji i pokoi. */
/* ===================== KLIMATYZACJA ===================== */
/* stan widoczny od razu, bez zmiany powierzchni szkła: mała pełna kropka trybu z ikoną (subtelna animacja), aktywny chip,
   podświetlenie łuku i tekst „Chłodzi · 21°”. Wyłączona: wszystko szare i przygaszone. Dotknięcie: stan od razu (optymistycznie),
   potwierdzenie z HA (albo powrót po 8 s, gdy HA nie potwierdzi). */
const HG_AC_MODE = {
  /* c: wypełnienie aktywnego przycisku trybu, on: ikona/tekst na nim, t: token koloru tekstu statusu (kontrast w obu schematach) */
  cool: { c: 'var(--hg-accent)', on: 'var(--hg-accent-tx)', i: 'mdi:snowflake', t: 'cool', get l() { return hgT('common.cooling'); } }, heat: { c: 'var(--hg-accent)', on: '#1E2023', i: 'mdi:fire', t: 'heat', get l() { return hgT('common.heating'); } },
  dry: { c: '#A3A9B1', on: '#1E2023', i: 'mdi:water-percent', t: 'neu', get l() { return hgT('shared.climate_modes.drying'); } }, fan_only: { c: '#A3A9B1', on: '#1E2023', i: 'mdi:fan', t: 'neu', get l() { return hgT('shared.climate_modes.fan_only'); } },
  heat_cool: { c: 'var(--hg-accent)', on: 'var(--hg-accent-tx)', i: 'mdi:thermostat-auto', t: 'auto', l: 'Auto' }, auto: { c: 'var(--hg-accent)', on: 'var(--hg-accent-tx)', i: 'mdi:thermostat-auto', t: 'auto', l: 'Auto' },
  off: { c: '#C4C8CE', on: '#5A5E64', i: 'mdi:power', t: 'neu', get l() { return hgT('common.off_fem'); } },
};
/* Skąd wiadomo, co urządzenie klimatu naprawdę robi. Ogólne, bez założeń o integracji, marce czy encjach.
   Ustawienie na urządzenie (Wygląd > Pokoje, obok czujników pokoju, w sensors[pokój]):
     'src:climate.x'   auto (domyślnie) | entity | room | mode
     'state:climate.x' encja stanu rzeczywistego (włącz/wyłącz albo liczbowa, np. moc)
     'thr:climate.x'   próg dla encji liczbowej (domyślnie 5 W dla W/kW, 0 dla innych jednostek)
     'temp:climate.x'  niezależny czujnik temperatury pokoju (domyślnie wybrany czujnik pokoju), nigdy current_temperature urządzenia
     'hys:climate.x'   histereza w stopniach (domyślnie 0,5)
   Auto: encja (potwierdzone) > hvac_action (potwierdzone) > temperatura pokoju względem nastawy (szacunek) > sam tryb (nic nie twierdzi). */
const HG_CLIM_SRC = ['auto', 'entity', 'room', 'mode'];
const HG_ACT = { heating: 'heat', preheating: 'heat', defrosting: 'heat', cooling: 'cool', drying: 'dry', fan: 'fan_only', idle: 'idle', off: 'idle' };
/* true pracuje / false nie pracuje / null brak, niedostępna albo tekst (tekstu nie zgadujemy) */
const hgOnState = (s, thr) => {
  if (!s) return null;
  if (s.state === 'on') return true; if (s.state === 'off') return false;
  const n = Number(s.state); if (s.state === '' || s.state == null || !isFinite(n)) return null;
  const u = (s.attributes && s.attributes.unit_of_measurement) || '', v = u === 'kW' ? n * 1000 : u === 'MW' ? n * 1e6 : n;
  const t = thr != null && thr !== '' && isFinite(Number(thr)) ? Number(thr) : /^[kM]?W$/.test(u) ? 5 : 0;
  return v > t;
};
const hgClimNum = (v, d) => (v != null && v !== '' && isFinite(Number(v)) ? Number(v) : d);
/* { mode, act, conf, src }: act 'heat'|'cool'|'dry'|'fan_only'|'heat_cool'|'auto'|'idle' albo null (sam tryb);
   conf 'confirmed' | 'estimated' | 'mode'; null gdy wyłączone albo niedostępne. rid: pokój (kafel Pokoje) */
const hgClimInfo = (h, s, st = s && s.state, cfg, rid) => {
  if (!s || !st || st === 'off' || st === 'unavailable' || st === 'unknown') return null;
  const M = () => ({ mode: st, act: null, conf: 'mode', src: 'mode' });
  if (st !== s.state) return M();   // zmiana optymistyczna: jeszcze bez danych z urządzenia
  const a = s.attributes || {}, C = (typeof HGAreas !== 'undefined' && h && HGAreas.climCfg ? HGAreas.climCfg(h, s.entity_id, cfg, rid) : null) || {};
  const src = HG_CLIM_SRC.includes(C.src) ? C.src : 'auto', ha = HG_ACT[a.hvac_action];
  if (src === 'mode') return M();
  const run = () => (['heat_cool', 'auto'].includes(st) && ha && ha !== 'idle' ? ha : st);   // pracuje: w auto kierunek z hvac_action, jeśli jest
  if (src === 'auto' || src === 'entity') {
    const on = C.ent && h.states ? hgOnState(h.states[C.ent], C.thr) : null;
    if (on != null) return { mode: st, act: on ? run() : 'idle', conf: 'confirmed', src: 'entity' };
    if (src === 'entity') return M();
  }
  if (src === 'auto' && ha) return { mode: st, act: ha, conf: 'confirmed', src: 'hvac_action' };
  const r = C.temp && h.states ? h.states[C.temp] : null, cur = r ? parseFloat(r.state) : NaN, hy = Math.max(0, hgClimNum(C.hys, 0.5));
  if (isFinite(cur)) {
    const tg = parseFloat(a.temperature), lo = parseFloat(a.target_temp_low), hi = parseFloat(a.target_temp_high); let act = null;
    if (st === 'heat' && isFinite(tg)) act = cur < tg - hy ? 'heat' : 'idle';
    else if (st === 'cool' && isFinite(tg)) act = cur > tg + hy ? 'cool' : 'idle';
    else if ((st === 'heat_cool' || st === 'auto') && isFinite(lo) && isFinite(hi)) act = cur < lo - hy ? 'heat' : cur > hi + hy ? 'cool' : 'idle';
    if (act) return { mode: st, act, conf: 'estimated', src: 'room' };
  }
  return M();
};
/* zgodność wstecz: co robi, a przy samym trybie tryb */
const hgClimAct = (h, s, st = s && s.state, cfg) => { const i = hgClimInfo(h, s, st, cfg); return i ? i.act || i.mode : null; };
/* kolejność na kaflu pokoju: potwierdzona praca > szacowana praca > sam tryb > potwierdzona bezczynność > szacowana */
const hgClimRank = (i) => (!i ? 0 : i.conf === 'mode' ? 3 : i.act === 'idle' ? (i.conf === 'confirmed' ? 2 : 1) : i.conf === 'confirmed' ? 5 : 4);
/* kolory trybów: jedna mapa dla menu „Tryb pracy” pilota (remote-card) i kropki klimatu na kaflu Pokoje.
   auto / heat_cool: kolor z nastawy (zimno, środek, ciepło), jak w pilocie */
const HG_CLIM_COL = { off: '#8A9099', cool: 'hsl(214 88% 56%)', heat: 'hsl(24 92% 54%)', dry: 'hsl(178 52% 40%)', fan_only: 'hsl(205 18% 52%)', mid: 'hsl(262 62% 60%)' };
const hgClimCol = (st, t, mn, mx) => {
  if (HG_CLIM_COL[st]) return HG_CLIM_COL[st];
  const f = t == null || !isFinite(t) || !(mx > mn) ? .5 : (t - mn) / (mx - mn);
  return f < .4 ? HG_CLIM_COL.cool : f > .6 ? HG_CLIM_COL.heat : HG_CLIM_COL.mid;
};
