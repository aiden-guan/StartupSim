import type { Vector3Tuple } from 'three';
import { assetUrl, KitOrGltf } from '../assets/useKitOrGltf';
import { Bevel } from '../geometry/Bevel';
import { Desk, Monitor } from './Furniture';

type Placed={position:Vector3Tuple};
const kit=(id:string,fallback:React.ReactNode)=><KitOrGltf id={id} path={assetUrl('props',`${id}.glb`)} fallback={fallback}/>;

export function AgentTerminal({position}:Placed) {
  return <group position={position}>{kit('prop_autonomy_agentTerminal_A',<group>
    <Desk position={[0,0,0]}/><Monitor position={[0,.78,-.12]}/>
    <Bevel position={[0,.79,.18]} size={[.65,.04,.29]} color="#282c30"/>
    <Bevel position={[.63,.95,-.17]} size={[.18,.29,.28]} color="#2b3e55"/>
    {[0,1,2].map(i=><Bevel key={i} position={[.63,1.03-i*.07,-.015]} size={[.07,.025,.01]} color="#5599ff" emissive="#5599ff" emissiveIntensity={.2}/>)}
  </group>)}</group>;
}

export function AutonomyStatusWall({position}:Placed) {
  return <group position={position}>{kit('prop_autonomy_statusWall_A',<group>
    {/* Grounded heavy-duty architectural floor base */}
    <Bevel position={[0, 0.04, 0]} size={[3.6, 0.08, 0.46]} color="#1c2024" radius={0.015} />
    {/* Dual heavy structural steel upright support pillars */}
    {[-1.2, 1.2].map((x) => (
      <group key={x}>
        <Bevel position={[x, 0.05, 0]} size={[0.26, 0.09, 0.58]} color="#24282e" radius={0.012} />
        <Bevel position={[x, 0.76, 0]} size={[0.08, 1.48, 0.08]} color="#3a4048" radius={0.008} />
      </group>
    ))}
    {/* Rear horizontal cross-braces */}
    <Bevel position={[0, 0.55, -0.02]} size={[2.6, 0.05, 0.04]} color="#30353c" radius={0.006} />
    <Bevel position={[0, 0.95, -0.02]} size={[2.6, 0.05, 0.04]} color="#30353c" radius={0.006} />
    {/* Lower telemetry / equipment rack unit between the pillars */}
    <Bevel position={[0, 0.38, 0]} size={[2.1, 0.56, 0.28]} color="#22262c" radius={0.016} />
    <Bevel position={[0, 0.38, 0.145]} size={[1.9, 0.44, 0.015]} color="#181b20" radius={0.008} />
    {/* Status LEDs & rack ventilation on the controller base */}
    {[-0.65, -0.45, -0.25].map((x, i) => (
      <Bevel
        key={x}
        position={[x, 0.52, 0.155]}
        size={[0.12, 0.03, 0.01]}
        color={i === 1 ? '#5c8646' : '#5599ff'}
        emissive={i === 1 ? '#5c8646' : '#5599ff'}
        emissiveIntensity={0.35}
        radius={0.003}
      />
    ))}
    {[0.42, 0.34, 0.26].map((y) => (
      <Bevel key={y} position={[0.25, y, 0.153]} size={[1.1, 0.02, 0.008]} color="#2d333b" radius={0.002} />
    ))}

    {/* Main screen frame */}
    <Bevel position={[0, 1.55, 0]} size={[3.5, 1.8, 0.12]} color="#282c30" radius={0.02} />
    {/* Top header bar with glowing accent */}
    <Bevel position={[0, 2.38, 0.05]} size={[1.6, 0.08, 0.025]} color="#1e2329" radius={0.006} />
    <Bevel position={[0, 2.38, 0.065]} size={[0.6, 0.022, 0.008]} color="#5599ff" emissive="#5599ff" emissiveIntensity={0.5} radius={0.002} />

    {/* 3 Metric Displays */}
    {[-1, 0, 1].map((x, i) => (
      <group key={x} position={[x, 1.55, 0.073]}>
        <Bevel size={[0.87, 1.45, 0.015]} color="#192638" radius={0.008} />
        <Bevel position={[0, 0.52, 0.014]} size={[0.72, 0.08, 0.009]} color="#1e3450" radius={0.003} />
        <Bevel position={[-0.15, 0.52, 0.02]} size={[0.32, 0.03, 0.006]} color="#5599ff" emissive="#5599ff" emissiveIntensity={0.3} radius={0.002} />
        <Bevel position={[0, 0.34, 0.014]} size={[0.62, 0.055, 0.009]} color="#5599ff" emissive="#5599ff" emissiveIntensity={0.2} />
        {[0, 1, 2].map((j) => (
          <Bevel
            key={j}
            position={[-0.22 + j * 0.21, -0.24 + j * 0.12, 0.016]}
            size={[0.08, 0.32 + j * 0.12, 0.01]}
            color={i === 1 ? '#5c6e5a' : '#1e78ff'}
          />
        ))}
      </group>
    ))}
  </group>)}</group>;
}

export function AutonomousWorkstations({position,count=3}:Placed&{count?:number}) {
  return <group position={position}>{Array.from({length:count},(_,i)=><AgentTerminal key={i} position={[i*2,0,0]}/>)}</group>;
}

/** Cheap visual-only mezzanine field; agents stay on the ground plane. */
export function WorkstationField({position,count,autonomous}:{position:Vector3Tuple;count:number;autonomous:boolean}) {
  return <group position={position}>{Array.from({length:count},(_,i)=>{
    const x=(i%8)*1.55-5.4,z=Math.floor(i/8)*1.5;
    return <group key={i} position={[x,0,z]}>
      <Bevel position={[0,.7,0]} size={[1.12,.08,.58]} color="#c89e6e"/>
      <Bevel position={[0,1.04,-.16]} size={[.55,.52,.055]} color="#282c30"/>
      <Bevel position={[0,1.04,-.128]} size={[.44,.39,.012]} color={autonomous?'#5599ff':'#2b3e55'} emissive={autonomous?'#5599ff':undefined} emissiveIntensity={.13}/>
      {!autonomous&&<Bevel position={[0,.4,.64]} size={[.36,.6,.35]} color="#33373b"/>}
    </group>;
  })}</group>;
}

export function AutonomousCeoStation({position}:Placed) {
  return <group position={position}>{kit('set_autonomy_ceoStation_L3',<group>
    <Bevel position={[0,.04,0]} size={[4,.08,3.2]} color="#b5c0be"/>
    <Bevel position={[0,1.65,-1.15]} size={[3.7,2.5,.15]} color="#2b3e55"/>
    {Array.from({length:5},(_,i)=><group key={i} position={[-1.3+i*.65,1.8,-1.06]}>
      <Bevel size={[.29,.29,.015]} color={i===2?'#e06b3a':'#5599ff'} emissive="#5599ff" emissiveIntensity={.12}/>
      {i<4&&<Bevel position={[.32,-.22,.008]} size={[.28,.03,.01]} color="#dedede"/>}
    </group>)}
    <Desk position={[0,0,.55]} standing/>
    <Bevel position={[0,1.02,.5]} size={[.95,.06,.6]} color="#282c30"/>
    <Bevel position={[0,1.055,.5]} size={[.6,.015,.34]} color="#5599ff" emissive="#5599ff" emissiveIntensity={.16}/>
  </group>)}</group>;
}
