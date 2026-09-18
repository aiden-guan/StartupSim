import type { Vector3Tuple } from 'three';
import { Box, Cylinder, Composition, ink, navy, paper, wood, steel, orange } from './products/Parts';
import { Chair, CoffeeMachine, Couch, Desk, Fridge, Mug, Plant } from './Furniture';

export function CoffeeStation({ tier, position = [0, 0, 0] }: { tier: number; position?: Vector3Tuple }) {
  return (
    <group position={position}>
      <CoffeeMachine position={[tier === 0 ? 0 : -0.35, 0, 0]} />
      {tier >= 1 && (
        <>
          <Box p={[0.41, 0.17, -0.1]} s={[0.25, 0.34, 0.27]} c={steel} />
          <Cylinder p={[0.41, 0.41, -0.1]} r={0.12} h={0.15} c={ink} />
          <Mug position={[0.4, 0.06, 0.2]} />
        </>
      )}
      {tier >= 2 && (
        <>
          <Box p={[0, 0.26, -0.35]} s={[2.05, 0.55, 0.06]} c={wood} />
          <Box p={[0, 0.57, -0.28]} s={[2.1, 0.07, 0.26]} c={navy} />
          {[-0.72, 0.1, 0.72].map((x) => (
            <Cylinder key={x} p={[x, 0.72, -0.27]} r={0.1} h={0.23} c={paper} />
          ))}
          <Cylinder p={[0.8, 0.09, 0.12]} r={0.13} h={0.16} c={paper} />
        </>
      )}
    </group>
  );
}

export function FoodStation({ tier, position = [0, 0, 0] }: { tier: number; position?: Vector3Tuple }) {
  return (
    <group position={position}>
      <Fridge position={[tier === 0 ? 0 : -0.8, 0, 0]} />
      {tier >= 1 && (
        <>
          <Box p={[0.45, -0.235, 0]} s={[1.25, 0.88, 0.73]} c={paper} />
          <Box p={[0.45, 0.235, 0]} s={[1.34, 0.07, 0.8]} c={wood} />
          {[0.13, 0.65].map((x) => (
            <group key={x}>
              <Box p={[x, 0.295, 0.03]} s={[0.4, 0.07, 0.44]} c={steel} />
              <Cylinder p={[x, 0.355, 0.03]} r={0.14} h={0.09} c={tier === 2 ? ink : orange} />
            </group>
          ))}
        </>
      )}
      {tier >= 2 && (
        <>
          <Box p={[0.45, -0.215, 0.38]} s={[0.9, 0.48, 0.04]} c={ink} />
          <Box p={[0.45, -0.215, 0.41]} s={[0.7, 0.28, 0.025]} c={steel} />
          <Box p={[0.45, 0.885, -0.32]} s={[1.34, 0.18, 0.43]} c={steel} />
          {[-0.12, 1.02].map((x) => (
            <Box key={x} p={[x, 0.555, -0.35]} s={[0.045, 0.55, 0.05]} c={steel} />
          ))}
          <Box p={[0.45, 1.115, -0.35]} s={[0.3, 0.3, 0.22]} c={steel} />
        </>
      )}
    </group>
  );
}

/** Grounded tier compositions. Shared office furniture keeps its established proportions. */
export function CultureDetails({id,tier}:{id:string;tier:number}) {
  if(id==='coffee') return <>
    <Box p={[0,.43,0]} s={[tier===2?2.1:1.35,.86,.7]} c={paper}/><Box p={[0,.89,0]} s={[tier===2?2.2:1.45,.08,.77]} c={wood}/>
    <CoffeeStation tier={tier} position={[0, .93, 0]}/>
  </>;
  if(id==='food') return <>
    <FoodStation tier={tier} position={[0, .675, 0]}/>
  </>;
  if(id==='rest') return tier===0?<>
    <Box p={[0,.24,0]} s={[1.75,.48,.9]} c={paper}/><Box p={[0,.54,0]} s={[1.6,.15,.81]} c={navy}/><Box p={[-.51,.65,0]} s={[.4,.13,.65]} c={paper}/>
    <Box p={[-.88,.9,0]} s={[.1,1.4,1]} c={paper}/><Box p={[-.51,1.57,0]} s={[.85,.1,1]} c={paper}/><Box p={[-.51,1.1,-.46]} s={[.84,.88,.08]} c={paper}/>
  </>:tier===1?<>
    <Box p={[0,.025,0]} s={[2,.05,1.4]} c='#a5af95'/>{[-.45,.45].map(x=><Cylinder key={x} p={[x,.17,.1]} r={.31} h={.23} c={navy}/>)}<Plant position={[.74,0,-.47]} scale={.7}/><Box p={[-.73,.64,-.57]} s={[.56,1.28,.07]} c={wood}/>
  </>:<>
    <Box p={[-.25,.55,0]} s={[1.6,.17,.77]} c={navy}/><Box p={[-.83,.71,0]} s={[.4,.15,.69]} c={paper}/>{[-.83,.3].map(x=><Box key={x} p={[x,.25,0]} s={[.08,.5,.64]} c={steel}/>)}<Composition parts={[{kind:'cart',at:[.93,0,-.1],scale:.7},{kind:'scanDisplay',at:[.93,.55,-.1],scale:.48}]}/>
  </>;
  if(id==='play') return tier===0?<>
    <Box p={[0,.71,0]} s={[2.1,.08,1.1]} c='#5c6e5a'/><Box p={[0,.85,0]} s={[.025,.22,1.07]} c={paper}/>{[-.83,.83].flatMap(x=>[-.4,.4].map(z=><Box key={`${x}${z}`} p={[x,.34,z]} s={[.06,.68,.06]} c={navy}/>))}<Box p={[0,.76,0]} s={[2,.012,.018]} c={paper}/><Cylinder p={[.6,.78,.2]} r={.1} h={.025} c={orange}/>
  </>:tier===1?<>
    <group position={[-.65,0,0]}><Box p={[0,.5,0]} s={[.66,1,.6]} c={navy}/><Box p={[0,1.09,-.14]} s={[.7,.61,.32]} c={navy}/><Box p={[0,1.13,.03]} s={[.54,.37,.025]} c='#699ac0'/><Box p={[0,.8,.22]} s={[.68,.09,.27]} c={ink}/><Cylinder p={[-.15,.92,.22]} r={.045} h={.2} c={orange}/></group><group position={[.67,0,.1]} scale={.7}><Couch position={[0,0,0]}/></group>
  </>:<>
    <Desk position={[0,0,0]} color={wood}/>{[-1,1].map(x=><group key={x} position={[x,0,0]} rotation={[0,-x*Math.PI/2,0]}><Chair position={[0,0,0]} color={navy}/></group>)}{[-.45,.45].map(x=><Cylinder key={x} p={[x,.83,0]} r={.2} h={.025} c={paper}/>)}
  </>;
  if(id==='life') return tier===0?<>
    <Box p={[0,.055,0]} s={[1.5,.11,.9]} c={navy} r={.1}/><Box p={[-.12,.35,0]} s={[.65,.32,.32]} c='#ae8258'/><Box p={[.29,.53,0]} s={[.29,.35,.29]} c='#ae8258'/><Box p={[.46,.47,.06]} s={[.23,.14,.2]} c='#c49b73'/><Box p={[.3,.64,.15]} s={[.17,.28,.065]} c='#674b35'/><Box p={[.57,.5,.06]} s={[.06,.06,.1]} c={ink}/>{[-.35,.13].flatMap(x=>[-.12,.12].map(z=><Box key={`${x}${z}`} p={[x,.18,z]} s={[.1,.27,.1]} c='#ae8258'/>))}<Box p={[-.53,.48,0]} s={[.32,.09,.09]} c='#ae8258' rot={[0,0,-.6]}/><Cylinder p={[.6,.15,-.27]} r={.17} h={.12} c={steel}/>
  </>:tier===1?<><Couch position={[-.1,0,0]}/><Plant position={[1.05,0,-.12]} scale={.7}/></>:tier===2?<>
    <Box p={[0,.025,0]} s={[2.1,.05,1.4]} c='#b5beaa'/><Box p={[-.53,.32,-.18]} s={[.9,.1,.6]} c={wood}/>{[-.85,-.2].map(x=><Box key={x} p={[x,.15,-.18]} s={[.08,.3,.5]} c={wood}/>)}<Composition parts={[{kind:'seat',at:[-.6,0,.4],scale:.45}]}/><Box p={[.58,.2,0]} s={[.62,.4,.58]} c={paper}/>{[0,1,2].map(i=><Box key={i} p={[.45+i*.13,.5+i*.09,0]} s={[.2,.18,.22]} c={i===1?navy:orange}/>)}
  </>:<>
    <Box p={[0,.65,0]} s={[1.85,1.3,1.15]} c={paper}/><Box p={[0,1.36,0]} s={[2,.12,1.28]} c={navy}/><Box p={[.28,.4,.59]} s={[.35,.8,.04]} c={wood}/>{[-.57,.61].map(x=><Box key={x} p={[x,.98,.59]} s={[.32,.34,.035]} c='#a7c3cc'/>)}<Box p={[-.52,.4,.59]} s={[.4,.32,.035]} c='#a7c3cc'/><Box p={[.25,.055,.77]} s={[.6,.11,.38]} c={steel}/>
  </>;
  if(id==='transit') return <>
    <Box p={[0,.59,0]} s={[tier?2.5:2.1,.82,.86]} c={tier?paper:navy}/><Box p={[0,1.04,0]} s={[tier?2.2:1.85,.13,.78]} c={tier?ink:navy}/>{[-.6,0,.6].map(x=><Box key={x} p={[x,.78,.445]} s={[.45,.3,.03]} c='#a7c3cc'/>)}<Box p={[tier?1.26:1.06,.78,0]} s={[.025,.32,.66]} c='#a7c3cc'/>{[-.72,.72].flatMap(x=>[-.44,.44].map(z=><Cylinder key={`${x}${z}`} p={[x,.2,z]} r={.2} h={.09} c={ink} rot={[Math.PI/2,0,0]}/>))}<Box p={[tier?1.27:1.07,.4,0]} s={[.04,.09,.6]} c={orange}/>
  </>;
  if(id==='gym') return <>
    <Box p={[0,.03,0]} s={[tier?2.1:1.6,.06,1.2]} c='#819074'/>
    <Cylinder p={[tier?-.3:0,tier?.9:.28,0]} r={.035} h={1.3} rot={[0,0,Math.PI/2]} c={steel}/>{[-.58,.58].map(x=><Cylinder key={x} p={[x+(tier?-.3:0),tier?.9:.28,0]} r={.23} h={.13} c={ink} rot={[0,0,Math.PI/2]}/>)}
    {tier>0&&<>{[-.93,.35].map(x=><Box key={x} p={[x,.6,-.05]} s={[.08,1.2,.1]} c={steel}/>)}<Box p={[-.3,.4,.34]} s={[.45,.13,.9]} c={navy}/><Box p={[-.3,.22,.34]} s={[.09,.44,.75]} c={steel}/></>}
  </>;
  return null;
}
