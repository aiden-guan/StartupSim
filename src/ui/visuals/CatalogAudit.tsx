import { useEffect, useState } from 'react';
import { primitives } from '../../data/primitives';
import { recipeDesignFor } from '../../game3d/props/products/catalog';
import { recipes } from '../../data/recipes';
import { perks } from '../../data/perks';
import { promos } from '../../data/promos';
import { ProductPreview } from '../products/ProductPreview';
import { MiniaturePreview } from './MiniaturePreview';

type Category = 'primitives' | 'recipes' | 'culture' | 'promotions';
export function CatalogAudit({ onBack }: { onBack: () => void }) {
  const [category, setCategory] = useState<Category>('recipes');
  const [page, setPage] = useState(0);
  const [gray, setGray] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const unique = recipes.filter((r, i) => recipes.findIndex(other => other.id === r.id) === i);
  const entries = category === 'primitives' ? primitives.map(p=>({id:p.id,name:p.name,detail:p.description,node:<ProductPreview a={p.id} b={null}/>})) : category === 'recipes' ? unique.map(r => ({ id:r.id, name:r.name, detail:`${r.parts.join(' + ')} · ${r.vertical} · ${recipeDesignFor(...r.parts)!.concept}`, node:<ProductPreview a={r.parts[0]} b={r.parts[1]}/> }))
    : category === 'culture' ? perks.flatMap(p => p.upgrades.map((tier, level) => ({id:`${p.id}-${level}`, name:tier.name, detail:`${p.name} · tier ${level+1}`, node:<MiniaturePreview item={{kind:'perk', id:p.id, level}} label={tier.name}/> })))
    : promos.map(p => ({id:p.id, name:p.name, detail:p.description, node:<MiniaturePreview item={{kind:'promo',id:p.id}} label={p.name}/> }));
  const pages = Math.ceil(entries.length / 8);
  const move = (delta:number) => { setSelected(null); setPage(p => (p + delta + pages) % pages); };
  useEffect(() => {
    const key = (e:KeyboardEvent) => { if (e.target instanceof HTMLSelectElement) return; if(e.key==='ArrowRight') move(1); if(e.key==='ArrowLeft') move(-1); };
    window.addEventListener('keydown',key); return () => window.removeEventListener('keydown',key);
  },[pages]);
  return <main style={{background:'#eee7dc', color:'#282c30', minHeight:'100vh', padding:24}}>
    <header style={{display:'flex',gap:16,alignItems:'center',flexWrap:'wrap',marginBottom:16}}>
      <button onClick={onBack}>← Gallery</button><strong>DEV / Catalog contact sheet</strong>
      {(['primitives','recipes','culture','promotions'] as const).map(c => <button key={c} aria-pressed={c===category} onClick={()=>{setCategory(c);setPage(0);setSelected(null);}}>{c}</button>)}
      <label><input type="checkbox" checked={gray} onChange={e=>setGray(e.target.checked)}/> Grayscale</label>
      <button onClick={()=>move(-1)}>Previous</button><span>{page+1} / {pages}</span><button onClick={()=>move(1)}>Next</button>
    </header>
    <select aria-label="Jump to asset" value={selected ?? entries[page*8]?.id} onChange={e=>{setSelected(e.target.value);setPage(Math.floor(entries.findIndex(item=>item.id===e.target.value)/8));}}>{entries.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:14,marginTop:16,filter:gray?'grayscale(1)':undefined}}>
      {entries.slice(page*8,page*8+8).map(e=><article key={e.id} style={{background:'#e9e2d5',border:'1px solid #c7bdad',outline:e.id===selected?'2px solid #b9653d':undefined,padding:10}}><h2 style={{fontWeight:700}}>{e.name}</h2><p style={{fontSize:11,minHeight:30}}>{e.detail}</p>{e.node}</article>)}
    </div>
  </main>;
}
