import { modelVisualFor } from "../../visuals/registry";
import { Bevel } from "../geometry/Bevel";

const colors = {
  navy: "#2b3e55",
  paper: "#ded3c3",
  sage: "#5c6e5a",
  copper: "#d06a3c",
  screen: "#5599ff",
  dark: "#282c30",
};

function Core({ tier }: { tier: 1 | 2 }) {
  return <group>{[0, Math.PI / 2].map((rotation) => <mesh key={rotation} rotation={[rotation, 0, rotation]}><torusGeometry args={[tier === 2 ? .78 : .64, .08, 8, 24]} /><meshStandardMaterial color={colors.screen} roughness={.82} /></mesh>)}<mesh><octahedronGeometry args={[.42, 0]} /><meshStandardMaterial color={colors.navy} roughness={.85} /></mesh></group>;
}

export function ModelVisual({ modelId }: { modelId: string }) {
  const visual = modelVisualFor(modelId);
  const tier = visual.tier;
  return <group position={[0, .62, 0]}>
    {visual.provider === "openbrain" && <Core tier={tier} />}
    {visual.provider === "claudius" && <><Bevel size={[tier === 2 ? 1.25 : 1, 1.35, .85]} color={colors.paper}/><Bevel position={[0,.05,.44]} size={[.6,.92,.04]} color={colors.navy}/><Bevel position={[0,.05,.48]} size={[.08,.62,.02]} color={colors.copper}/></>}
    {visual.provider === "metamind" && <>{[-.48,0,.48].map((x)=><Bevel key={x} position={[x,0,0]} size={[.12,tier===2?1.4:1.05,1]} color={colors.sage}/>)}{[-.45,.45].map((y)=><Bevel key={y} position={[0,y,0]} size={[1.1,.12,1]} color={colors.paper}/>)}</>}
    {visual.provider === "macrosoft" && <>{[-.42,.42].flatMap((x)=>[-.42,.42].map((y)=><Bevel key={`${x}-${y}`} position={[x,y,0]} size={[.68,.68,.8]} color={tier===2?colors.screen:colors.paper}/>))}</>}
    {visual.provider === "xeno" && <><mesh rotation={[0,.78,0]}><octahedronGeometry args={[tier===2?1:.78,0]}/><meshStandardMaterial color={colors.dark} roughness={.8}/></mesh><Bevel position={[0,0,.58]} size={[.12,1.1,.06]} color={colors.copper}/></>}
    {visual.provider === "you" && <><Bevel size={[1.65,.18,1.1]} color={colors.sage}/>{[-.52,0,.52].map((x)=><Bevel key={x} position={[x,.23,0]} size={[.32,.28,.38]} color={x===0?colors.copper:colors.dark}/>)}<Bevel position={[0,.46,-.25]} size={[tier===2?1.45:1,.12,.16]} color={colors.screen}/></>}
  </group>;
}
