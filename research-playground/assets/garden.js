import {sum,WORDS,initialCounts,publicationLaw,resample,rng,entropy,gardenExperiment} from './math.js';
import {$,$$,html,announce,hint,stageHeader,goFocus,markComplete,downloadJSON} from './ui.js';
const codes=['R','L','W','S','M','C','F','X'];
const root=$('#game'),colors=['#9cd9e6','#f5dfa0','#b7bde8','#b1cdc1','#73bc9a','#cee88d','#edb794','#dcade0'];
const modeNames={neutral:'Copy freely',favour:'Favour one word',archive:'Open the archive'};
let stage=0,size=64,seed=42,target=7,mode='neutral',history=[],season=0,view=0,prediction=null;
let ensemble=null,busy=false,worker=null,request=0,random=rng(seed),driftSession=null,rescueSession=null,rescueSource=null;
function initialHistory(){const counts=initialCounts(size);return [{counts,tokens:counts.flatMap((n,i)=>Array(n).fill(i)),mode:'initial'}];}
function resetRuns(){cancelWorker();stage=0;mode='neutral';history=initialHistory();season=0;view=0;random=rng(seed);prediction=null;ensemble=null;driftSession=null;rescueSession=null;rescueSource=null;}
function cancelWorker(){request++;worker?.terminate();worker=null;busy=false;}
function saveCurrent(){if(stage===1)return;const session={history:structuredClone(history),season,view,mode};if(stage===0)driftSession=session;else rescueSession=session;}
function restore(session,baseSeed){history=structuredClone(session.history);season=session.season;view=session.view;mode=session.mode;random=rng(baseSeed);for(let i=0;i<size*season;i++)random();}
function goStage(next){
 if(next===stage)return;
 saveCurrent();cancelWorker();stage=next;
 if(stage===0){if(driftSession)restore(driftSession,seed);else{history=initialHistory();season=0;view=0;mode='neutral';random=rng(seed);}}
 if(stage===2){
  if(rescueSession)restore(rescueSession,(seed^0x51eeda)>>>0);
  else{rescueSource=gardenExperiment({seed,size,generations:30});history=[{...structuredClone(rescueSource.at(-1)),mode:'rescue start'}];season=0;view=0;mode='favour';random=rng(seed^0x51eeda);if(history[0].counts[target]>0){const missing=history[0].counts.findIndex(c=>c===0);if(missing>=0)target=missing;}}
 }
 render();goFocus();if(stage===1&&!ensemble)runComparison();
}
function grow(steps){
 for(let i=0;i<steps&&season<30;i++){history.push({...resample(history.at(-1).counts,random,mode,target,initialCounts(size)),mode,target});season++;}
 view=season;render();announce(`Season ${season}. Rule: ${modeNames[mode]}. ${history.at(-1).counts.filter(c=>c>0).length} words remain; ${WORDS[target]} has ${history.at(-1).counts[target]} copies.`);
}
resetRuns();
function chart(){const width=540,height=160,left=26,right=18,top=12,bottom=28,max=8;const coords=history.map((s,t)=>`${left+t/30*(width-left-right)},${top+(max-s.counts.filter(v=>v>0).length)/max*(height-top-bottom)}`).join(' ');return `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Distinct words over ${season} generations: ${history.map(h=>h.counts.filter(c=>c>0).length).join(', ')}"><line x1="${left}" y1="${height-bottom}" x2="${width-right}" y2="${height-bottom}"/><line x1="${left}" y1="${top}" x2="${width-right}" y2="${top}" stroke-dasharray="3 5"/><text x="6" y="${top+5}">8</text><text x="6" y="${height-bottom+5}">0</text><text x="${left}" y="${height-6}">0</text><text x="${width-right-15}" y="${height-6}">30</text><text x="${width/2-23}" y="${height-6}">season</text><polyline points="${coords}"/><line x1="${left+view/30*(width-left-right)}" y1="${top}" x2="${left+view/30*(width-left-right)}" y2="${height-bottom}" style="stroke:var(--accent);stroke-dasharray:4 4"/></svg>`;}
function bed(){const now=history[view],counts=now.counts;return `<section class="panel dark-panel"><div class="panel-pad" style="padding-bottom:0"><div class="panel-title"><h3>The public text garden</h3><span class="tag">Season ${view} · ${size} texts</span></div><p class="small-text muted" style="margin:0">Each tile is one text. Its letter names the changing word.</p></div><div class="garden-bed" aria-hidden="true">${now.tokens.map(i=>`<span class="seed-cell ${i!==target?'dim':''}" style="--color:${colors[i]}">${codes[i]}</span>`).join('')}</div><div class="garden-key" aria-label="Word counts. Choose a word to follow.">${WORDS.map((w,i)=>`<button id="word-${i}" data-word="${i}" aria-pressed="${target===i}" aria-label="Follow ${w}, ${counts[i]} copies" style="--color:${colors[i]}"><span class="word-code">${codes[i]}</span><span>${w}</span><strong>${counts[i]}</strong></button>`).join('')}</div><div class="specimens"><p class="eyebrow" style="font-family:inherit;font-size:.75rem;color:#abc3ad;margin-bottom:8px">Actual texts · first four positions</p>${now.tokens.slice(0,4).map(i=>`<p>The garden holds <em>${WORDS[i]}</em>.</p>`).join('')}</div></section>`;}
function stats(){const counts=history[view].counts,p=counts[target]/size,q=publicationLaw(counts,mode,target,initialCounts(size))[target];return `<section class="panel panel-pad"><div class="garden-stats"><div><strong>${counts.filter(c=>c>0).length} <span>/ 8</span></strong><span>distinct words</span></div><div><strong>${counts[target]}</strong><span>${WORDS[target]} copies</span></div><div><strong>${entropy(counts).toFixed(2)}</strong><span>word entropy, bits</span></div></div>${chart()}<label class="season-range" for="season">Inspect <input id="season" type="range" min="0" max="${season}" value="${view}" aria-label="Inspect season"><span>${view}/${season}</span></label><details><summary>The next-generation odds</summary><p>From the displayed season, under <strong>${modeNames[mode]}</strong>, each new text uses ${WORDS[target]} with probability ${(q*100).toFixed(2)}%. The exact chance of zero copies in a fresh batch of ${size} is ${(100*(1-q)**size).toFixed(2)}%.</p><p class="small-text">Neutral copying uses its current frequency, ${(p*100).toFixed(2)}%. Entropy measures the spread of these eight word frequencies; it does not measure text quality or depth. The chart shows distinct words, not entropy.</p></details></section>`;}
function ruleControls(){return `<div class="rule-options">${Object.entries(modeNames).map(([key,label])=>`<button id="mode-${key}" data-mode="${key}" class="rule-option" aria-pressed="${mode===key}"><strong>${mode===key?'✓ ':''}${label}${key==='favour'?' · '+WORDS[target]:''}</strong><span>${key==='neutral'?'No preference: use current word frequencies.':key==='favour'?'Give this word triple weight, then normalise.':'Mix 85% current frequencies with 15% original frequencies.'}</span></button>`).join('')}</div><p class="active-rule"><strong>Active for the next generation:</strong> ${modeNames[mode]}${mode==='favour'?' · '+WORDS[target]:''}. Changing a rule preserves the history already grown.</p>`;}
function phaseNavigation(){return `<nav class="phase-nav" aria-label="Choose a garden chapter">${['Watch drift','Compare rules','Try a rescue'].map((label,i)=>`<button id="phase-${i}" data-phase="${i}" ${stage===i?'aria-current="step"':''}><span>${i+1}</span>${label}</button>`).join('')}</nav><p class="small-text muted">All three chapters are open. Select a chapter at any time; returning keeps your garden.</p>`;}
function render(){
 let content='';
 if(stage===1){
  if(ensemble&&(ensemble.target!==target||ensemble.size!==size||ensemble.seed!==seed))ensemble=null;
  content=stageHeader('02 / Compare rules','One garden is a story. Many are evidence.','Each rule starts from the same original word counts and runs for 30 seasons. Compare a word’s survival and the diversity left around it.')+`
  <section class="panel panel-pad"><div class="row spread"><div><h3>Three rules, 200 gardens each</h3><p class="small-text muted">Population ${size} · base seed ${seed} · matched seeds across rules</p></div><label for="compare-word">Follow a word<select id="compare-word">${WORDS.map((w,i)=>`<option value="${i}" ${target===i?'selected':''}>${w}</option>`).join('')}</select></label></div>
  <div class="actions"><button class="primary" id="compare" ${busy?'disabled':''}>${busy?'Computing 600 gardens…':ensemble?'Recompute comparison':'Compute comparison →'}</button><button data-phase="0">Change seed or population</button></div>
  ${ensemble?`<div class="comparison-grid">${ensemble.result.map(r=>`<article class="comparison-card"><p class="eyebrow">${modeNames[r.mode]}</p><strong>${r.survivors} / ${ensemble.replicates}</strong><p>gardens still contain ${WORDS[target]}</p><p class="small-text muted">Mean distinct words: ${r.meanTypes.toFixed(2)} / 8<br>Mean ${WORDS[target]} copies: ${r.meanTarget.toFixed(2)} / ${size}<br>95% Wilson interval: ${(r.interval[0]*100).toFixed(1)}–${(r.interval[1]*100).toFixed(1)}%</p></article>`).join('')}</div><div class="feedback"><strong>A preference is not a seed bank.</strong><p>Favouring a word can help it survive while crowding out others. Once its count is zero, triple zero is still zero. The archive can supply a word that has disappeared.</p></div>`:`<p class="muted">${busy?'Each population is being computed in the browser.':'Compute the comparison to see the three outcomes.'}</p>`}
  <p class="small-text muted">Survival fractions are computed Monte Carlo estimates, not exact probabilities. Wilson intervals describe binomial sampling uncertainty under ideal independent runs. These are toy populations, not LLM measurements.</p>
  <div class="actions"><button class="primary" id="next-stage" data-phase="2">Next: try a rescue →</button><button data-phase="0">Back to your garden</button></div></section>
  ${hint('Compare mean distinct words as well as your chosen word’s survival. A rule can protect one word and still reduce diversity.')}`;
 }else{
  const now=history.at(-1).counts,extinct=now[target]===0;
  const returned=stage===2&&history[0].counts[target]===0&&history.slice(1).some(h=>h.counts[target]>0);
  content=stage===0?stageHeader('01 / Watch drift','What will the garden forget?',`Every season, ${size} short texts inherit the previous season’s word frequencies. Start with “Copy freely” to see drift; the other rules are available below. Follow foxglove, which begins rare.`):stageHeader('03 / Try a rescue','Can a forgotten word return?',`This chapter begins at season 30 of a neutral run with seed ${seed} and ${size} texts. Favour a word with zero copies, then open the archive. These are 30 additional rescue seasons.`);
  content+=`<div class="workspace"><div class="stack">${bed()}${stats()}</div><section class="panel panel-pad"><h3>${stage===0?'Grow your garden':'Choose a rescue rule'}</h3>
  ${stage===0?`<form id="settings" novalidate><div class="garden-controls"><label for="seed">Random seed<input id="seed" type="number" min="0" max="4294967295" step="1" value="${seed}" inputmode="numeric"></label><label for="size">Population<select id="size">${[32,64,256].map(n=>`<option ${size===n?'selected':''}>${n}</option>`).join('')}</select></label></div><div class="actions"><button id="apply-settings" type="submit">Apply & restart</button></div><p id="settings-error" role="alert" class="feedback warn" hidden></p><p class="small-text muted">Current experiment: seed ${seed}, ${size} texts. Applying settings restarts all three chapters.</p></form>${season===0?`<p><strong>Your prediction after 30 seasons</strong></p><div class="rule-options">${[['all','All eight words remain'],['some','Some words disappear']].map(([k,label])=>`<button id="prediction-${k}" data-prediction="${k}" aria-pressed="${prediction===k}">${label}</button>`).join('')}</div>`:''}`:`<p class="small-text">Neutral starting counts: ${history[0].counts.join(' · ')}. Your first chapter is saved separately.</p>`}
  <div class="actions"><button class="primary" id="grow-one" ${season>=30?'disabled':''}>Grow 1 season</button><button id="grow-ten" ${season>=30?'disabled':''}>Grow 10 →</button></div>
  <p class="small-text muted">${season} of 30 ${stage===2?'rescue ':''}seasons grown. Buttons continue from the latest season, even while inspecting an earlier one.</p>
  ${season>0?`<div class="feedback ${extinct?'warn':''}"><strong>${WORDS[target]} ${extinct?'has vanished.':'has '+now[target]+' copies.'}</strong><p>${extinct?mode==='archive'?'The archive gives it a positive chance to return; a particular generation may still miss it.':'Copying and favouring cannot recreate an absent word: its probability is zero.':`The garden has ${now.filter(c=>c>0).length} distinct words. This is one seeded trajectory.`}</p></div>`:''}
  <h3 class="section-gap">Publication rule</h3>${ruleControls()}
  ${stage===0?hint('Under neutral copying, one copy in 64 has about a 36.5% chance of being missed next season. “Unbiased” describes expected frequency, not a promise to keep every word.'):hint('Choose a zero-count word in the key. Favour it and grow: zero stays zero. Then select Open the archive and grow again.')}
  ${stage===0?`<div class="chapter-next"><strong>${season===30?`${now.filter(c=>c>0).length} of 8 words remain.`:'Ready to compare?'}</strong><p>${season===30?'This is one run. See what changes over many independent gardens.':'You can keep growing or move straight to the comparison.'}</p><button class="primary" id="next-stage" data-phase="1">Next: compare rules →</button></div>`:''}
  ${stage===2&&(returned||season===30)?`<div class="ending"><p class="eyebrow">Journey complete</p><h3>${returned?'A new source changes what is possible.':'The publication rule matters.'}</h3><p>${returned?`${WORDS[target]} returned during this run and now has ${now[target]} copies. A return need not be permanent.`:'This rescue run has reached season 30.'} Word diversity does not measure correctness or deeper text structure.</p><button id="reset-rescue">Restart this rescue</button><a class="primary-link" href="#advanced">Optional: descriptive and normative publishing ↓</a></div>`:''}
  </section></div>`;
  if(stage===2&&(returned||season===30))markComplete('garden');
 }
 html(root,phaseNavigation()+content+`<div class="actions"><button class="quiet" id="restart">Restart the journey</button><button class="quiet" id="export">Export this experiment</button></div>`);
 $$('[data-phase]',root).forEach(b=>b.onclick=()=>goStage(+b.dataset.phase));
 $$('[data-word]',root).forEach(b=>b.onclick=()=>{target=+b.dataset.word;ensemble=null;render();announce(`Following ${WORDS[target]}. Favouring applies to this word in future generations.`);});
 $$('[data-prediction]',root).forEach(b=>b.onclick=()=>{prediction=b.dataset.prediction;render();});
 $$('[data-mode]',root).forEach(b=>b.onclick=()=>{if(stage===0&&!commitSettings())return;mode=b.dataset.mode;render();announce(`${modeNames[mode]} is active for the next generation. History is preserved.`);});
 if($('#settings'))$('#settings').onsubmit=e=>{e.preventDefault();if(commitSettings()){resetRuns();render();announce(`Restarted with seed ${seed}, population ${size}.`);}};
 if($('#grow-one'))$('#grow-one').onclick=()=>{if(commitSettings())grow(1);};
 if($('#grow-ten'))$('#grow-ten').onclick=()=>{if(commitSettings())grow(10);};
 if($('#season'))$('#season').oninput=e=>{view=+e.target.value;render();};
 if($('#compare'))$('#compare').onclick=runComparison;
 if($('#compare-word'))$('#compare-word').onchange=e=>{target=+e.target.value;ensemble=null;cancelWorker();render();};
 if($('#reset-rescue'))$('#reset-rescue').onclick=()=>{rescueSession=null;stage=1;goStage(2);};
 $('#restart').onclick=()=>{seed=42;size=64;target=7;resetRuns();render();goFocus();};
 $('#export').onclick=()=>{saveCurrent();downloadJSON(`copy-garden-seed-${seed}.json`,{model:'Unigram full replacement. Favour=3x target weight; archive=.85 current + .15 original.',seed,rescueSeed:(seed^0x51eeda)>>>0,size,target:WORDS[target],stage,mode,initial:initialCounts(size),history:stage===1?null:history,originalHistory:driftSession?.history??null,rescueHistory:rescueSession?.history??null,rescueSourceHistory:rescueSource,ensemble});};
}
function commitSettings(){
 if(stage!==0)return true;
 const field=$('#seed'),value=Number(field.value),nextSize=Number($('#size').value);
 if(field.value.trim()===''||!Number.isInteger(value)||value<0||value>4294967295){field.setAttribute('aria-invalid','true');const error=$('#settings-error');error.hidden=false;error.textContent='Enter a whole-number seed from 0 to 4294967295. The current experiment has not changed.';announce(error.textContent);return false;}
 field.removeAttribute('aria-invalid');$('#settings-error').hidden=true;
 if(value!==seed||nextSize!==size){seed=value;size=nextSize;resetRuns();}
 return true;
}
function runComparison(){
 cancelWorker();busy=true;ensemble=null;render();const id=++request;
 worker=new Worker(new URL('./garden-worker.js',import.meta.url),{type:'module'});
 worker.onmessage=({data})=>{if(data.id!==request)return;ensemble=data;busy=false;worker.terminate();worker=null;render();announce('Comparison complete: 200 runs per rule. Next: try a rescue.');};
 worker.onerror=()=>{busy=false;worker?.terminate();worker=null;render();announce('The comparison could not start. Reload and try again.');};
 worker.postMessage({id,seed,size,target,replicates:200});
}
render();
