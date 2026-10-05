(function(root){
'use strict';
class SkeletonEngine{
 constructor(data,random=Math.random){this.data=data;this.random=random;this.parts=new Map(data.parts.map(p=>[p.id,p]));this.characters=new Map(data.characters.map(c=>[c.id,c]));this.phase='ready';this.placed=new Set();this.queue=[];}
 start(){this.placed.clear();this.queue=this.data.parts.map(p=>p.id);for(let i=this.queue.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[this.queue[i],this.queue[j]]=[this.queue[j],this.queue[i]];}this.phase='playing';return this.current;}
 get current(){return this.parts.get(this.queue[0])||null;}
 place(id){if(this.phase!=='playing'||id!==this.current?.id)return {ok:false,complete:false};this.placed.add(id);this.queue.shift();const done=this.queue.length===0;if(done)this.phase='complete';return {ok:true,complete:done,characterId:this.parts.get(id).characterId};}
 center(p){const c=this.characters.get(p.characterId),b=p.bounds;return {x:c.origin[0]+b[0]+b[2]/2,y:c.origin[1]+b[1]+b[3]/2};}
 dragTarget(point){let best=null,dist=Infinity;for(const p of this.data.parts){const c=this.center(p),d=Math.hypot(point.x-c.x,point.y-c.y);if(d<dist){best=p;dist=d;}}return dist<=62?best:null;}
 tapTarget(point){let best=null,bestDistance=Infinity;for(const p of this.data.parts){
  const c=this.characters.get(p.characterId),b=p.bounds,m=p.hitMask,rows=m.length,cols=m[0].length;
  const x=point.x-c.origin[0]-b[0],y=point.y-c.origin[1]-b[1];
  if(x < -18||y < -18||x>b[2]+18||y>b[3]+18)continue;
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++)if(m[j][i]==='1'){
   const cx=(i+.5)*b[2]/cols,cy=(j+.5)*b[3]/rows;
   const dx=Math.max(0,Math.abs(x-cx)-b[2]/cols/2),dy=Math.max(0,Math.abs(y-cy)-b[3]/rows/2),d=Math.hypot(dx,dy);
   if(d<bestDistance){bestDistance=d;best=p;}
  }
 }return bestDistance<=18?best:null;}
}
root.SkeletonEngine=SkeletonEngine;
})(typeof window==='undefined'?globalThis:window);
