import { useState } from 'react';
import { recruitingChannels } from '../../data/recruiting';
import { offices } from '../../data/offices';
import { traitById } from '../../data/traits';
import type { Employee, GameState } from '../../simulation/types';
import { useGame } from '../../state/store';
import { money } from '../format';
import { CharacterPortrait } from '../shared/CharacterPortrait';
import { GameButton } from '../shared/controls';
function EmployeeDetails({employee:w,game}:{employee:Employee;game:GameState}) {
  const dispatch=useGame(s=>s.dispatch), task=game.tasks.find(t=>t.id===w.taskId);
  return <div className="employee-details"><div className="employee-identity"><CharacterPortrait look={w.look} robot={w.role==='robot'}/><div><span className="eyebrow">{w.role}</span><h3>{w.name}</h3><p>{w.title}</p></div></div><div className="employee-status"><i className={w.burnoutDays?'resting':''}/>{w.burnoutDays?`Resting for ${w.burnoutDays} days`:task?task.name:'Available for a project'}</div><div className="skill-bars">{Object.entries(w.skills).map(([skill,n])=><div key={skill}><span>{skill}</span><i><b style={{width:`${Math.min(100,n*10)}%`}}/></i><strong>{n.toFixed(1)}</strong></div>)}</div><div className="employee-facts"><div><small>Salary / year</small><strong>{money(w.salary)}</strong></div><div><small>Happiness</small><strong>{w.happiness.toFixed(1)} / 10</strong></div><div><small>Burnout risk</small><strong>{Math.round(w.burnoutRisk*100)}%</strong></div><div><small>Location</small><strong>{w.remote?'Remote':'In the office'}</strong></div></div><div className="trait-list">{w.traits.map(t=><p key={t}><b>{traitById[t]?.name??t}</b><span>{traitById[t]?.description}</span></p>)}</div><GameButton onClick={()=>useGame.getState().setDrawer('tasks')}>Assign to a project →</GameButton>{w.role!=='founder'&&<GameButton tone="danger" disabled={w.role==='cofounder'&&game.onboarding.tutorialEnabled&&!game.company.seenMarket} title={game.onboarding.tutorialEnabled&&!game.company.seenMarket?'Keep your cofounder through the first launch':'End employment'} onClick={()=>dispatch({type:'fire',workerId:w.id})}>Let go</GameButton>}</div>;
}
export function PeoplePanel({game}:{game:GameState}) {
  const [id,setId]=useState(game.employees[0]?.id);
  const selected=game.employees.find(w=>w.id===id)??game.employees[0];
  return <div className="people-workspace"><div className="roster"><span className="eyebrow">{game.employees.length} people · {offices[game.company.officeLevel]?.capacity} seats</span>{game.employees.map(w=><button key={w.id} aria-pressed={w.id===selected?.id} onClick={()=>setId(w.id)}><CharacterPortrait look={w.look}/><div><strong>{w.name}</strong><small>{w.burnoutDays?'Resting':w.taskId?'Working':w.title}</small></div></button>)}{game.unlocks.hiring&&<GameButton onClick={()=>useGame.getState().setDrawer('hiring')}>+ Recruit someone</GameButton>}</div>{selected&&<EmployeeDetails employee={selected} game={game}/>}</div>;
}
export function EmployeeInspector({game}:{game:GameState}) {
  const id=useGame(s=>s.selectedEmployeeId),select=useGame(s=>s.selectEmployee);
  const employee=game.employees.find(w=>w.id===id);
  if(!employee||game.pendingMentor)return null;
  return <aside className="employee-inspector" aria-label="Employee inspector"><button className="inspector-close" aria-label="Close employee inspector" onClick={()=>select(null)}>✕</button><EmployeeDetails employee={employee} game={game}/></aside>;
}
export function HiringPanel({game}:{game:GameState}) {
  const dispatch=useGame(s=>s.dispatch),[offers,setOffers]=useState<Record<string,number>>({});
  const full=game.employees.length>=(offices[game.company.officeLevel]?.capacity??6);
  return <div className="hiring-workspace"><div className="workspace-intro"><div><span className="eyebrow">Good people build good companies</span><h3>Find your next teammate.</h3></div><span>{game.employees.length} / {offices[game.company.officeLevel]?.capacity} seats</span></div>{full&&<p className="inline-warning">Office full. Expand headquarters before making another hire.</p>}
    <div className="recruiting-layout"><aside className="recruiting-channels"><span className="eyebrow">Recruiting channels</span>{recruitingChannels.filter(c=>!c.robots||game.company.technologies.includes('agents')).map(c=>{
      const reason=game.hiring.cooldownDays>0?`Available in ${game.hiring.cooldownDays} days`:game.company.cash<c.cost?`Need ${money(c.cost-game.company.cash)} more`:'';
      return <button key={c.id} data-tutorial={c.id==='network'?'recruit-network':undefined} disabled={!!reason} title={reason||c.description} onClick={()=>dispatch({type:'recruit',channelId:c.id})}><strong>{c.name}<b>{money(c.cost)}</b></strong><small>{reason||c.description}</small></button>;
    })}</aside><div className="candidate-stack">{!game.hiring.candidates.length&&<div className="empty-state"><h3>{game.stats.employeesHired?'The team is growing.':'A warm introduction goes a long way.'}</h3><p>{game.stats.employeesHired?'Assign your new teammate to a project.':'Choose a channel to receive candidate dossiers.'}</p>{game.stats.employeesHired>0&&<GameButton onClick={()=>useGame.getState().setDrawer('tasks')}>View projects →</GameButton>}</div>}{game.hiring.candidates.map((c,i)=>{
      const salary=offers[c.employee.id]??c.minSalary;
      return <article className="candidate-dossier" key={c.employee.id} data-tutorial={i===0?'candidate-dossier':undefined}><div className="dossier-heading"><span className="eyebrow">Candidate {String(i+1).padStart(2,'0')}</span><span>{c.personality}</span></div><div className="employee-identity"><CharacterPortrait look={c.employee.look}/><div><h3>{c.employee.name}</h3><p>{c.employee.title}</p><small>Asking {money(c.minSalary)} / year</small></div></div><div className="candidate-skills">{Object.entries(c.employee.skills).map(([skill,n])=><div key={skill}><small>{skill}</small><b>{n.toFixed(1)}</b></div>)}</div><div className="trait-list">{c.employee.traits.map(t=><span key={t}>{traitById[t]?.name??t}</span>)}</div><label className="salary-control">Annual offer <span><button aria-label={`Lower offer for ${c.employee.name}`} onClick={()=>setOffers({...offers,[c.employee.id]:Math.max(0,salary-5000)})}>−</button><output>{money(salary)}</output><button aria-label={`Raise offer for ${c.employee.name}`} onClick={()=>setOffers({...offers,[c.employee.id]:salary+5000})}>+</button></span></label><small>{salary>=c.minSalary?'Meets their asking salary':`Below asking · ${Math.round(Math.max(0,salary/c.minSalary)*100)}% acceptance chance`}</small><footer><GameButton onClick={()=>dispatch({type:'passCandidate',candidateId:c.employee.id})}>Pass</GameButton><GameButton tone="primary" disabled={full} title={full?'Office full · expand headquarters':'Make this salary offer'} onClick={()=>dispatch({type:'hire',candidateId:c.employee.id,salary})}>Hire {c.employee.name.split(' ')[0]} →</GameButton></footer></article>;
    })}</div></div></div>;
}
