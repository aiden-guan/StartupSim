import { Bevel } from "../geometry/Bevel";
import { ConferenceBadge, Headphones, Laptop, Smartphone } from "./Furniture";
import { promoVisualIds } from "../../visuals/registry";
import type { ReactNode } from "react";

const navy = "#2b3e55";
const paper = "#ded3c3";
const copper = "#d06a3c";
const sage = "#5c6e5a";
const charcoal = "#282c30";
const screen = "#5599ff";
const wood = "#c89e6e";

function Stage({ large = false }: { large?: boolean }) {
  return <>
    <Bevel position={[0, .12, 0]} size={[large ? 2.6 : 1.9, .24, 1.2]} color={navy} />
    <Bevel position={[0, .78, -.48]} size={[large ? 2.3 : 1.55, 1.1, .08]} color={paper} />
  </>;
}

const visualByPromo = {
  launch: <><Stage /><Laptop position={[0, .3, .05]} /><Bevel position={[0, .24, .52]} size={[.8, .1, .22]} color={copper} /></>,
  "viral-demo": <><group scale={2.4}><Smartphone position={[0, .31, 0]} /></group><Bevel position={[0, .45, -.08]} size={[.12, .9, .12]} color={charcoal} /><mesh position={[.48, .78, -.08]}><torusGeometry args={[.32, .055, 8, 20]} /><meshStandardMaterial color={paper} roughness={.9} /></mesh><Bevel position={[.48, .43, -.08]} size={[.08, .7, .08]} color={charcoal} /></>,
  benchmark: <><Bevel position={[0, .78, 0]} size={[2.2, 1.45, .12]} color={paper} />{[.45,.78,1.05].map((height,index)=><Bevel key={height} position={[-.62+index*.62,height/2+.16,.09]} size={[.34,height,.08]} color={[sage,screen,copper][index]!}/>) }<Bevel position={[0,.12,.05]} size={[2.45,.2,.72]} color={navy}/></>,
  podcast: <><group scale={2.1} position={[-.46,.36,0]}><Headphones position={[0,0,0]}/></group><Bevel position={[.42,.62,0]} size={[.24,.74,.24]} color={charcoal}/><mesh position={[.42,1.08,0]}><capsuleGeometry args={[.16,.38,6,10]}/><meshStandardMaterial color={navy} roughness={.88}/></mesh><Bevel position={[.42,.18,0]} size={[.7,.08,.52]} color={wood}/></>,
  conference: <><Stage large/><group scale={2.5} position={[-.72,.72,.08]}><ConferenceBadge position={[0,0,0]}/></group><Bevel position={[.58,.42,.28]} size={[.55,.84,.38]} color={copper}/><Bevel position={[.58,.86,.28]} size={[.75,.08,.55]} color={paper}/></>,
  influencer: <><group scale={2.35} position={[-.42,.7,0]}><Smartphone position={[0,0,0]}/></group><mesh position={[.48,.75,0]}><torusGeometry args={[.36,.065,8,20]}/><meshStandardMaterial color={paper} roughness={.9}/></mesh><Bevel position={[.48,.36,0]} size={[.08,.72,.08]} color={charcoal}/><Bevel position={[.48,.06,0]} size={[.75,.08,.4]} color={navy}/></>,
  keynote: <><Stage large/><Bevel position={[0,.95,-.42]} size={[2.2,.72,.05]} color={screen} emissive={screen} emissiveIntensity={.08}/><Bevel position={[-.68,.52,.3]} size={[.42,1.04,.42]} color={copper}/>{[-.95,.95].map(x=><Bevel key={x} position={[x,.22,.35]} size={[.08,.44,.08]} color={paper}/>)}</>,
  "agi-soon": <><Bevel position={[0,.84,0]} size={[2.1,1.45,.12]} color={navy}/><mesh position={[0,.85,.08]}><torusGeometry args={[.48,.045,6,16]}/><meshStandardMaterial color={screen} emissive={screen} emissiveIntensity={.16} roughness={.8}/></mesh>{[-.48,0,.48].map((x,index)=><mesh key={x} position={[x,.85+(index-1)*.24,.09]}><sphereGeometry args={[.09,10,8]}/><meshStandardMaterial color={index===1?copper:paper} roughness={.9}/></mesh>)}<Bevel position={[0,.08,.08]} size={[2.4,.16,.75]} color={sage}/></>,
} satisfies Record<keyof typeof promoVisualIds, ReactNode>;

export function PromoVisual({ id }: { id: string }) {
  const visual = visualByPromo[id as keyof typeof visualByPromo];
  if (!visual) throw new Error(`Missing promotion miniature definition: ${id}`);
  return <group>{visual}</group>;
}
