/* Non-destructive sprite rendering: original PNGs + viewports + optional rig masks. */
(function(root){
'use strict';
function pts(a){return a.map(p=>p.join(',')).join(' ');}
function defs(data,prefix='art',resolver=p=>p){
 const textures=[...new Map(Object.values(data.art).map(a=>[a.textureKey,a])).values()];
 return `<defs>${textures.map(a=>`<image id="${prefix}-texture-${a.textureKey}" href="${resolver(a.texture)}" width="${a.textureSize[0]}" height="${a.textureSize[1]}"/>`).join('')}<filter id="${prefix}-shadow" x="-8%" y="-8%" width="116%" height="116%"><feColorMatrix type="matrix" values="0 0 0 0 .45 0 0 0 0 .36 0 0 0 0 .61 0 0 0 .88 0"/><feDropShadow dx="0" dy="0" stdDeviation="1.1" flood-color="#d6acff" flood-opacity=".55"/></filter></defs>`;
}
function sprite(a,uid,prefix='art',shadow=false,displayBounds=null){
 const b=displayBounds||a.bounds,[x,y,w,h]=b,s=a.sourceRect;
 const picture=`<use href="#${prefix}-texture-${a.textureKey}"/>`;
 const content=shadow?`<defs><mask id="${uid}-alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="${a.textureSize[0]}" height="${a.textureSize[1]}" style="mask-type:alpha">${picture}</mask></defs><rect x="${s[0]}" y="${s[1]}" width="${s[2]}" height="${s[3]}" fill="#9a7db8" fill-opacity=".72" mask="url(#${uid}-alpha)"/>`:picture;
 return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${s.join(' ')}" overflow="hidden" preserveAspectRatio="none" class="sprite ${shadow?'slot-shadow':''}">${content}</svg>`;
}
function character(data,c,prefix,placed=new Set(),complete=false,interactive=false){
 let body='';const order=['arm-left','arm-right','leg-left','leg-right','chest','pelvis'];
 for(const typ of order){
  const a=data.art[c.id+'-'+typ],on=placed.has(a.id),uid=prefix+'-'+a.id;
  body+=`<g id="${prefix}-slot-${a.id}" data-part="${a.id}" class="${on?'installed':'target'} ${typ}" style="transform-origin:${a.pivot[0]}px ${a.pivot[1]}px" ${!on&&interactive?`role="button" tabindex="0" aria-label="${a.label}, ${c.name}"`:''}>${sprite(a,uid,prefix,!on)}`;
  if(on&&complete&&typ==='arm-right'&&c.id==='luna')body+=sprite(data.art['luna-maraca'],uid+'-prop',prefix);
  if(on&&complete&&typ==='arm-left'&&c.id==='tito')body+=sprite(data.art['tito-maraca'],uid+'-prop',prefix);
  body+='</g>';
 }
 body+=`<g class="head">${sprite(data.art[c.headId],prefix+'-'+c.headId,prefix)}</g>`;
 return `<g class="character" data-character="${c.id}" transform="translate(${c.origin.join(' ')})"><ellipse class="ground-shadow" cx="170" cy="628" rx="130" ry="17" fill="#201127" opacity=".36"/><g class="actor">${body}</g><g class="name-tag"><rect x="112" y="652" width="116" height="34" rx="17" fill="#2d1739" fill-opacity=".8" stroke="${c.accent}" stroke-opacity=".4"/><text x="170" y="675" text-anchor="middle" fill="${c.accent}" font-size="17" font-family="Arial,sans-serif">${c.name}</text></g></g>`;
}
root.SkeletonArt={defs,sprite,character};
})(typeof window==='undefined'?globalThis:window);
