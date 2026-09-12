export const $ = (s, root=document) => root.querySelector(s);
export const $$ = (s, root=document) => [...root.querySelectorAll(s)];
export function html(el, markup) {
  const focus = document.activeElement?.id;
  const openSummaries = new Set([...el.querySelectorAll('details[open] > summary')].map(s=>s.textContent));
  el.innerHTML=markup;
  if(document.body.matches('.signal,.garden')){
    const workspace=el.querySelector('.workspace');
    if(workspace)workspace.lastElementChild.dataset.controls='true';
    arrangeControls();
  }
  el.querySelectorAll('details > summary').forEach(s=>{if(openSummaries.has(s.textContent))s.parentElement.open=true;});
  if(focus)document.getElementById(focus)?.focus({preventScroll:true});
}
// Keep the visual, reading and keyboard order aligned on a phone.
const phoneQuery=typeof matchMedia==='function'?matchMedia('(max-width: 760px)'):null;
function arrangeControls(){
  document.querySelectorAll('.workspace > [data-controls]').forEach(controls=>{
    const workspace=controls.parentElement;
    if(phoneQuery?.matches)workspace.prepend(controls);else workspace.append(controls);
  });
}
phoneQuery?.addEventListener('change',arrangeControls);
export function announce(text){$('#announcer').textContent=text;}
export function goFocus(selector='#stage-title'){const heading=$(selector);heading?.focus({preventScroll:true});heading?.scrollIntoView({block:'start',behavior:'instant'});}
export function markComplete(key){try{localStorage.setItem('riis-play-'+key,'done');}catch{}}
export function progress(labels,stage){return '<ol class="progress" aria-label="Your journey">'+labels.map((x,i)=>`<li class="${i===stage?'current':i<stage?'done':''}" ${i===stage?'aria-current="step"':''}><span>${i<stage?'✓':i+1}</span>${x}</li>`).join('')+'</ol>';}
export function hint(text){return `<details class="hint"><summary>A small hint</summary><p>${text}</p></details>`;}
export function stageHeader(kicker,title,text){return `<div class="stage-head"><p class="eyebrow">${kicker}</p><h2 id="stage-title" tabindex="-1">${title}</h2><p>${text}</p></div>`;}
export const names=['A','B','C','D'];
export function downloadJSON(name,value){
  const record=JSON.stringify(value,null,2);
  const url=URL.createObjectURL(new Blob([record],{type:'application/json'}));
  const dialog=document.createElement('dialog');
  dialog.className='export-dialog';
  dialog.setAttribute('aria-labelledby','export-title');
  dialog.innerHTML='<form method="dialog"><h2 id="export-title">Your experiment record</h2><p>Download the JSON, or select it and copy it. The record includes the settings and every computed generation.</p><label for="export-record">Reproducible JSON</label><textarea id="export-record" readonly rows="10" spellcheck="false"></textarea><div class="actions"><a class="primary-link" id="download-record">Download JSON</a><button id="select-record" type="button">Select JSON</button><button value="close">Close</button></div></form>';
  dialog.querySelector('textarea').value=record;
  const link=dialog.querySelector('#download-record');link.href=url;link.download=name;
  dialog.querySelector('#select-record').onclick=()=>{dialog.querySelector('textarea').focus();dialog.querySelector('textarea').select();};
  dialog.addEventListener('close',()=>{URL.revokeObjectURL(url);dialog.remove();document.querySelector('#export')?.focus();},{once:true});
  document.body.append(dialog);dialog.showModal();
}

// Native fragment navigation opens the optional workshop before scrolling.
// Avoid delayed focus changes that could steal focus from the next action.
document.addEventListener('click',event=>{
 const open=event.target.closest('a[href="#advanced"]');
 if(open)$('#advanced').open=true;
 const close=event.target.closest('[data-close-advanced]');
 if(close){$('#advanced').open=false;if(location.hash==='#advanced')history.replaceState(null,'',location.pathname+location.search);const link=$('.advanced-jump a');link.focus({preventScroll:true});link.scrollIntoView({block:'start',behavior:'instant'});}
});
function openLinkedWorkshop(){if(location.hash==='#advanced'){const section=$('#advanced');if(section)section.open=true;}}
window.addEventListener('hashchange',openLinkedWorkshop);openLinkedWorkshop();

// A research link should reveal its destination, including direct fragment links.
document.addEventListener('click', event => {
  if (event.target.closest('a[href="#research"]')) document.querySelector('#research').open = true;
});
function revealResearch(){if(location.hash === '#research') document.querySelector('#research')?.setAttribute('open','');}
window.addEventListener('hashchange', revealResearch); revealResearch();
