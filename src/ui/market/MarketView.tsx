import { useMemo, useState } from 'react';
import { competitors as competitorDefs } from '../../data/competitors';
import { legalMarketMoves } from '../../simulation/commands';
import { marketShare, tileAt } from '../../market/battle';
import { hexPoints, pixelFor, posKey, samePos } from '../../market/hex';
import type { GameState, HexPos } from '../../simulation/types';
import { useGame } from '../../state/store';
import { audio } from '../../audio/Audio';
import { pct } from '../format';
import { CharacterPortrait } from '../shared/CharacterPortrait';
import { lookFromSeed } from '../../simulation/look';
const SIZE=32;
const tileColor=(kind:string,owner:string|null)=>owner==='player'?'#a8c4b0':owner==='ai'?'#d6a396':kind==='enterprise'?'#e2c784':kind==='influencer'?'#b5aec6':kind==='empty'?'#7d9094':'#d5d8c9';
const SYMBOLS:Record<string,string>={customer:'⌂',enterprise:'▥',influencer:'✦',data:'▤',cloud:'☁',partner:'◇',regulated:'⚑',government:'▥',empty:'·'};
export function MarketView({game}:{game:GameState}) {
  const battle=game.marketBattle!,dispatch=useGame(s=>s.dispatch);
  const [feedback,setFeedback]=useState('Select a piece. Plan your route.');
  const legal=legalMarketMoves(game),share=marketShare(battle),selected=battle.pieces.find(p=>p.id===battle.selectedPieceId);
  const legalKeys=new Set(legal.map(posKey));
  const product=game.products.find(p=>p.id===battle.productId)!;
  const rival=competitorDefs.find(c=>c.id===battle.competitorId);
  const tile=selected?tileAt(battle,selected.pos):undefined;
  const locked=Boolean(game.pendingMentor);
  const reason=!selected?'Select one of your pieces':selected.moves===0?'No moves left · end your turn':tile?.kind==='empty'?'No customers on this tile':tile?.owner==='player'?'You already own this tile':'';
  const bounds=useMemo(()=>{
    const pts=battle.tiles.map(t=>pixelFor(t.pos,SIZE));
    const x=Math.min(...pts.map(p=>p.x))-SIZE-5,y=Math.min(...pts.map(p=>p.y))-SIZE-5;
    return `${x} ${y} ${Math.max(...pts.map(p=>p.x))-x+SIZE+5} ${Math.max(...pts.map(p=>p.y))-y+SIZE+5}`;
  },[battle.tiles]);
  function onTile(pos:HexPos) {
    if(locked)return;
    const occ=battle.pieces.find(p=>samePos(p.pos,pos));
    if(occ?.owner==='player') {dispatch({type:'selectPiece',pieceId:occ.id});setFeedback('Piece selected. Outlined tiles are within range.');return;}
    if(selected&&legalKeys.has(posKey(pos))) {
      dispatch({type:'marketMove',dest:pos});audio.play(occ?'warn':'click',game.settings);
      setFeedback(occ?'Combat resolved. Check your remaining strength.':'Moved. Capture if you have a move remaining.');
    }
  }
  return <main className="market-mode"><header className="market-header"><div><span className="eyebrow">Launch / Market capture</span><h1>{product.name}</h1></div><div className="market-score"><span><small>Your share</small><strong>{pct(share.player)}</strong></span><span><small>Rival share</small><strong>{pct(share.ai)}</strong></span><span><small>Turns remaining</small><strong>{battle.turnsLeft} <em>/ {battle.totalTurns}</em></strong></span></div><span className="market-clock">Ⅱ Company paused</span></header>
    <div className="market-layout"><section className="tactical-board" data-tutorial="market-board" aria-label="Market board"><svg viewBox={bounds} role="group" aria-label="Customer territories">
      {battle.tiles.map((t,i)=>{
        const {x,y}=pixelFor(t.pos,SIZE),here=selected&&samePos(selected.pos,t.pos),canMove=legalKeys.has(posKey(t.pos));
        const tutorial=t.kind==='enterprise'&&battle.tiles.find(t=>t.kind==='enterprise')?.id===t.id?'market-value':t.kind==='customer'&&battle.tiles.find(t=>t.kind==='customer')?.id===t.id?'market-customer':undefined;
        return <g key={t.id} role="button" tabIndex={locked?-1:0} aria-label={`${t.kind} tile ${t.pos.row},${t.pos.col}, value ${t.income+1}${t.owner?`, ${t.owner==='player'?'yours':'rival'}`:''}${canMove?', reachable':''}`} data-tutorial={tutorial} onClick={()=>onTile(t.pos)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onTile(t.pos);}}} className={`market-tile ${canMove?'reachable':''} ${t.owner?'owned':''}`}>
          <polygon points={hexPoints(x,y+3,SIZE-1.5)} fill="#405354"/>
          <polygon points={hexPoints(x,y,SIZE-1.5)} fill={tileColor(t.kind,t.owner)} stroke={here?'#fff7e5':canMove?'#cf703e':'#71837f'} strokeWidth={here?2.5:canMove?2:0.65}/>
          <text x={x} y={y-5} textAnchor="middle" fontSize="15" fill="#425451" opacity=".8">{SYMBOLS[t.kind]}</text>
          {t.kind!=='empty'&&<g>{Array.from({length:t.income+1},(_,j)=><circle key={j} cx={x+(j-t.income/2)*5} cy={y+15} r="1.6" fill="#425451"/>)}</g>}
          {t.captured>0&&<text x={x} y={y+25} textAnchor="middle" fontSize="6" fill="#243d35">{t.captured}/{t.baseCost} claim</text>}
          <title>Territory {i+1} · capture cost {t.baseCost}</title>
        </g>;
      })}
      {battle.pieces.map((p,i)=>{
        const {x,y}=pixelFor(p.pos,SIZE),sel=p.id===battle.selectedPieceId;
        const tutorial=p.owner==='player'&&battle.pieces.find(p=>p.owner==='player')?.id===p.id?'market-player':p.owner==='ai'&&battle.pieces.find(p=>p.owner==='ai')?.id===p.id?'market-rival':undefined;
        return <g key={p.id} transform={`translate(${x} ${y-1})`} className="market-piece" data-tutorial={tutorial} role="button" tabIndex={locked?-1:0} aria-label={`${p.owner==='player'?'Your':'Rival'} piece ${i+1}, strength ${p.health}, moves ${p.moves}`} onClick={()=>onTile(p.pos)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onTile(p.pos);}}}>
          <ellipse cy="9" rx="13" ry="7" fill="#263e3b" opacity=".22"/>
          {sel&&<ellipse cy="7" rx="17" ry="10" fill="none" stroke="#fff8e7" strokeWidth="2"/>}
          <path d="M-10 -9L0 -14L10 -9V6L0 12L-10 6Z" fill={p.owner==='player'?'#e6804b':'#4d637e'} stroke={p.owner==='player'?'#f8c898':'#8c9eb3'} strokeWidth="1"/>
          <path d="M-10 -9L0 -4L10 -9M0 -4V12" fill="none" stroke="#ffffff" opacity=".4"/>
          <text x="0" y="3" fontSize="8" textAnchor="middle" fontWeight="700" fill="white">{p.health}</text>
          {p.moves===0&&<text x="0" y="-19" fontSize="8" textAnchor="middle" fill="#eff2e3">✓</text>}
        </g>;
      })}
    </svg><div className="board-legend"><span><i style={{background:'#a8c4b0'}}/> Your customers</span><span><i style={{background:'#d6a396'}}/> Rival customers</span><span>⌂ Customer</span><span>▥ Enterprise</span><span>✦ Influencer</span></div></section>
    <aside className="market-orders"><div className="rival-identity"><CharacterPortrait look={lookFromSeed(battle.competitorId,rival?.archetype)}/><div><span className="eyebrow">The competition</span><h3>{rival?.name??'Independent rival'}</h3><small>{rival?.founder}</small></div></div><div className="order-card"><span className="eyebrow">Your selected piece</span><h2>{selected?`${selected.health} strength`:'No piece selected'}</h2><p>{selected?`${selected.moves} of ${selected.movement} moves remaining`:'Choose a piece on the board.'}</p><div className="capture-detail"><strong>{tile?`${tile.kind} territory`:'Choose a destination'}</strong><span>{tile?.owner==='player'?'Already yours':tile?.kind==='empty'?'Open ground':`${tile?.captured??0} / ${tile?.baseCost??0} claim strength`}</span></div><button className="primary-action" data-tutorial="market-capture" disabled={locked||!!reason} title={reason||'Spend remaining movement to claim this tile'} onClick={()=>{
      const before=tile?.owner;dispatch({type:'marketCapture'});const updated=useGame.getState().game?.marketBattle?.tiles.find(t=>t.id===tile?.id);setFeedback(updated?.owner!==before?'Customers captured. Their revenue is yours.':'Claim strengthened. Finish capturing next turn.');audio.play(updated?.owner!==before?'success':'click',game.settings);
    }}>Capture customers</button><small className="disabled-reason">{reason||'Capture adds your strength and ends this piece’s turn.'}</small></div><p className="market-feedback" role="status">{feedback}</p><button className="end-turn" data-tutorial="market-end-turn" disabled={locked} onClick={()=>{dispatch({type:'marketEndTurn'});setFeedback('Rival turn resolved. Your pieces can move again.');}}>End turn →</button><div className="market-help"><b>Move · Claim · Repeat</b><p>Click an outlined tile to move. Capture takes any remaining movement. Partial claims persist. Attack by moving onto an adjacent rival.</p></div></aside></div>
  </main>;
}
