// Pure, bounded mathematical kernels. No DOM, network, or hidden game state.
export const sum = a => a.reduce((s, x) => s + x, 0);
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = (t + Math.imul(t ^ t >>> 7, 61 | t)) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export function bits(x, n) { return Array.from({length:n}, (_, i) => (x >> (n - i - 1)) & 1); }
export function configurations(n) { return Array.from({length:2 ** n}, (_, x) => bits(x,n)); }
export function observations(values, inputs) { return inputs.reduce((x, i) => 2 * x + values[i], 0); }
export function evaluateStrategy(inputs, tables) {
  return configurations(inputs.length).map(values => {
    const guesses = inputs.map((ins, i) => tables[i][observations(values,ins)]);
    return {values, guesses, win: values.every((v,i) => v === guesses[i])};
  });
}
export function ruleTable(rule, degree) {
  return configurations(degree).map(b => {
    if (rule === 'one') return 1;
    if (rule === 'first') return b[0] ?? 0;
    if (rule === 'last') return b.at(-1) ?? 0;
    if (rule === 'xor') return b.reduce((x,v) => x ^ v,0);
    if (rule === 'notxor') return 1 ^ b.reduce((x,v) => x ^ v,0);
    return 0;
  });
}
// Exhaust all subsets of configurations (at most 256 subsets for n=3).
// Two configurations conflict iff one node sees the same inputs but needs
// different outputs. Any conflict-free set extends to local truth tables.
export function guessingOptimum(inputs) {
  const configs = configurations(inputs.length), conflicts = [];
  for (let a=0;a<configs.length;a++) for(let b=a+1;b<configs.length;b++) {
    if(inputs.some((ins,i) => configs[a][i] !== configs[b][i] && observations(configs[a],ins) === observations(configs[b],ins))) conflicts.push((1<<a)|(1<<b));
  }
  let count=0, best=[];
  for (let mask=1;mask<2**configs.length;mask++) {
    if(conflicts.some(c => (mask & c) === c)) continue;
    const selected=configs.filter((_,i) => mask & (1<<i));
    if(selected.length>count) { count=selected.length; best=selected; }
  }
  return {count, value:Math.log2(count), configurations:best};
}
export function permutations(xs) {
  if(!xs.length) return [[]];
  return xs.flatMap((x,i)=>permutations(xs.filter((_,j)=>i!==j)).map(p=>[x,...p]));
}
export function triples(xs) {
  const out=[];
  for(let a=0;a<xs.length;a++)for(let b=a+1;b<xs.length;b++)for(let c=b+1;c<xs.length;c++)out.push([xs[a],xs[b],xs[c]]);
  return out;
}
export function majority(profile, alternatives) {
  const comparisons=[];
  for(let i=0;i<alternatives.length;i++)for(let j=i+1;j<alternatives.length;j++) {
    const a=alternatives[i], b=alternatives[j];
    const forA=profile.filter(r=>r.indexOf(a)<r.indexOf(b)).length;
    comparisons.push({a,b,forA,forB:profile.length-forA,winner:forA*2===profile.length?null:forA*2>profile.length?a:b});
  }
  const beats=(a,b)=>comparisons.some(c=>c.winner===a && (c.a===b||c.b===b));
  const cycle=triples(alternatives).find(([a,b,c]) => (beats(a,b)&&beats(b,c)&&beats(c,a)) || (beats(b,a)&&beats(c,b)&&beats(a,c))) || null;
  return {comparisons,cycle,winner:alternatives.find(a=>alternatives.every(b=>a===b||beats(a,b)))??null};
}
// Ward's value-restriction criterion, applied on every triple.
export function certifyDomain(domain, alternatives) {
  const certificates=triples(alternatives).map(triple=>{
    const restrictions=domain.map(r=>r.filter(x=>triple.includes(x)));
    const laws=[];
    for(const x of triple)for(let pos=0;pos<3;pos++)if(restrictions.every(r=>r[pos]!==x))laws.push({x,pos});
    return {triple,laws};
  });
  const valid=certificates.every(c=>c.laws.length>0);
  let witness=null;
  // A failed triple has a cyclic triple of orders; search complete profiles
  // of three voters with replacement (<=2600 for 24 orders).
  if(!valid) outer:for(let a=0;a<domain.length;a++)for(let b=a;b<domain.length;b++)for(let c=b;c<domain.length;c++) {
    const profile=[domain[a],domain[b],domain[c]], result=majority(profile,alternatives);
    if(result.cycle){witness={profile,...result};break outer;}
  }
  return {valid,certificates,witness};
}
export function neverDomain(alternatives, laws) {
  return permutations(alternatives).filter(r=>laws.every(({triple,x,pos})=>r.filter(a=>triple.includes(a))[pos]!==x));
}
export function nimSum(heaps) {return heaps.reduce((x,h)=>x^h,0);}
export function legalMoves(heaps) {return heaps.flatMap((h,i)=>Array.from({length:h},(_,to)=>({heap:i,to})));}
export function applyMove(heaps,{heap,to}) {
  if(!Number.isInteger(heap)||heap<0||heap>=heaps.length||!Number.isInteger(to)||to<0||to>=heaps[heap]) throw new Error('Illegal move');
  return heaps.map((h,i)=>i===heap?to:h);
}
export function perfectMove(heaps) {
  const x=nimSum(heaps);
  for(let i=0;i<heaps.length;i++)if((heaps[i]^x)<heaps[i])return {heap:i,to:heaps[i]^x};
  return legalMoves(heaps)[0]??null;
}
export function collectorMove(heaps) {const heap=heaps.findIndex(h=>h>0);return heap<0?null:{heap,to:0};}
export function predictsSafe(heaps,rule) {
  if(rule==='total')return sum(heaps)%2===0;
  if(rule==='pairs')return heaps.filter(h=>h>0).every(h=>heaps.filter(v=>v===h).length%2===0);
  return nimSum(heaps)===0;
}
export const familiarBoards=[[1,1],[2,2],[3,3],[1,2],[1,3],[2,3]];
export function auditRule(rule) {
  const unseen=[];
  for(let a=0;a<8;a++)for(let b=0;b<8;b++)for(let c=0;c<8;c++)if(a+b+c)unseen.push([a,b,c]);
  const run=boards=>({total:boards.length,correct:boards.filter(h=>predictsSafe(h,rule)===(nimSum(h)===0)).length,failures:boards.filter(h=>predictsSafe(h,rule)!==(nimSum(h)===0))});
  return {familiar:run(familiarBoards),unseen:run(unseen)};
}
export const WORDS=['rain','light','wind','shade','moss','clover','fern','foxglove'];
export const INITIAL=[18,14,10,8,6,4,3,1];
export function initialCounts(size=64) {
  if(![32,64,256].includes(size))throw new Error('Unsupported population size');
  if(size===32)return [9,7,5,4,3,2,1,1];
  return INITIAL.map(c=>c*size/64);
}
export function publicationLaw(counts, mode='neutral', target=7, archive=INITIAL) {
  const p=counts.map(c=>c/sum(counts));
  if(mode==='favour') {const q=p.map((v,i)=>v*(i===target?3:1));return q.map(v=>v/sum(q));}
  if(mode==='archive')return p.map((v,i)=>0.85*v+0.15*archive[i]/sum(archive));
  return p;
}
export function resample(counts, random, mode='neutral', target=7, archive=INITIAL) {
  const q=publicationLaw(counts,mode,target,archive), next=counts.map(()=>0), tokens=[];
  for(let k=0;k<sum(counts);k++) {
    let u=random(), i=0;
    while(i<q.length-1&&u>=q[i]){u-=q[i];i++;}
    next[i]++;tokens.push(i);
  }
  return {counts:next,tokens};
}
export function entropy(counts) {const n=sum(counts);return Math.max(0,-sum(counts.filter(c=>c>0).map(c=>(c/n)*Math.log2(c/n))));}
export function gardenExperiment({seed=42,size=64,mode='neutral',target=7,generations=30}={}) {
  const random=rng(seed), initial=initialCounts(size);
  const history=[{counts:initial,tokens:initial.flatMap((n,i)=>Array(n).fill(i))}];
  for(let t=0;t<generations;t++)history.push(resample(history.at(-1).counts,random,mode,target,initial));
  return history;
}
