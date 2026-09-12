import {gardenExperiment} from './math.js';
self.onmessage=({data})=>{
 const {id,seed,size,target,replicates=200}=data;
 const result=['neutral','favour','archive'].map(mode=>{
  let survivors=0,totalTypes=0,totalTarget=0;
  for(let k=0;k<replicates;k++){
   const end=gardenExperiment({seed:(seed+Math.imul(k,2654435761))>>>0,size,mode,target}).at(-1).counts;
   survivors+=end[target]>0?1:0;totalTypes+=end.filter(v=>v>0).length;totalTarget+=end[target];
  }
  const p=survivors/replicates,z=1.96,den=1+z*z/replicates,centre=(p+z*z/(2*replicates))/den,half=z*Math.sqrt(p*(1-p)/replicates+z*z/(4*replicates*replicates))/den;
  return {mode,survivors,meanTypes:totalTypes/replicates,meanTarget:totalTarget/replicates,interval:[centre-half,centre+half]};
 });
 self.postMessage({id,seed,size,target,replicates,result});
};
