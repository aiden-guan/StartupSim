import { Bevel } from '../geometry/Bevel';
import { officeScale } from './officeScale';
import { computeRackLayout, requestedComputeRacks } from './computeLayout';
import type { EnvironmentVisualState } from './environmentVisualState';
import { ChipBench, CloudConsole, ComputeStatusWall, CoolingUnit, GpuShippingBox, ServerRackBank } from '../props/ComputeProps';
import { AutonomousLabCell, CheckpointStack, ModelTrainingStation, ResearchBench, ResearchBoard } from '../props/ResearchProps';
import { GeneralRobot, MachineField, RobotAssemblyField, RobotPrototype, RobotTestBay } from '../props/RoboticsProps';
import { AgentTerminal, AutonomousCeoStation, AutonomousWorkstations, AutonomyStatusWall, WorkstationField } from '../props/AutonomyProps';
import { VerticalKit } from '../props/VerticalProps';
import { BurnoutDeskClutter, HypeArea, RunwayCorner } from '../props/StateProps';

type Quality='low'|'medium'|'high';
export function DynamicEnvironment({state,quality}:{state:EnvironmentVisualState;quality:Quality}) {
  const level=state.officeLevel,{width:w,depth:d}=officeScale(level);
  const detail=quality==='high'?1:quality==='medium'?.65:.38;
  const computeX=w/2-(level>=4?8:level>=2?5:1.5);
  const computeZ=-d/2+(level>=4?7:level>=2?3.3:2.2);
  const labX=-w/2+(level>=4?8:level>=2?4.6:2.2);
  const labZ=-d/2+(level>=4?7:level>=2?3.5:2.4);
  const verticalZ=d/2-(level>=4?9:level>=2?4.5:2.5);
  const rackPlan=computeRackLayout(level,requestedComputeRacks(state));
  const robotX=w/2-(level>=4?15:level>=3?9:3.5);
  const robotZ=level>=4?2:level>=3?3:0;
  const hasResearch=state.hasResearchLab||state.hasFoundationModel||state.hasAutonomousLab;
  return <group>
    {level>=3&&<>
      <Bevel position={[level>=5?computeX-12:level===4?computeX-4:computeX-1,.015,computeZ+1.4]} size={[level>=5?34:level===4?16:9,.025,level>=5?16:level===4?11:7]} color="#aeb9bb"/>
      {hasResearch&&<Bevel position={[labX+(level>=5?2:level>=4?2:1),.016,labZ+1]} size={[level>=5?18:level===4?15:11,.026,level>=5?11:level===4?10:7]} color="#9fb8b2"/>}
      {state.roboticsTier>=2&&<Bevel position={[level>=5?robotX-4:robotX,.017,robotZ]} size={[level>=5?24:level===4?15:9,.027,level>=5?16:level===4?10:7]} color="#9eafb1"/>}
      {level>=4&&state.automationTier>=2&&<Bevel position={[level>=5?12:10,.014,level>=5?15:14]} size={[level>=5?17:14,.025,9]} color="#b7c3c1"/>}
    </>}
    {level>=1&&<group position={[computeX,0,computeZ]}>
      {state.computeTier===0?<CloudConsole position={[0,0,0]}/>:<>
        {state.rentedGpus>0&&<GpuShippingBox position={[-1,.02,level>=3?2:1]}/>}
        {rackPlan.shown>0&&<ServerRackBank position={[0,0,0]} count={rackPlan.shown} columns={rackPlan.columns} load={state.computeLoad} quality={quality}/>} 
        {state.hasGpuCluster&&<CoolingUnit position={[level>=4?2:1.5,0,0]} active={state.computeLoad>.45}/>} 
        {state.hasDataCenter&&<><CoolingUnit position={[-1.5,0,3]} active={state.computeLoad>.45}/><ComputeStatusWall position={[level>=3?1.5:0,0,level>=3?3:2] } load={state.computeLoad}/></>}
        {state.hasCustomChip&&<ChipBench position={[level>=3?-2:0,0,level>=3?5:2]}/>}
      </>}
    </group>}

    {level===0&&state.computeTier>0&&<group position={[4.2,0,-2.1]}>
      <GpuShippingBox position={[0,.02,0]}/>
      {rackPlan.shown>0&&<ServerRackBank position={[0,0,0]} count={rackPlan.shown} columns={rackPlan.columns} load={state.computeLoad} quality={quality}/>} 
    </group>}

    {hasResearch&&<group position={[labX,0,labZ]}>
      {state.hasResearchLab&&<><ResearchBench position={[0,0,0]}/>{level>=2&&<ResearchBoard position={[2.1,0,-1]}/>}</>}
      {level>=3&&state.hasResearchLab&&quality!=='low'&&Array.from({length:level>=5?5:level===4?3:2},(_,i)=><ResearchBench key={i} position={[3+(i%3)*3.2,0,Math.floor(i/3)*3.2]}/>)}
      {state.hasFoundationModel&&<><ModelTrainingStation position={[level>=3?3.5:0,0,level>=3?0:2]}/><CheckpointStack position={[level>=3?4.8:1.2,.1,level>=3?1.1:2.4]}/></>}
      {state.hasAutonomousLab&&<AutonomousLabCell position={[level>=3?2:0,0,level>=3?4:3]}/>}
    </group>}

    {state.roboticsTier>0&&<group position={[robotX,0,robotZ]}>
      {state.roboticsTier===1&&<RobotPrototype position={[0,0,0]}/>}
      {state.roboticsTier>=2&&<RobotTestBay position={[0,0,0]}/>}
      {state.roboticsTier>=3&&<GeneralRobot position={[level>=3?3:1.5,0,1.5]}/>}
      {level>=5&&state.roboticsTier>=2&&quality==='high'&&<RobotTestBay position={[-5,0,-5]}/>}
      {level>=3&&state.roboticsTier>=2&&<RobotAssemblyField position={[level>=5?-9:level===4?-5:-2,0,level>=5?-5:level===4?-4:-2]} count={quality==='low'?2:quality==='medium'?level>=5?4:3:level>=5?8:level===4?5:3}/>}
      {level>=3&&state.roboticsTier>=2&&<MachineField position={[level>=5?-14:level===4?-6:-3,0,level>=5?0:level===4?2:4]} columns={level>=5?(quality==='high'?8:quality==='medium'?6:3):level===4?(quality==='high'?5:3):3} rows={level>=5?(quality==='high'?3:2):level===4?2:1}/>}
    </group>}

    {(state.hasAgents||state.automationTier>0)&&<group position={[level>=4?3:level>=2?1:0,0,level>=4?d*.12:level>=2?d*.19:2]}>
      {state.hasAgents&&<AgentTerminal position={[0,0,0]}/>}
      {state.hasComputerUse&&level>=2&&<AutonomousWorkstations position={[2.3,0,0]} count={quality==='low'?1:2}/>}
      {state.automationTier>=1&&level>=2&&<AutonomyStatusWall position={[0,0,-2]}/>}
      {state.automationTier>=2&&level>=3&&<AutonomousWorkstations position={[0,0,3]} count={quality==='high'?3:1}/>}
      {state.automationTier>=3&&<AutonomousCeoStation position={[level>=4?0:1,0,level>=4?6:3]}/>}
    </group>}
    {level>=4&&state.automationTier>=2&&<WorkstationField position={[level>=5?12:10,0,level>=5?15:14]} count={quality==='high'?16:quality==='medium'?10:5} autonomous/>}

    {state.prominentVerticals.slice(0,level===0?1:level===1?1:2).map((id,i)=><VerticalKit key={id} id={id} position={[i===0?-w/2+(level>=4?9:level>=2?4.5:2):w/2-(level>=4?9:4.5),0,verticalZ]} secondary={level===0||(id==='robotics'&&state.roboticsTier>=2)}/>)}
    {quality==='high'&&level>=3&&state.secondaryVerticals.slice(0,Math.min(5,level)).map((id,i)=><VerticalKit key={id} id={id} position={[-w/2+3+i*1.3,0,d/2-2.1]} secondary/>)}

    {state.runwayPressure&&<RunwayCorner position={[level>=3?-w/2+2:-w/2+1.2,0,-d/2+1.4]}/>}
    {state.hypeTier>0&&<HypeArea position={[level>=3?w/2-4:w/2-2.5,0,d/2-(level>=3?3:1.6)]} tier={state.hypeTier}/>}
    {state.burnedOutWorkers>0&&quality!=='low'&&Array.from({length:Math.min(3,state.burnedOutWorkers)},(_,i)=><BurnoutDeskClutter key={i} position={[-w/2+(level>=4?7:level>=2?4:2)+i*2.2,.79,-d/2+(level>=4?10:level>=2?6:3)]}/>)}
    {level>=4&&<WorkstationField position={[0,3.4,-d/2+1]} count={Math.max(4,Math.min(quality==='low'?6:quality==='medium'?12:level>=5?24:16,Math.ceil(state.employeeCount*.24)))} autonomous={state.automationTier>=2}/>}
    {level>=3&&quality!=='low'&&state.teamDensity>.18&&Array.from({length:Math.min(8,Math.round(state.teamDensity*10*detail))},(_,i)=><Bevel key={i} position={[-w*.18+i*1.5,.82,d*.03]} size={[.25,.12,.3]} color={i%2?'#2b3e55':'#ded3c3'}/>)}
  </group>;
}
