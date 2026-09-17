import type { GameState } from '../../simulation/types';
import { useGame } from '../../state/store';
import { money, pct } from '../format';
import { GameIcon } from '../shared/Icons';
export function MarketResults({game}:{game:GameState}) {
  const r=game.marketResult!,p=game.products.find(p=>p.id===r.productId);
  return <main className="market-results"><article><span className="eyebrow">Launch report / {game.company.name}</span><div className="result-mark"><GameIcon name="products"/></div><h1>{p?.name} is live.</h1><p>{r.outcome}</p><div className="result-share"><strong>{pct(r.share)}</strong><span>Market share</span></div><div className="result-ledger">{[['Customer tiles',`${r.capturedTiles} · ${r.tileValue} total value`],['Customers',Math.round(r.users).toLocaleString()],['Product revenue / week',money(r.revenue)],['Inference cost / week',money(r.inference)],['Expected gross profit / week',money(r.revenue-r.inference)],['Hype gained',`+${r.hype}`]].map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><p className="result-note">{r.revenue>0?'Revenue arrives weekly. API credits cover inference before cash.':'No customers captured this time. Try more pieces, stronger capture, or a wider route on your next launch.'}</p><button className="primary-action" onClick={()=>useGame.getState().dispatch({type:'continueMarketResults'})}>Continue to your company →</button><small>Company time remains paused.</small></article></main>;
}
