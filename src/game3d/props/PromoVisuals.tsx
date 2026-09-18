import { Composition, Box } from "./products/Parts";
import { Bevel } from "../geometry/Bevel";
import { ConferenceBadge, Laptop } from "./Furniture";
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
  "viral-demo": <><Composition parts={[{kind:'phone',at:[-.35,0,0],scale:1.05}]}/><mesh position={[.48,.88,-.08]}><torusGeometry args={[.32,.055,8,20]}/><meshStandardMaterial color={paper} roughness={.9}/></mesh><Box p={[.48,.43,-.08]} s={[.07,.86,.07]}/><Box p={[.48,.045,-.08]} s={[.55,.09,.42]} c={navy}/></>,
  benchmark: <><Bevel position={[0, .78, 0]} size={[2.2, 1.45, .12]} color={paper} />{[.45,.78,1.05].map((height,index)=><Bevel key={height} position={[-.62+index*.62,height/2+.16,.09]} size={[.34,height,.08]} color={[sage,screen,copper][index]!}/>) }<Bevel position={[0,.12,.05]} size={[2.45,.2,.72]} color={navy}/></>,
  podcast: <><Composition parts={[{kind:'headset',at:[-.48,0,0],scale:1.1},{kind:'mic',at:[.46,0,.05],scale:1.15}]}/></>,
  conference: <><Stage large/><Box p={[-.72,.58,.06]} s={[.07,.68,.07]} c={charcoal}/><group scale={2.5} position={[-.72,.72,.08]}><ConferenceBadge position={[0,0,0]}/></group><Bevel position={[.58,.42,.28]} size={[.55,.84,.38]} color={copper}/><Bevel position={[.58,.86,.28]} size={[.75,.08,.55]} color={paper}/></>,
  influencer: <><Composition parts={[{kind:'camera',at:[-.62,0,.18],scale:.95},{kind:'phone',at:[.46,0,0],scale:1.15}]}/><Box p={[0,.035,0]} s={[2,.07,1.1]} c={wood}/><Box p={[0,.86,-.43]} s={[1.9,1.65,.06]} c={paper}/></>,
  keynote: <><Stage large/><Bevel position={[0,.95,-.42]} size={[2.2,.72,.05]} color={screen} emissive={screen} emissiveIntensity={.08}/><Bevel position={[-.68,.52,.3]} size={[.42,1.04,.42]} color={copper}/>{[-.95,.95].map(x=><Bevel key={x} position={[x,.22,.35]} size={[.08,.44,.08]} color={paper}/>)}</>,
  "agi-soon": <><Bevel position={[0,.84,0]} size={[2.1,1.45,.12]} color={navy}/><mesh position={[0,.85,.08]}><torusGeometry args={[.48,.045,6,16]}/><meshStandardMaterial color={screen} emissive={screen} emissiveIntensity={.16} roughness={.8}/></mesh>{[-.48,0,.48].map((x,index)=><mesh key={x} position={[x,.85+(index-1)*.24,.09]}><sphereGeometry args={[.09,10,8]}/><meshStandardMaterial color={index===1?copper:paper} roughness={.9}/></mesh>)}<Bevel position={[0,.08,.08]} size={[2.4,.16,.75]} color={sage}/></>,
} satisfies Record<keyof typeof promoVisualIds, ReactNode>;

export function PromoVisual({ id }: { id: string }) {
  const visual = visualByPromo[id as keyof typeof visualByPromo];
  if (!visual) throw new Error(`Missing promotion miniature definition: ${id}`);
  return <group>{visual}</group>;
}
