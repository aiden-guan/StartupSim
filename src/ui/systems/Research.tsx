import { useMemo, useRef, useState } from 'react';
import { technologies, techById } from '../../data/technologies';
import type { GameState } from '../../simulation/types';
import { useGame } from '../../state/store';
import { money } from '../format';
import { GameButton } from '../shared/controls';
export function ResearchPanel({game}:{game:GameState}) {
  const [selected,setSelected]=useState(technologies[0]!.id),[zoom,setZoom]=useState(.8),viewport=useRef<HTMLDivElement>(null);
  const drag=useRef<{x:number;y:number;left:number;top:number}|null>(null);
  const nodes=useMemo(()=>{
    const depths=new Map<string,number>();
    const depth=(id:string):number=>{if(depths.has(id))return depths.get(id)!;const d=1+Math.max(-1,...(techById[id]?.requires??[]).map(depth));depths.set(id,d);return d;};
    const rows=new Map<number,number>();
    return technologies.map(t=>{const col=depth(t.id),row=rows.get(col)??0;rows.set(col,row+1);return {tech:t,x:40+col*250,y:55+row*125};});
  },[]);
  const w=Math.max(...nodes.map(n=>n.x))+235,h=Math.max(...nodes.map(n=>n.y))+150;
  const tech=techById[selected]!;
  const owned=game.company.technologies.includes(tech.id),task=game.tasks.find(t=>t.techId===tech.id);
  const missing=tech.requires.filter(t=>!game.company.technologies.includes(t));
  const hidden=tech.hiddenUntil?.some(t=>!game.company.technologies.includes(t));
  const reason=owned?'Already researched':task?'Research in progress':hidden?'Discover the preceding technologies':missing.length?`Requires ${missing.map(t=>techById[t]?.name).join(', ')}`:tech.requiredVertical&&!game.company.verticals.includes(tech.requiredVertical)?`Requires ${tech.requiredVertical} vertical`:game.company.cash<tech.cost?`Need ${money(tech.cost-game.company.cash)} more`:'';
  return <div className="research-workspace"><div className="tree-toolbar"><span>Technology map <small>Drag to pan · use + / − to zoom</small></span><div><button aria-label="Zoom out research" onClick={()=>setZoom(Math.max(.4,zoom-.1))}>−</button><output>{Math.round(zoom*100)}%</output><button aria-label="Zoom in research" onClick={()=>setZoom(Math.min(1.3,zoom+.1))}>+</button><button onClick={()=>{setZoom(.8);viewport.current?.scrollTo({left:0,top:0});}}>Reset</button></div></div>
    <div className="tree-viewport" data-tutorial="research-tree" ref={viewport} onPointerDown={e=>{if((e.target as HTMLElement).closest('button'))return;drag.current={x:e.clientX,y:e.clientY,left:e.currentTarget.scrollLeft,top:e.currentTarget.scrollTop};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{if(!drag.current)return;e.currentTarget.scrollLeft=drag.current.left+drag.current.x-e.clientX;e.currentTarget.scrollTop=drag.current.top+drag.current.y-e.clientY;}} onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null}>
      <div style={{width:w*zoom,height:h*zoom}}><div className="tree-canvas" style={{width:w,height:h,transform:`scale(${zoom})`}}><svg className="tree-edges" width={w} height={h}>{nodes.flatMap(n=>n.tech.requires.map(id=>{const from=nodes.find(n=>n.tech.id===id)!;return <path key={`${id}-${n.tech.id}`} d={`M${from.x+195} ${from.y+43} C${from.x+225} ${from.y+43},${n.x-35} ${n.y+43},${n.x} ${n.y+43}`} fill="none" stroke={game.company.technologies.includes(id)?'#799b7e':'#c2ccbb'} strokeWidth="2"/>;}))}</svg>
      {nodes.map(n=>{
        const t=n.tech,have=game.company.technologies.includes(t.id),busy=game.tasks.some(task=>task.techId===t.id),hide=t.hiddenUntil?.some(id=>!game.company.technologies.includes(id)),locked=t.requires.some(id=>!game.company.technologies.includes(id));
        return <button key={t.id} className={`research-node ${have?'researched':busy?'researching':locked?'locked':'available'} ${selected===t.id?'selected':''}`} style={{left:n.x,top:n.y}} onClick={()=>setSelected(t.id)}><small>{hide?'Undiscovered':have?'✓ Researched':busy?'In progress':locked?'Prerequisites needed':'Available'}</small><strong>{hide?'Beyond the frontier':t.name}</strong><span>{hide?'???':have?(t.unlockPrimitives??[]).join(' · ')||'Company capability':money(t.cost)}</span></button>;
      })}</div></div>
    </div><div className="research-detail"><div><span className="eyebrow">{hidden?'Frontier research':`Era ${tech.era} / Research brief`}</span><h3>{hidden?'Uncharted technology':tech.name}</h3><p>{hidden?'Keep researching to discover what comes next.':tech.description}</p>{!hidden&&tech.unlockPrimitives?.length&&<small>Unlocks {tech.unlockPrimitives.join(', ')}</small>}</div><div>{task?<GameButton onClick={()=>useGame.getState().setDrawer('tasks')}>Assign research team →</GameButton>:<GameButton tone="primary" disabled={!!reason} title={reason||'Start this research project'} onClick={()=>useGame.getState().dispatch({type:'startResearch',techId:tech.id})}>Research · {money(tech.cost)}</GameButton>}<small>{reason||'A team is required after starting.'}</small></div></div>
  </div>;
}
