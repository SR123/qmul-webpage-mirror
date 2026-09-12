// Small exact models for the optional workshops. No DOM or network access.
import {bits,permutations,triples,sum,legalMoves,applyMove} from './math.js';

export const C5_SOURCES=['zero','one','previous-left','previous-right','next-left','next-right'];
export function c5Guess(values,player,leftSource,rightSource){
  const previous=values[(player+4)%5],next=values[(player+1)%5];
  const visible={zero:0,one:1,'previous-left':previous[0],'previous-right':previous[1],'next-left':next[0],'next-right':next[1]};
  if(!C5_SOURCES.includes(leftSource)||!C5_SOURCES.includes(rightSource))throw new Error('Invalid local coin source');
  return [visible[leftSource],visible[rightSource]];
}
export function c5Evaluate(leftSource='previous-right',rightSource='next-left'){
  return Array.from({length:1024},(_,id)=>{
    const b=bits(id,10),values=Array.from({length:5},(_,i)=>b.slice(2*i,2*i+2));
    const guesses=values.map((_,i)=>c5Guess(values,i,leftSource,rightSource));
    return {id,values,guesses,win:values.every((v,i)=>v.every((x,j)=>x===guesses[i][j]))};
  });
}

// We use the flip of the census paper's A_n convention: even middle index
// never LAST, odd middle index never FIRST. Both have identical cardinality.
export function fishburnLaws(n){
  return triples(Array.from({length:n},(_,i)=>i+1)).map(triple=>({triple,x:triple[1],pos:triple[1]%2===0?2:0}));
}
export function obeysLaw(order,{triple,x,pos}){return order.filter(v=>triple.includes(v))[pos]!==x;}
export function fishburnDomain(n,laws=fishburnLaws(n)){
  if(!Number.isInteger(n)||n<3||n>8)throw new Error('Enumeration is bounded to n=3…8');
  return permutations(Array.from({length:n},(_,i)=>i+1)).filter(order=>laws.every(law=>obeysLaw(order,law)));
}
export function domainHasCertificate(domain,alternatives){
  return triples(alternatives).every(triple=>{
    const seen=domain.map(order=>order.filter(v=>triple.includes(v)));
    return triple.some(x=>[0,1,2].some(pos=>seen.every(r=>r[pos]!==x)));
  });
}
function choose(n,k){let value=1;for(let i=1;i<=k;i++)value=value*(n-i+1)/i;return Math.round(value);}
export function fishburnSize(n){
  if(!Number.isInteger(n)||n<3||n>12)throw new Error('Size table is bounded to n=3…12');
  return 2**(n-3)*(n+3)-(n%2?choose(n-1,(n-1)/2)*(n-1)/2:choose(n-2,n/2-1)*(n-1.5));
}

export function mex(values){const present=new Set(values);let m=0;while(present.has(m))m++;return m;}
const grundyMemo=new Map([['0,0,0',0]]);
export function nimberByMoves(heaps){
  if(heaps.some(h=>!Number.isInteger(h)||h<0||h>15)||heaps.length>4)throw new Error('Bounded Nim explorer: at most four heaps, each 0…15');
  const key=[...heaps].sort((a,b)=>a-b).join(',');
  if(!grundyMemo.has(key))grundyMemo.set(key,mex(legalMoves(heaps).map(move=>nimberByMoves(applyMove(heaps,move)))));
  return grundyMemo.get(key);
}

export function cycleTrigrams(pattern='0011'){
  if(!/^[01]{1,8}$/.test(pattern))throw new Error('Use a binary period of length 1…8');
  const out=Array(8).fill(0);
  for(let i=0;i<pattern.length;i++){
    const triple=pattern[i]+pattern[(i+1)%pattern.length]+pattern[(i+2)%pattern.length];
    out[parseInt(triple,2)]+=1/pattern.length;
  }
  return out;
}
export function bigramRollout(rho){
  // A stationary triple law induces pair marginals B_ab. Reconstruct the
  // triple from those pairs as B_ab * B_bc / pi_b (zero row contributes zero).
  const pairs=Array(4).fill(0);
  rho.forEach((p,i)=>{pairs[i>>1]+=p;});
  const pi=[pairs[0]+pairs[1],pairs[2]+pairs[3]];
  return rho.map((_,i)=>{const a=i>>2,b=(i>>1)&1,c=i&1;return pi[b]?pairs[2*a+b]*pairs[2*b+c]/pi[b]:0;});
}
export function klBits(p,q){return Math.max(0,sum(p.map((v,i)=>v===0?0:q[i]===0?Infinity:v*Math.log2(v/q[i]))));}
export function publicationStep(rho,target,beta,mode){
  if(!Number.isFinite(beta)||beta<0||beta>1||!['descriptive','normative'].includes(mode))throw new Error('Invalid publication setting');
  const short=bigramRollout(rho),long=mode==='normative'?target:rho;
  return short.map((v,i)=>(1-beta)*v+beta*long[i]);
}
export function structureExperiment({pattern='0011',beta=.8,generations=30}={}){
  const target=cycleTrigrams(pattern),result={target,descriptive:[[...target]],normative:[[...target]]};
  for(const mode of ['descriptive','normative'])for(let t=0;t<generations;t++)result[mode].push(publicationStep(result[mode].at(-1),target,beta,mode));
  return result;
}
