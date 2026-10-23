/* shared/day-bars: wspólne style wykresów dziennych (kolumna = dzień, słupki od dołu, dymek po dotknięciu).
   HG_TIP_CSS: dymek .tip i wjazd słupków hgbar (tydzień, statystyki energii, prognoza produkcji); karta ustawia tylko bottom dymka i dosunięcie do krawędzi.
   HG_DAYBARS_CSS: kolumny dni z wartością nad słupkami i notka .note pod wykresem (tydzień, prognoza produkcji). Słupek: wysokość --h (domyślnie 100% pary .pr),
   szerokość z --bwf (udział kolumny) w granicach --bwmin / --bwmax. Wysokość wykresu (.ch min-height) i zapytania kontenera zostają w karcie. */
const HG_TIP_CSS = U(`
.tip{ position:absolute; left:50%; transform:translateX(-50%); background:#fff; border:1px solid rgba(0,0,0,.06); border-radius:var(--r-sm); padding:var(--s1) var(--s2); font-size:var(--fs-xs); line-height:1.4; white-space:nowrap; color:#2B2E33; box-shadow:var(--hg-sh);
  z-index:5; pointer-events:none; text-align:left; }
.tip i{ display:inline-block; width:6u; height:6u; border-radius:50%; margin-right:4u; }
@keyframes hgbar{ from{ transform:scaleY(0) } }
`);
const HG_DAYBARS_CSS = HG_TIP_CSS + U(`
.ch{ position:relative; flex:1 0 auto; display:grid; grid-template-columns:repeat(var(--n), 1fr); gap:2px; }
.ch::after{ content:''; position:absolute; left:0; right:0; bottom:22px; height:1px; background:rgba(30,32,36,.14); pointer-events:none; }
.d{ position:relative; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; gap:6px; border-radius:var(--r-sm); padding-top:3u; min-width:0; }
.d:focus-visible{ outline:2px solid var(--hg-accent); outline-offset:-2px; }
.d.sel{ background:var(--hg-tile-bg); }
.bs{ position:relative; flex:1; min-height:0; width:100%; }
/* absolutnie pozycjonowany kontener => procentowe wysokości słupków liczone od stałej wysokości wykresu */
.bw{ position:absolute; left:0; right:0; top:20px; bottom:0; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; }
.pr{ position:relative; display:flex; align-items:flex-end; justify-content:center; min-height:6px; }
/* słupek skalowany z szerokością karty; mała niezerowa wartość ma min. 8px, zero to cienka kreska, brak danych to kropka */
.pr i{ display:block; width:clamp(var(--bwmin, 7px), calc(100cqi / var(--n) * var(--bwf, .3)), var(--bwmax, 28px)); height:var(--h, 100%); min-height:8px; border-radius:999px;
  background:linear-gradient(180deg, var(--c), color-mix(in srgb, var(--c) 25%, transparent)); transform-origin:bottom; animation:hgbar .6s cubic-bezier(.2,.8,.2,1) both; }
.pr i.z{ min-height:2px; opacity:.35; }
.pr i.nd{ width:5u; height:5u; min-height:0; border-radius:50%; background:#C3C6CA; animation:none; margin:0 1u -2.5u; }
.d small{ font-size:max(12px, var(--fs-xs)); color:#5A5E64; line-height:16px; height:16px; } .d.today small{ color:#1E2023; font-weight:600; }
.val{ position:absolute; bottom:calc(100% + 3px); left:50%; transform:translateX(-50%); font-size:max(12.5px, var(--fs-xs)); font-weight:500; color:#3B3F45; white-space:nowrap; line-height:16px; }
.today .val{ font-weight:600; }
.tip{ bottom:calc(100% + 2u); } .tip b{ font-weight:600; }
.d:nth-child(-n+2) .tip{ left:0; transform:none; } .d:nth-last-child(-n+2) .tip{ left:auto; right:0; transform:none; }
.note{ font-size:var(--fs-xs); color:#8A8E94; display:flex; align-items:center; gap:5u; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.note i{ width:5u; height:5u; border-radius:50%; background:#C3C6CA; flex:none; }
@media (prefers-reduced-motion:reduce){ .pr i{ animation:none; } }
`);
