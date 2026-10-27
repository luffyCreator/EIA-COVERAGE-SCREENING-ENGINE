/* ================= STATIC CONTOUR BACKGROUND (no runtime loop) ================= */
/* Built once at load, not redrawn — a one-time CSS stroke "draw-in" is the only
   animation, so this costs nothing after the first ~2 seconds. */
(function(){
  const el = document.getElementById('contourBg');
  const W = 1000, H = 420, LINES = 9;
  let paths = '';
  for(let i=0;i<LINES;i++){
    const baseY = 20 + (H/LINES)*i;
    const amp = 12 + i*1.6;
    const phase = i*0.7;
    let d = `M -20 ${(baseY+Math.sin(phase)*amp).toFixed(1)}`;
    for(let x=0;x<=W+20;x+=40){
      const y = baseY + Math.sin(x*0.012+phase)*amp + Math.sin(x*0.004+phase*1.3)*amp*0.5;
      d += ` L ${x} ${y.toFixed(1)}`;
    }
    const teal = i%4===0;
    const color = teal ? 'rgba(34,211,197,0.16)' : 'rgba(92,201,143,0.11)';
    paths += `<path d="${d}" style="stroke:${color};animation-delay:${(i*0.08).toFixed(2)}s"/>`;
  }
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${paths}</svg>`;
})();

/* ================= SEARCH ================= */
const searchInput = document.getElementById('searchInput');
const dropdown = document.getElementById('dropdown');
const inputCard = document.getElementById('inputCard');
const resultEl = document.getElementById('result');
const situationalWrap = document.getElementById('situationalWrap');
const sitBody = document.getElementById('sitBody');

let activeItem = null;
let currentMatches = [];
let currentAnswer = null;
let currentContext = {}; // stores last val/checked/etc for reasoning text

function levenshtein(a,b){
  const m=a.length,n=b.length; if(!m) return n; if(!n) return m;
  const dp=Array.from({length:m+1},(_,i)=>[i,...Array(n).fill(0)]);
  for(let j=0;j<=n;j++) dp[0][j]=j;
  for(let i=1;i<=m;i++) for(let j=1;j<=n;j++)
    dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  return dp[m][n];
}
function scoreItem(item, query, tokens){
  const hay = `${item.code} ${item.name} ${item.section} ${item.aliases||''}`.toLowerCase();
  let score = 0;
  if(hay.includes(query)) score += 100;
  tokens.forEach(tok=>{
    if(tok.length<2) return;
    if(hay.includes(tok)) score += 22;
    else {
      const words = hay.split(/[\s,\/()–-]+/);
      for(const w of words){ if(w.length>=4 && levenshtein(w,tok)<=1){ score += 12; break; } }
    }
  });
  return score;
}
// Broadens matching beyond literal aliases — common colloquial, Cebuano/Tagalog,
// and category-adjacent terms that callers actually use.
const SYNONYM_MAP = {
  "hog":"piggery pig swine baboy", "baboy":"piggery pig swine hog",
  "manok":"poultry chicken bird", "chicken":"poultry manok bird",
  "isda":"fishpond aquaculture fish", "bangus":"fishpond aquaculture fish",
  "balay":"dwelling house residential", "bahay":"dwelling house residential",
  "gasolinahan":"gas station gasoline refilling",
  "basura":"waste garbage dumpsite landfill",
  "tulay":"bridge",
  "eco":"ecotourism leisure tourism environmental",
  "ecotourism":"resort tourism leisure boardwalk mangrove",
  "condo":"condominium residential building",
  "subdivision":"housing residential",
  "quarry":"extraction mining aggregates",
  "cellsite":"telecommunications tower antenna",
  "cell":"telecommunications tower antenna",
  "hospital":"medical institutional",
  "warehouse":"storage building",
  "farm":"agriculture livestock plantation",
  "asin":"salt production dike fishpond",
  "gasolina":"gas station gasoline refilling storage",
  "langis":"oil petroleum storage",
  "kalsada":"road",
  "talyer":"auto repair shop motor shop mechanic vulcanizing",
  "byahe":"transport terminal",
  "dagat":"marine fishery coastal",
  "bukid":"farm plantation agriculture",
  "kahoy":"wood lumber forestry",
  "bato":"quarry stone extraction",
  "yelo":"ice plant",
  "gatas":"dairy milk processing",
  "itik":"poultry duck farm", "bibi":"poultry duck farm",
  "kanding":"livestock goat farm grazing", "kambing":"livestock goat farm grazing",
  "baka":"livestock cattle farm grazing", "kabayo":"livestock horse farm grazing",
  "palayan":"rice mill agricultural land farm", "humay":"rice mill agricultural land farm",
  "tubo":"sugar mill sugarcane", "asukal":"sugar mill sugarcane",
  "niyog":"coconut processing plantation", "lubi":"coconut processing plantation",
  "saging":"plantation agriculture banana",
  "uling":"charcoal coal", "karbon":"charcoal coal",
  "semento":"cement non-metallic mineral processing",
  "bakal":"scrap metal junk shop steel",
  "plastik":"plastic recycling products",
  "linya":"pipeline transmission line power line",
  "poso":"well water supply deep well",
  "dam":"dams irrigation flood control hydropower reservoir",
  "patubig":"irrigation water supply dam",
  "baybayon":"shoreline coastal foreshore",
  "baybay":"shoreline coastal foreshore",
  "sapa":"river creek waterway dredging",
  "suba":"river creek waterway dredging",
  "minahan":"mining quarrying extraction",
  "simbahan":"institutional building church",
  "paaralan":"school institutional building",
  "merkado":"public market commercial",
  "palengke":"public market commercial",
  "resort":"tourism leisure resort beach",
  "ihawan":"slaughterhouse abattoir meat processing",
  "pamatyan":"slaughterhouse abattoir meat processing",
  "karnehan":"slaughterhouse abattoir meat processing",
  "tanggalan":"junk shop scrap recycling",
  "basurahan":"waste garbage dumpsite landfill",
  "kalat":"waste garbage dumpsite landfill",
  "bodega":"warehouse storage building",
  "pabrika":"factory manufacturing industry",
  "planta":"processing plant facility",
  "piggery":"hog farm swine livestock",
  "hatchery":"fish shrimp poultry egg hatchery",
  "feedmill":"animal feed mill",
  "funeral":"memorial park cemetery",
  "memorial":"memorial park cemetery",
  "columbarium":"memorial park cemetery",
  "cemetery":"memorial park",
  "sawmill":"wood processing lumber sawmill",
  "logging":"forestry timber wood processing",
  "kaingin":"forestry land clearing",
  "quarrying":"extraction mining aggregates quarry",
  "sandmining":"extraction sand gravel aggregates dredging",
  "dredging":"extraction sand gravel aggregates dredging river",
  "reclaim":"reclamation land restoration foreshore filling",
  "foreshore":"reclamation land restoration shoreline",
  "geothermal":"power plant geothermal facility",
  "windmill":"wind farm power plant renewable energy",
  "turbine":"wind farm power plant renewable energy",
  "solarfarm":"solar power plant renewable energy",
  "floatingsolar":"floating photovoltaic solar",
  "biogas":"renewable energy fuel cell power plant",
  "composting":"waste recycling treatment facility",
  "mrf":"materials recovery facility waste recycling",
  "sewerage":"septage wastewater treatment",
  "drainage":"flood control water supply",
  "pakyawan":"wholesale retail commercial",
  "tindahan":"commercial retail store",
  "subdibisyon":"subdivision housing residential",
  "piyer":"pier jetty seaport",
  "daungan":"pier jetty seaport harbor",
  "eroplano":"airport airstrip runway",
  "paliparan":"airport airstrip runway"
};
function expandTokens(tokens){
  const extra = [];
  tokens.forEach(t=>{ if(SYNONYM_MAP[t]) extra.push(...SYNONYM_MAP[t].split(' ')); });
  return tokens.concat(extra);
}

function findAmbiguousMatch(query){
  for(const grp of AMBIGUOUS_TERMS){
    for(const term of grp.match){
      if(query.includes(term)) return grp;
    }
  }
  return null;
}
function findContextHints(query){
  const hits = [];
  for(const key in CONTEXT_HINTS){
    if(query.includes(key)) hits.push(CONTEXT_HINTS[key]);
  }
  return hits;
}

const searchBox = document.querySelector('.search-box');
const clarifyBox = document.createElement('div');
clarifyBox.className = 'clarify-box';
const hintBox = document.createElement('div');
hintBox.className = 'hint-box';
searchBox.insertAdjacentElement('afterend', clarifyBox);
clarifyBox.insertAdjacentElement('afterend', hintBox);

searchInput.addEventListener('input', e=>{
  const query = e.target.value.trim().toLowerCase();
  activeItem = null; currentAnswer = null;
  inputCard.style.display='none'; resultEl.classList.remove('show'); situationalWrap.style.display='none';
  clarifyBox.innerHTML=''; hintBox.innerHTML='';
  if(query.length<2){ dropdown.classList.remove('show'); return; }

  // Layer 1 — context hints (ECA clues etc.), shown regardless of match quality
  const hints = findContextHints(query);
  if(hints.length){
    hintBox.innerHTML = hints.map(h=>`<div class="hint-chip">📍 ${h}</div>`).join('');
  }

  // Layer 2 — score against the real dataset FIRST. A confident, specific
  // match (e.g. "poultry farm" scoring high against the Poultry entry)
  // always wins — the clarify prompt only kicks in when the search is too
  // generic to trust on its own (e.g. bare "farm" or "pond").
  const tokens = expandTokens(query.split(/\s+/));
  const scored = DATA.map(item=>({item, score:scoreItem(item, query, tokens)}));
  scored.sort((a,b)=>b.score-a.score);
  const CONFIDENT = 90;
  const confident = scored.length && scored[0].score >= CONFIDENT;

  if(!confident){
    const amb = findAmbiguousMatch(query);
    if(amb){
      dropdown.classList.remove('show');
      currentClarifyOptions = amb.options;
      clarifyBox.innerHTML = `
        <div class="clarify-card">
          <div class="clarify-prompt">🤔 ${amb.prompt}</div>
          <div class="clarify-opts">
            ${amb.options.map((o,i)=>`<button class="clarify-opt" onclick="pickClarify(${i})">${o.label}</button>`).join('')}
          </div>
        </div>`;
      return;
    }
  }

  // Layer 3 — normal scored dropdown, with a graceful fallback when nothing scores well
  let strong = scored.filter(r=>r.score>0);
  let label = null;
  if(!strong.length || strong[0].score < 20){
    // nothing matched well — fall back to the closest few instead of showing nothing
    strong = scored.slice(0,5);
    label = "No exact match — closest project types:";
  }
  currentMatches = strong.slice(0,12).map(r=>r.item);
  if(currentMatches.length){
    dropdown.classList.add('show');
    dropdown.innerHTML = (label?`<div class="dd-fallback-label">${label}</div>`:'') + currentMatches.map((m,i)=>`
      <div class="dd-item" onclick="pickItem(${i})">
        <div><div class="dd-title">${m.name}</div><div class="dd-meta">${m.section}</div></div>
        <div class="dd-code">${m.code}</div>
      </div>`).join('');
  } else dropdown.classList.remove('show');
});

let currentClarifyOptions = [];
// Synthetic entries for clarify paths that don't map to a numbered Annex A
// Clarify options resolve one of three ways:
//  - o.code    → a real Annex A entry, routed through the normal pipeline
//  - o.custom  → a synthetic fixed-result item (defined in data.js, shared
//                across groups) routed through the same pipeline
//  - o.info    → no single answer possible; show guidance text only
window.pickClarify = function(i){
  const o = currentClarifyOptions[i];
  clarifyBox.innerHTML=''; dropdown.classList.remove('show');
  if(o.code){
    activeItem = DATA.find(d=>d.code===o.code);
    searchInput.value = activeItem.name;
    renderInputCard();
  } else if(o.custom){
    activeItem = o.custom;
    searchInput.value = activeItem.name;
    renderInputCard();
    if(o.openSituation){
      document.getElementById('sitBody').classList.add('show');
      pickSituation(o.openSituation);
    }
  } else if(o.info){
    activeItem=null; currentAnswer=null;
    resultEl.classList.remove('show'); situationalWrap.style.display='none';
    inputCard.style.display='block';
    inputCard.innerHTML = `<div class="item-name">Need one more detail</div>
      <div class="input-row" style="color:var(--ink-dim);font-size:13.5px;">${o.info}</div>`;
  }
};
document.addEventListener('click', e=>{
  if(!searchInput.contains(e.target) && !dropdown.contains(e.target)) dropdown.classList.remove('show');
});
window.pickItem = function(i){
  activeItem = currentMatches[i];
  searchInput.value = activeItem.name;
  dropdown.classList.remove('show');
  renderInputCard();
};
function resetAll(){
  activeItem=null; currentAnswer=null; searchInput.value='';
  inputCard.style.display='none'; resultEl.classList.remove('show');
  situationalWrap.style.display='none'; sitBody.classList.remove('show');
  searchInput.focus();
}

/* ================= INPUT CARD ================= */
function renderInputCard(){
  const it = activeItem;
  let html = `<div class="item-name">${it.name}</div><div class="item-code">${it.section} · ${it.code}</div>`;
  if(it.kind==='fixed'){
    html += `<div class="input-row" style="color:var(--ink-dim);font-size:13.5px;">${it.basis}</div>`;
    inputCard.innerHTML = html; inputCard.style.display='block';
    computeAndRender(); return;
  }
  if(it.kind==='numeric' || it.kind==='numeric_or'){
    const unitControl = it.altUnits
      ? `<select id="unitSelect" class="unit-select" onchange="computeAndRender()">${it.altUnits.map((u,i)=>`<option value="${i}">${u.label}</option>`).join('')}</select>`
      : `<span class="unit-tag">${it.unit}</span>`;
    html += `<div class="input-row"><label>Enter the project's ${it.basis.toLowerCase()}</label>
      <div class="value-input"><input type="number" min="0" step="any" id="valInput" placeholder="0">${unitControl}</div></div>`;
    if(it.kind==='numeric_or') html += `<div class="checkbox-row"><input type="checkbox" id="orInput"><label for="orInput">${it.orLabel}</label></div>`;
    inputCard.innerHTML = html; inputCard.style.display='block';
    document.getElementById('valInput').addEventListener('input', computeAndRender);
    if(it.kind==='numeric_or') document.getElementById('orInput').addEventListener('change', computeAndRender);
    return;
  }
  if(it.kind==='unit_choice'){
    html += `<div class="dual-group">
      <div class="dual-group-label">This project type is measured differently depending on its form — pick the one that applies:</div>
      <div class="input-row"><div class="choice-row">
      ${it.choices.map((c,i)=>`<button class="choice-btn${i===0?' active':''}" data-v="${i}" onclick="pickUnitChoice(${i})">${c.label}</button>`).join('')}
      </div></div>
      <div class="input-row"><label>Enter the ${it.basis.toLowerCase()}</label>
      <div class="value-input"><input type="number" min="0" step="any" id="valInput" placeholder="0" value="${lastUnitChoiceVal!=null?lastUnitChoiceVal:''}"><span id="choiceUnitWrap">${unitChoiceUnitControl(it.choices[0])}</span>
      <input type="hidden" id="choiceSelect" value="0"></div></div>
      ${it.note?`<div class="input-row" style="color:var(--ink-dim);font-size:12.5px;line-height:1.5;">${it.note}</div>`:''}
      </div>`;
    inputCard.innerHTML = html; inputCard.style.display='block';
    document.getElementById('valInput').addEventListener('input', computeAndRender);
    return;
  }
  if(it.kind==='dual'){
    html += `<div class="dual-group">
      <div class="dual-group-label">This project type has two things that both count — enter whichever you know (leave the other at 0 if unknown):</div>
      ${it.dims.map((d,i)=>`
        ${i>0?'<div class="dual-connector">and</div>':''}
        <div class="input-row"><label>${d.label}</label>
          <div class="value-input"><input type="number" min="0" step="any" id="dualInput${i}" placeholder="0"><span class="unit-tag">${d.unit}</span></div></div>`).join('')}
      </div>`;
    inputCard.innerHTML = html; inputCard.style.display='block';
    it.dims.forEach((d,i)=>document.getElementById('dualInput'+i).addEventListener('input', computeAndRender));
    return;
  }
  if(it.kind==='bool'){
    html += `<div class="input-row"><label>${it.question}</label>
      <div class="choice-row"><button class="choice-btn" data-v="yes" onclick="pickBool('yes')">Yes</button>
      <button class="choice-btn" data-v="no" onclick="pickBool('no')">No</button></div></div>`;
    inputCard.innerHTML = html; inputCard.style.display='block'; return;
  }
  if(it.kind==='select'){
    html += `<div class="input-row"><label>Select the one that applies</label><div class="choice-row">`;
    it.options.forEach((o,i)=>{ html += `<button class="choice-btn" data-v="${i}" onclick="pickSelect(${i})">${o.label}</button>`; });
    html += `</div></div>`;
    inputCard.innerHTML = html; inputCard.style.display='block'; return;
  }
  if(it.kind==='chem_capacity'){
    html += `<div class="input-row"><label>Does the process use PCL/CCO-listed substances?</label><div class="choice-row">
      <button class="choice-btn" data-v="high" onclick="pickChem('high')">Yes, ≥1.0 MT/year</button>
      <button class="choice-btn" data-v="low" onclick="pickChem('low')">Yes, &lt;1.0 MT/year</button>
      <button class="choice-btn" data-v="none" onclick="pickChem('none')">No</button>
      </div></div><div id="chemCapacityRow"></div>`;
    inputCard.innerHTML = html; inputCard.style.display='block'; return;
  }
  if(it.kind==='chem_capacity_recycle'){
    html += `<div class="input-row"><label>Enter the annual treatment/processing capacity</label>
      <div class="value-input"><input type="number" min="0" step="any" id="valInput" placeholder="0"><span class="unit-tag">${it.unit}</span></div></div>
      <div class="checkbox-row"><input type="checkbox" id="chemInput"><label for="chemInput">Does the process involve the use of chemicals?</label></div>`;
    inputCard.innerHTML = html; inputCard.style.display='block';
    document.getElementById('valInput').addEventListener('input', computeAndRender);
    document.getElementById('chemInput').addEventListener('change', computeAndRender);
    return;
  }
}

let chemChoice = null;
window.pickBool = function(v){
  document.querySelectorAll('#inputCard .choice-btn').forEach(b=>b.classList.toggle('active', b.dataset.v===v));
  currentAnswer = v==='yes' ? activeItem.yes : activeItem.no;
  currentContext = {kind:'bool', v};
  renderResult();
};
window.pickSelect = function(i){
  document.querySelectorAll('#inputCard .choice-btn').forEach(b=>b.classList.toggle('active', +b.dataset.v===i));
  currentAnswer = activeItem.options[i].out;
  currentContext = {kind:'select', i, label:activeItem.options[i].label};
  renderResult();
};
function unitChoiceUnitControl(choice){
  return choice.altUnits
    ? `<select id="choiceUnitSelect" class="unit-select" onchange="computeAndRender()">${choice.altUnits.map((u,i)=>`<option value="${i}">${u.label}</option>`).join('')}</select>`
    : `<span class="unit-tag">${choice.unit}</span>`;
}
let lastUnitChoiceVal = null;
window.pickUnitChoice = function(i){
  document.querySelectorAll('#inputCard .choice-btn').forEach(b=>b.classList.toggle('active', +b.dataset.v===i));
  document.getElementById('choiceSelect').value = i;
  document.getElementById('choiceUnitWrap').innerHTML = unitChoiceUnitControl(activeItem.choices[i]);
  computeAndRender();
};
window.pickChem = function(v){
  document.querySelectorAll('#inputCard .choice-btn').forEach(b=>b.classList.toggle('active', b.dataset.v===v));
  chemChoice = v;
  const row = document.getElementById('chemCapacityRow');
  if(v==='none'){
    row.innerHTML = `<div class="input-row"><label>Enter annual production rate</label>
      <div class="value-input"><input type="number" min="0" step="any" id="valInput" placeholder="0"><span class="unit-tag">MT</span></div></div>`;
    document.getElementById('valInput').addEventListener('input', ()=>{
      const val = parseFloat(document.getElementById('valInput').value);
      if(isNaN(val)||val<0){ resultEl.classList.remove('show'); return; }
      currentAnswer = val>15000 ? activeItem.noChemAbove : activeItem.noChemBelow;
      currentContext = {kind:'chem_capacity_none', val};
      renderResult();
    });
    currentAnswer=null; resultEl.classList.remove('show');
  } else {
    row.innerHTML='';
    currentAnswer = v==='high' ? activeItem.highChem : activeItem.lowChem;
    currentContext = {kind:'chem_capacity', v};
    renderResult();
  }
};

function rank(cat){ return {D:0,'B-IEE':1,'B-EIS':2,'A-EIS':3,C:1}[cat] ?? 0; }

// Shared threshold classifier — used by plain numeric, each dimension of a
// 'dual' entry, and whichever branch is active in a 'unit_choice' entry.
function classify(t, val){
  if(t.a!==Infinity && val>=t.a) return {cat:'A-EIS',label:'Category A (ECP)'};
  if(val>=t.beis) return {cat:'B-EIS',label:'Category B (EIS)'};
  if(val>t.dmax) return {cat:'B-IEE',label:'Category B (IEE Checklist)'};
  return {cat:'D',label:'Category D'};
}
// Most-severe-wins across two independent physical dimensions — this is the
// guidelines' own tie-breaker (Section 4.b.iii: "the more stringent
// requirement shall apply to projects which fall in more than one
// classification"), not just a convenient approximation.
function classifyDual(dims, vals){
  const results = dims.map((d,i)=>({dim:d, val:vals[i], out:classify(d.t, vals[i]||0)}));
  results.sort((a,b)=>rank(b.out.cat)-rank(a.out.cat));
  return results[0]; // {dim, val, out} — the dimension that drove the result
}

function computeAndRender(){
  const it = activeItem;
  if(it.kind==='fixed'){ currentAnswer = it.result; currentContext={kind:'fixed'}; renderResult(); return; }
  if(it.kind==='numeric' || it.kind==='numeric_or'){
    const raw = parseFloat(document.getElementById('valInput').value);
    if(isNaN(raw) || raw<0){ resultEl.classList.remove('show'); situationalWrap.style.display='none'; return; }
    let factor = 1, unitLabel = it.unit;
    if(it.altUnits){
      const sel = document.getElementById('unitSelect');
      const chosen = it.altUnits[+sel.value];
      factor = chosen.factor; unitLabel = chosen.label;
    }
    const val = raw * factor; // converted into the canonical unit the thresholds are written in
    let out = classify(it.t, val);
    let orChecked = false;
    if(it.kind==='numeric_or'){
      orChecked = document.getElementById('orInput').checked;
      if(orChecked && rank(out.cat) < rank(it.orMinResult.cat)) out = it.orMinResult;
    }
    currentAnswer = out; currentContext = {kind:'numeric', val, rawVal:raw, unitLabel, orChecked};
    renderResult(); return;
  }
  if(it.kind==='unit_choice'){
    const sel = document.getElementById('choiceSelect');
    if(!sel){ return; }
    const choice = it.choices[+sel.value];
    const raw = parseFloat(document.getElementById('valInput').value);
    if(isNaN(raw) || raw<0){ resultEl.classList.remove('show'); situationalWrap.style.display='none'; return; }
    lastUnitChoiceVal = raw;
    let factor = 1, unitLabel = choice.unit;
    if(choice.altUnits){
      const usel = document.getElementById('choiceUnitSelect');
      if(usel){ const chosen = choice.altUnits[+usel.value]; factor = chosen.factor; unitLabel = chosen.label; }
    }
    const val = raw * factor;
    const out = classify(choice.t, val);
    currentAnswer = out; currentContext = {kind:'unit_choice', val, rawVal:raw, unitLabel, choice};
    renderResult(); return;
  }
  if(it.kind==='dual'){
    const vals = it.dims.map((d,i)=>{
      const el = document.getElementById('dualInput'+i);
      const v = parseFloat(el.value);
      return isNaN(v) || v<0 ? 0 : v;
    });
    const anyEntered = vals.some(v=>v>0);
    if(!anyEntered){ resultEl.classList.remove('show'); situationalWrap.style.display='none'; return; }
    const winner = classifyDual(it.dims, vals);
    currentAnswer = winner.out;
    currentContext = {kind:'dual', vals, winner};
    renderResult(); return;
  }
  if(it.kind==='chem_capacity_recycle'){
    const val = parseFloat(document.getElementById('valInput').value);
    const chem = document.getElementById('chemInput').checked;
    if(isNaN(val)||val<0){ resultEl.classList.remove('show'); return; }
    let out;
    if(val>=50000 && chem) out={cat:'B-EIS',label:'Category B (EIS)'};
    else if((val>15000 && val<50000) || (val>=50000 && !chem)) out={cat:'B-IEE',label:'Category B (IEE Checklist)'};
    else if(val<=15000 && chem) out={cat:'B-IEE',label:'Category B (IEE Checklist)', note:'Below the EIS threshold, but chemical use is present — defaulting to IEE Checklist. Confirm with EMB.'};
    else out={cat:'D',label:'Category D'};
    currentAnswer = out; currentContext = {kind:'chem_capacity_recycle', val, chem};
    renderResult(); return;
  }
}

/* ================= REASONING TEXT ================= */
function fmt(n){ if(n===Infinity) return '∞'; return n.toLocaleString(undefined,{maximumFractionDigits:3}); }

// Plain-language, complete sentences — written to be read straight to a
// client at the counter, not just an internal note to the examiner.
const DOC_PLAIN = {
  'A-EIS':'a full Environmental Impact Statement',
  'B-EIS':'a full Environmental Impact Statement',
  'B-IEE':'an IEE Checklist Report — a shorter, simplified version of an EIS',
  'C':'a Project Description confirming it qualifies as an enhancement project',
  'D':'no ECC at all — though you may still request a Certificate of Non-Coverage for your records'
};

function buildReason(){
  const it = activeItem, ans = currentAnswer, ctx = currentContext;
  if(!it || !ans) return '';
  const need = DOC_PLAIN[ans.cat];

  if(ctx.kind==='fixed'){
    return `This type of project — <strong>${it.name}</strong> — is always placed in this category by the guidelines, ${it.basis.toLowerCase()}. That means you'll need to prepare ${need}.`;
  }
  if(ctx.kind==='bool'){
    return `Since the answer to "${it.question}" is <strong>${ctx.v==='yes'?'yes':'no'}</strong>, the guidelines place this project in ${ans.label} — that answer alone decides it, no matter how big or small the project is. You'll need to prepare ${need}.`;
  }
  if(ctx.kind==='select'){
    return `Because this is <strong>"${ctx.label}"</strong>, the guidelines place it directly in ${ans.label}. You'll need to prepare ${need}.`;
  }
  if(ctx.kind==='chem_capacity'){
    const map={high:'1.0 MT per year or more',low:'less than 1.0 MT per year'};
    return `Since the process uses PCL/CCO-listed substances at <strong>${map[ctx.v]}</strong>, it falls under ${ans.label} regardless of how much is actually produced. You'll need to prepare ${need}.`;
  }
  if(ctx.kind==='chem_capacity_none'){
    return `No PCL/CCO substances are involved, so this is judged on capacity alone: <strong>${fmt(ctx.val)} MT/year</strong> is ${ctx.val>15000?'above':'at or below'} the 15,000 MT/year cut-off, which places it in ${ans.label}. You'll need to prepare ${need}.`;
  }
  if(ctx.kind==='chem_capacity_recycle'){
    return `At <strong>${fmt(ctx.val)} ${it.unit}</strong>${ctx.chem?', and since chemicals are involved':', with no chemicals involved'}, this falls under ${ans.label}. You'll need to prepare ${need}.`;
  }
  if(ctx.kind==='numeric'){
    const t = it.t; const val = ctx.val;
    let conv = '';
    if(ctx.unitLabel && ctx.unitLabel!==it.unit){
      conv = `You entered ${fmt(ctx.rawVal)} ${ctx.unitLabel}, which is ${fmt(val)} ${it.unit}. `;
    }
    let base;
    if(t.a!==Infinity && val>=t.a) base = `${conv}The declared ${it.basis.toLowerCase()} of <strong>${fmt(val)} ${it.unit}</strong> meets or goes over ${fmt(t.a)} ${it.unit} — the point at which the guidelines automatically treat this as an Environmentally Critical Project.`;
    else if(val>=t.beis) base = `${conv}The declared ${it.basis.toLowerCase()} of <strong>${fmt(val)} ${it.unit}</strong> meets or goes over ${fmt(t.beis)} ${it.unit}${t.a!==Infinity?`, though it stays below the ${fmt(t.a)} ${it.unit} mark that would make it a Category A project`:''}, so it's classified under ${ans.label}.`;
    else if(val>t.dmax) base = `${conv}The declared ${it.basis.toLowerCase()} of <strong>${fmt(val)} ${it.unit}</strong> is more than ${fmt(t.dmax)} ${it.unit} but stays under ${fmt(t.beis)} ${it.unit} — right in the middle range that calls for ${ans.label}.`;
    else base = `${conv}The declared ${it.basis.toLowerCase()} of <strong>${fmt(val)} ${it.unit}</strong> is at or under ${fmt(t.dmax)} ${it.unit} — small enough that the guidelines don't require an ECC at all.`;
    base += ` That means you'll need to prepare ${need}.`;
    if(ctx.orChecked && it.orMinResult && ans.cat===it.orMinResult.cat){
      base += ` This also reflects that "${it.orLabel.replace(/\?$/,'')}" was answered yes, which on its own raises the project to at least ${it.orMinResult.label}.`;
    }
    return base;
  }
  if(ctx.kind==='unit_choice'){
    const t = ctx.choice.t; const val = ctx.val; const u = ctx.choice.unit;
    let conv = '';
    if(ctx.unitLabel && ctx.unitLabel!==u){
      conv = `You entered ${fmt(ctx.rawVal)} ${ctx.unitLabel}, which is ${fmt(val)} ${u}. `;
    }
    let base;
    const whatLabel = ctx.choice.label.toLowerCase();
    if(t.a!==Infinity && val>=t.a) base = `${conv}As "${whatLabel}", <strong>${fmt(val)} ${u}</strong> meets or goes over ${fmt(t.a)} ${u} — the point at which the guidelines automatically treat this as an Environmentally Critical Project.`;
    else if(val>=t.beis) base = `${conv}As "${whatLabel}", <strong>${fmt(val)} ${u}</strong> meets or goes over the ${fmt(t.beis)} ${u} mark${t.a!==Infinity?`, though it stays below the ${fmt(t.a)} ${u} mark that would make it a Category A project`:''}, so it's classified under ${ans.label}.`;
    else if(val>t.dmax) base = `${conv}As "${whatLabel}", <strong>${fmt(val)} ${u}</strong> falls between ${fmt(t.dmax)} and ${fmt(t.beis)} ${u} — the range that calls for ${ans.label}.`;
    else base = `${conv}As "${whatLabel}", <strong>${fmt(val)} ${u}</strong> is at or under ${fmt(t.dmax)} ${u} — small enough that ${t.dmax===0?'it still needs at least an IEE Checklist':'no ECC is required'}.`;
    base += ` That means you'll need to prepare ${need}.`;
    if(it.note) base += ` <em>Note: ${it.note}</em>`;
    return base;
  }
  if(ctx.kind==='dual'){
    const w = ctx.winner;
    const others = it.dims.filter(d=>d!==w.dim).map((d,i)=>{
      const idx = it.dims.indexOf(d);
      return `${fmt(ctx.vals[idx])} ${d.unit} of ${d.label.toLowerCase()}`;
    }).join(' and ');
    return `This project has two things that count separately: ${it.dims.map((d,i)=>`${fmt(ctx.vals[i])} ${d.unit} (${d.label.toLowerCase()})`).join(' and ')}. `
      + `<strong>${w.dim.label}</strong> is the one that decides it here — it lands in ${ans.label} on its own, so that's the category that applies even though the other figure alone might read lower. `
      + `That means you'll need to prepare ${need}.`;
  }
  return '';
}

/* ================= THRESHOLD GAUGE ================= */
// Pure function, deliberately decoupled from the DOM so it can be unit-tested:
// handles every combination of Infinity in {a, beis, dmax} without ever
// dividing by Infinity or producing NaN widths.
function computeGaugeModel(t, val, unit){
  const hasA = t.a !== Infinity;
  const hasEIS = t.beis !== Infinity;
  let cap;
  if(hasA) cap = t.a * 1.15;
  else if(hasEIS) cap = t.beis * 2.2;
  else cap = Math.max(t.dmax * 3, (isFinite(val)?val:0) * 1.3, 10);

  // [start, end, color, tickValueAtEnd, tickLabel]
  const segs = [];
  segs.push([0, t.dmax, '#0b6e4f']);
  if(hasEIS){
    segs.push([t.dmax, t.beis, '#0f8f83']);
    segs.push([t.beis, hasA ? t.a : cap, '#c9860f']);
  } else {
    segs.push([t.dmax, hasA ? t.a : cap, '#0f8f83']);
  }
  if(hasA) segs.push([t.a, cap, '#c0392b']);

  const scale = v => Math.sqrt(Math.max(v,0));
  const maxScaled = scale(cap) || 1;
  const widths = segs.map(([s,e,color])=>({ w: Math.max(0,(scale(e)-scale(s))/maxScaled*100), color }));
  let markerPct = scale(Math.max(val,0)) / maxScaled * 100;
  markerPct = Math.min(Math.max(markerPct,1),99);

  const labels = ['D']; if(hasEIS) labels.push('IEE CHECKLIST','EIS'); else labels.push('IEE CHECKLIST');
  if(hasA) labels.push('ECP (A)');
  const ticks = [fmt(t.dmax)];
  if(hasEIS) ticks.push(fmt(t.beis));
  if(hasA) ticks.push(fmt(t.a));

  return { widths, markerPct, labels, ticks, unit };
}

function renderGaugeBlock(t, val, unit, caption){
  const model = computeGaugeModel(t, val, unit);
  return `<div class="gauge-wrap">
    ${caption?`<div class="gauge-caption">${caption}</div>`:''}
    <div class="gauge-label">${model.labels.map(l=>`<span>${l}</span>`).join('')}</div>
    <div class="gauge">
      ${model.widths.map(s=>`<div class="seg" style="width:${s.w}%;background:${s.color};"></div>`).join('')}
      <div class="gauge-marker" style="left:${model.markerPct}%;"></div>
    </div>
    <div class="gauge-ticks">
      <span>0</span>${model.ticks.map(tk=>`<span>${tk}</span>`).join('')}<span>${model.unit}</span>
    </div>
  </div>`;
}

function buildGauge(){
  const it = activeItem, ctx = currentContext;
  if(!it) return '';
  if(it.kind==='numeric' || it.kind==='numeric_or'){
    const val = isFinite(ctx.val) ? ctx.val : 0;
    return renderGaugeBlock(it.t, val, it.unit, null);
  }
  if(it.kind==='unit_choice'){
    const val = isFinite(ctx.val) ? ctx.val : 0;
    return renderGaugeBlock(ctx.choice.t, val, ctx.choice.unit, null);
  }
  if(it.kind==='dual'){
    return it.dims.map((d,i)=>{
      const val = isFinite(ctx.vals[i]) ? ctx.vals[i] : 0;
      const isWinner = ctx.winner && ctx.winner.dim===d;
      return renderGaugeBlock(d.t, val, d.unit, `${d.label}${isWinner?' — this one decides it':''}`);
    }).join('');
  }
  return '';
}

/* ================= RESULT RENDER ================= */
const CAT_STYLE = {
  'A-EIS':{color:'#c0392b', bg:'#fbeae8', tag:'CATEGORY A · ENVIRONMENTALLY CRITICAL PROJECT'},
  'B-EIS':{color:'#c9860f', bg:'#fbf1de', tag:'CATEGORY B · NON-ECP, EIS REQUIRED'},
  'B-IEE':{color:'#0f8f83', bg:'#e3f5f2', tag:'CATEGORY B · NON-ECP, IEE CHECKLIST'},
  'C':{color:'#1c4f7c', bg:'#eaf1f8', tag:'CATEGORY C · ENVIRONMENTAL ENHANCEMENT'},
  'D':{color:'#0b6e4f', bg:'#e6f4ec', tag:'CATEGORY D · NOT COVERED'}
};
const DOC_TEXT = {
  'A-EIS':'You will need to submit an Environmental Impact Statement (EIS) and apply for an ECC at the EMB Central Office.',
  'B-EIS':'You will need to submit an Environmental Impact Statement (EIS) and apply for an ECC at the EMB Regional Office.',
  'B-IEE':'You will need to submit an IEE Checklist Report and apply for an ECC at the EMB Regional Office.',
  'C':'Submit a Project Description (Annex C) to the EMB Regional Office to confirm this and secure a CNC.',
  'D':'No ECC is required for this project. You may still apply for a Certificate of Non-Coverage (CNC) for your records.'
};

function renderResult(){
  if(!currentAnswer){ resultEl.classList.remove('show'); return; }
  const st = CAT_STYLE[currentAnswer.cat] || CAT_STYLE['D'];
  const forms = FORMS_BY_OUTCOME[currentAnswer.cat] || [];
  resultEl.style.setProperty('--cat-color', st.color);
  resultEl.style.setProperty('--cat-bg', st.bg);
  const reason = buildReason();
  const gauge = buildGauge();
  resultEl.innerHTML = `
    <div class="result-head">
      <div class="result-tag">${st.tag}</div>
      <div class="result-cat">${currentAnswer.label}</div>
      <div class="result-doc">${DOC_TEXT[currentAnswer.cat]}</div>
      ${gauge}
      ${reason ? `<div class="reason-box"><strong>Why:</strong> ${reason}</div>` : ''}
      ${currentAnswer.note ? `<div class="result-note">${currentAnswer.note}</div>` : ''}
      ${activeItem.note ? `<div class="result-note">${activeItem.note}</div>` : ''}
      ${activeItem.amended ? `<div class="result-note amended"><strong>Amended after MC 2014-005:</strong> ${activeItem.amended}</div>` : ''}
      <div class="copy-row"><button class="copy-btn" id="copyBtn" onclick="copyResult()">Copy summary for client</button><span class="copy-status" id="copyStatus"></span></div>
      <div id="powLogSlot"></div>
    </div>
    <div class="tabs">
      <div class="tab active" data-tab="forms" onclick="switchTab('forms')">Forms to Submit</div>
      <div class="tab" data-tab="eca" onclick="switchTab('eca')">ECA Check</div>
      <div class="tab" data-tab="reqs" onclick="switchTab('reqs')">Requirements &amp; Fees</div>
      <div class="tab" data-tab="legal" onclick="switchTab('legal')">Legal Basis</div>
    </div>
    <div class="tab-panel active" id="tab-forms">
      ${forms.map(f=>`<div class="form-link"><a href="${f.url}" target="_blank" rel="noopener">${f.label}</a><span class="go">EMB R7 ↗</span></div>`).join('') || '<div style="color:var(--ink-faint);font-size:13.5px;">No document required for this category.</div>'}
    </div>
    <div class="tab-panel" id="tab-eca">
      <div style="font-size:13px;color:var(--ink-faint);margin-bottom:14px;">
        Being in an Environmentally Critical Area does <strong>not</strong> by itself change a project's category —
        Annex A's thresholds already account for that. What it does affect: if this project is Category A or B,
        its location relative to any of these 12 ECA criteria must be described in the Environmental Management Plan.
      </div>
      <ul class="eca-list">${ECA_CRITERIA.map((c,i)=>`<li><span class="eca-num">${i+1}.</span><span>${c}</span></li>`).join('')}</ul>
    </div>
    <div class="tab-panel" id="tab-reqs">
      ${currentAnswer.cat==='C' ? `<div class="legal-label">Category C screening checklist (documents to check)</div>
      <ul class="eca-list" style="margin-bottom:10px;">
        <li>1. Letter request</li>
        <li>2. CNC Form Part I, with Part II: project description, components list, phases, emissions, cost and duration</li>
        <li>3. Pictures with geographic coordinates</li>
        <li>4. Proof of ownership</li>
        <li>5. Location / vicinity / topographic map</li>
        <li>6. Social Development Program (SDP)</li>
        <li>7. Protected area (NIPAS) geotagging</li>
        <li>8. DENR CENRO certification on land status</li>
        <li>9. E-copy of the documents</li>
      </ul>
      <div class="legal-label">Geotagged photos</div>
      <div style="font-size:13.5px;line-height:1.6;margin-bottom:10px;">At least 4 photos with correct coordinates and captions: 1 at the start, at least 2 in the middle (spaced apart) and 1 at the end. Photos with the same coordinates count as one location. Check that the photo coverage matches the project length and the actual site.</div>
      <div class="legal-label">Common remarks to watch for (drainage, road, flood control)</div>
      <ul class="eca-list" style="margin-bottom:14px;">
        <li>Title does not match the actual location (street name vs. national road name): ask for a map showing the street is part of the named road.</li>
        <li>Road projects: ask for a statement that road improvement is not part of the project.</li>
        <li>Drainage: number and locations of culverts, catchment characteristics, outfall locations, integration with existing drainage, and the hydrologic and hydraulic basis.</li>
        <li>CENRO certification should cover the entire project length.</li>
        <li>Avoid absolute claims such as "(0) households affected." Use design-standard wording, e.g. protected against a 50-year return period flood, with the hydrological study or rainfall data source cited.</li>
        <li>Send lacking requirements to r7records@emb.gov.ph.</li>
      </ul>` : ''}
      <div class="legal-label">IEE Checklist ECC application (Region VII)</div>
      <ul class="eca-list" style="margin-bottom:14px;">
        <li>IEE Checklist Report; Project Description; PEMAPS</li>
        <li>Geotagged photographs (taken within the last 30 days)</li>
        <li>Environmental Management Plan</li>
        <li>Site development / project / plant layout, signed by registered professionals</li>
        <li>Sworn Statement of Accountability</li>
        <li>Zoning certificate (LGU land-use compatibility); CENRO certification</li>
        <li>Proof of authority (title, lease or deed); bank receipt for the application fee</li>
        <li>When applicable: PAMB clearance and endorsement (protected areas); Area Clearance (reclamation); tenurial instrument (public land)</li>
      </ul>
      <div class="legal-label">CNC (Category D, optional)</div>
      <ul class="eca-list" style="margin-bottom:14px;">
        <li>Sworn Statement of Accountability; site development / plant layout</li>
        <li>Geotagged photographs (within 15 days per MC 2020-26); government ID; bank receipt</li>
        <li>No LGU endorsement or locational clearance needed (MC 2004-001)</li>
      </ul>
      <div class="legal-label">Fees (DAO 2016-28)</div>
      <div style="font-size:13.5px;margin-bottom:10px;">New ECC PHP 5,070 &middot; ECC amendment PHP 2,030 &middot; CNC PHP 1,240</div>
      <div class="legal-label" style="margin-top:16px;">How to apply (${currentAnswer.cat==='D' ? 'CNC' : 'ECC'})</div>
      <ul class="eca-list" style="margin-bottom:14px;">
        <li><strong>Online:</strong> r7.emb.gov.ph, Home, scroll down, Online Services, then ${currentAnswer.cat==='D' ? 'CNC' : 'ECC'}.</li>
        <li><strong>Requirements and guide (PDF):</strong> ${currentAnswer.cat==='D' ? '<a href="https://r7.emb.gov.ph/wp-content/uploads/2025/04/CNC-ONLINE-REQUIREMENTS-V2025.pdf" target="_blank" rel="noopener">CNC requirements</a> &middot; <a href="https://r7.emb.gov.ph/wp-content/uploads/2020/07/2-CNC-Online-2020-Updated-User-Guide.pdf" target="_blank" rel="noopener">CNC guide</a>' : '<a href="https://r7.emb.gov.ph/wp-content/uploads/2026/01/ECC_Application_Requirements.pdf" target="_blank" rel="noopener">ECC requirements</a> &middot; <a href="https://r7.emb.gov.ph/wp-content/uploads/2026/01/ECC_Application_Guide.pdf" target="_blank" rel="noopener">ECC guide</a>'}</li>
        <li><strong>Forms and guide:</strong> r7.emb.gov.ph, Downloadables, EIA: ${currentAnswer.cat==='D' ? 'Attachment 1 &amp; 2 (CNC)' : 'Attachment 3 &amp; 4 (ECC); Attachment 8 for a minor amendment'}.</li>
        <li><strong>Follow-up on an application:</strong> keep the IIS Number. For ECC Online or CNC Online, search by proponent or project name.</li>
      </ul>
      <div class="legal-label">Who to call (Clearance and Permitting Division)</div>
      <div style="font-size:13.5px;line-height:1.7;margin-bottom:10px;">
        EIA (ECC / CNC): Local 119 &middot; r7eiapermitting@emb.gov.ph &middot; 0992 885 8858<br>
        Compliance and Monitoring: Local 124 &middot; ECC with a violation: Legal Section<br>
        Documents and follow-ups: r7records@emb.gov.ph
      </div>
      <div style="font-size:12px;color:var(--ink-faint);">Source: EMB R7 PD 1586/PEIS training deck. Fees and lists change; confirm with the Region VII office.</div>
    </div>
    <div class="tab-panel" id="tab-legal">
      <div class="legal-line"><div class="legal-label">Source</div>${activeItem.legalSource || `EMB Memorandum Circular 005, s. 2014 — Annex A, Item ${activeItem.code}`}</div>
      <div class="legal-line"><div class="legal-label">Parameter basis</div>${activeItem.basis}</div>
      ${activeItem.aliases ? `<div class="legal-line"><div class="legal-label">Also known as / matched on</div>${activeItem.aliases}</div>` : ''}
    </div>
  `;
  resultEl.classList.add('show');
  if(window.powRenderForm) powRenderForm();
  situationalWrap.style.display='block';
  renderSituational();
}

function stripHtml(h){ const d=document.createElement('div'); d.innerHTML=h; return (d.textContent||'').replace(/\s+/g,' ').trim(); }
window.copyResult = function(){
  if(!currentAnswer || !activeItem) return;
  const parts = [
    'Project type: '+activeItem.name+(activeItem.code?' (Annex A item '+activeItem.code+')':''),
    'Result: '+currentAnswer.label,
    'Requirement: '+stripHtml(DOC_TEXT[currentAnswer.cat]||''),
  ];
  const why = stripHtml(buildReason()||'');
  if(why) parts.push('Basis: '+why);
  parts.push('Reference: EMB Memorandum Circular 005, s. 2014, Annex A. Screening aid only; final determination rests with EMB Region VII.');
  const text = parts.join('\n');
  const status = document.getElementById('copyStatus');
  const done = ok => { if(status){ status.textContent = ok?'Copied':'Press Ctrl+C to copy'; setTimeout(()=>{status.textContent='';},2500); } };
  const fallback = () => {
    try{
      const ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0';
      document.body.appendChild(ta); ta.select(); const ok=document.execCommand('copy'); document.body.removeChild(ta); done(ok);
    }catch(e){ done(false); }
  };
  if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(text).then(()=>done(true), fallback); }
  else fallback();
};

window.switchTab = function(name){
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active', t.dataset.tab===name));
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.toggle('active', p.id==='tab-'+name));
};

/* ================= SITUATIONAL PANEL ================= */
function toggleSituational(){ sitBody.classList.toggle('show'); }
const SITUATIONS = [
  {key:'new', label:'New project'},
  {key:'expand', label:'Expansion / modification of an existing project'},
  {key:'pre1982', label:'Operating since before 1982, unexpanded'},
  {key:'enhance', label:'Environmental enhancement / pollution control project'},
  {key:'resumed', label:'Resuming after stopping for more than 5 years'},
  {key:'validity', label:'ECC validity, amendment & penalties'},
  {key:'colocated', label:'Co-located / multiple facilities, same proponent, contiguous area'}
];
function renderSituational(){
  sitBody.innerHTML = `<div class="sit-options">${SITUATIONS.map(s=>`<button class="sit-opt" data-k="${s.key}" onclick="pickSituation('${s.key}')">${s.label}</button>`).join('')}</div><div id="sitDetail"></div>`;
}
window.pickSituation = function(key){
  document.querySelectorAll('.sit-opt').forEach(b=>b.classList.toggle('active', b.dataset.k===key));
  const d = document.getElementById('sitDetail');
  if(key==='new'){
    d.innerHTML = `<div class="sit-detail">The result above already applies — no adjustment needed for a new project.</div>`;
  } else if(key==='expand'){
    d.innerHTML = `<div class="sit-detail"><h4>Expansion / modification (Annex B)</h4>
      Re-run the search above using the <strong>total</strong> capacity (existing + proposed), not just the new portion — Annex A thresholds are applied against the combined total.
      <ul class="cond-list" style="margin-top:10px;">
        <li>If the total stays within the same category as the original ECC → <strong>Minor ECC Amendment</strong> (letter request describing the additional activities).</li>
        <li>If the total pushes into a higher category, or the expansion is outside the area described in the original EIA report → <strong>Major ECC Amendment</strong>, requiring an EPRMP.</li>
        <li>If a Category B project's total capacity now qualifies as Category A → the application moves to the EMB Central Office.</li>
      </ul></div>`;
  } else if(key==='pre1982'){
    d.innerHTML = `<div class="sit-detail"><h4>Pre-1982 non-coverage — all 4 must be true</h4>
      <ul class="cond-list">
        <li><input type="checkbox" onchange="checkPre1982()"><span>No expansion in production capacity or area since 1982</span></li>
        <li><input type="checkbox" onchange="checkPre1982()"><span>Has not stopped operating for more than 2 continuous years since 1982</span></li>
        <li><input type="checkbox" onchange="checkPre1982()"><span>Technology / production method / process has not been modified</span></li>
        <li><input type="checkbox" onchange="checkPre1982()"><span>Existing facilities/structures have not been changed, rehabilitated, or added to</span></li>
      </ul>
      <div id="pre1982Result"></div></div>`;
  } else if(key==='validity'){
    d.innerHTML = `<div class="sit-detail"><h4>ECC validity, amendments and penalties</h4>
      <ul class="cond-list">
        <li><span><strong>No expiry,</strong> except quarry ECCs and ECCs inactive for 5 years.</span></li>
        <li><span><strong>Not implemented within 5 years</strong> = ECC invalid (MC 2020-31). Implementation means site development or clearing has begun; CSR/SDP activities alone do not count.</span></li>
        <li><span><strong>Major amendment:</strong> expansion, added components, change of process/technology, capacity increase.</span></li>
        <li><span><strong>Minor amendment</strong> (MC 2021-05): typographical corrections, change of name/ownership, decrease in area or capacity, layout change without a process change.</span></li>
        <li><span><strong>Penalties:</strong> up to PHP 50,000 for operating without an ECC, and per violation of ECC conditions.</span></li>
        <li><span>CMR is submitted semi-annually. An ECC is <strong>location-specific</strong> and is <strong>not</strong> an LGU permit (DMC 2008-08).</span></li>
        <li><span>Appeal ladder (DAO 2003-30): Regional Director, then EMB Director, then DENR Secretary, then Office of the President; 15 days each.</span></li>
      </ul>
      <div style="font-size:12px;color:var(--ink-faint);margin-top:8px;">Source: EMB R7 PD 1586/PEIS training deck. Confirm current wording in the cited issuances.</div></div>`;
  } else if(key==='enhance'){
    d.innerHTML = `<div class="sit-detail"><h4>Category C — Environmental Enhancement</h4>
      Projects intended to directly enhance the environment or directly address an existing environmental problem may qualify as <strong>Category C</strong>, regardless of the Annex A result above. Submit a Project Description (Annex C, Parts I &amp; II) to the EMB Regional Office to confirm — EMB may instead classify it as Category A or B if it doesn't qualify.</div>`;
  } else if(key==='resumed'){
    d.innerHTML = `<div class="sit-detail"><h4>Resuming after &gt;5 years stopped — all 5 must be true to avoid a new ECC</h4>
      <ul class="cond-list">
        <li><input type="checkbox" onchange="checkResumed()"><span>CMR/CMVR was continuously submitted, or suspension was officially approved by EMB</span></li>
        <li><input type="checkbox" onchange="checkResumed()"><span>No request for relief or cancellation of the ECC was approved</span></li>
        <li><input type="checkbox" onchange="checkResumed()"><span>Resumption will not involve any expansion in capacity or area</span></li>
        <li><input type="checkbox" onchange="checkResumed()"><span>Resumption will not involve any change in technology or process</span></li>
        <li><input type="checkbox" onchange="checkResumed()"><span>No change in ownership or corporate dissolution</span></li>
      </ul>
      <div id="resumedResult"></div></div>`;
  } else if(key==='colocated'){
    d.innerHTML = `<div class="sit-detail"><h4>Co-located / contiguous multi-facility development</h4>
      Category is based on <strong>all</strong> prospective locators combined:
      <ul class="cond-list">
        <li>→ <strong>Category A</strong> if at least one locator is an ECP, or the total land area is 100 hectares or more.</li>
        <li>→ <strong>Category B</strong> if every locator is non-ECP and the total area is under 100 hectares.</li>
      </ul>
      Requires a Programmatic EIS (new) or Programmatic EPRMP (existing, expanding) instead of individual project-level documents, reviewed at the EMB Central Office (if Category A) or Regional Office (if Category B).</div>`;
  }
};
function checkPre1982(){
  const boxes = document.querySelectorAll('#sitDetail .cond-list input');
  const all = [...boxes].every(b=>b.checked); const any = [...boxes].some(b=>b.checked);
  const r = document.getElementById('pre1982Result');
  if(!any){ r.innerHTML=''; return; }
  r.innerHTML = all
    ? `<div class="cond-result" style="background:rgba(47,158,104,.15);color:#5cc98f;">✓ Qualifies as Category D (not covered) — may still secure a CNC with proof of pre-1982 implementation.</div>`
    : `<div class="cond-result" style="background:rgba(245,166,35,.15);color:#f5a623;">✗ Does not qualify for pre-1982 non-coverage — screen normally using the Annex A result above.</div>`;
}
function checkResumed(){
  const boxes = document.querySelectorAll('#sitDetail .cond-list input');
  const all = [...boxes].every(b=>b.checked); const any = [...boxes].some(b=>b.checked);
  const r = document.getElementById('resumedResult');
  if(!any){ r.innerHTML=''; return; }
  r.innerHTML = all
    ? `<div class="cond-result" style="background:rgba(47,158,104,.15);color:#5cc98f;">✓ No new ECC required to resume operations.</div>`
    : `<div class="cond-result" style="background:rgba(245,166,35,.15);color:#f5a623;">✗ A new ECC application is required before resuming — screen normally using the Annex A result above.</div>`;
}


/* welcome panel: examples + show/hide */
window.tryEx=function(q){var i=document.getElementById('searchInput')||searchInput;i.value=q;setTimeout(function(){i.focus();i.dispatchEvent(new Event('input',{bubbles:true}));},30);};
(function(){var ic=document.getElementById('inputCard'),w=document.getElementById('welcome');if(!ic||!w||!window.MutationObserver)return;
function sync(){w.style.display=(ic.style.display==='none'||!ic.style.display)?'block':'none';}
new MutationObserver(sync).observe(ic,{attributes:true,attributeFilter:['style']});sync();})();
