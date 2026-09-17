import type { CharacterLook } from '../../simulation/types';

/** Lightweight portraits share the world character's exact appearance, without a WebGL context per card. */
export function CharacterPortrait({look,robot=false,className=''}:{look:CharacterLook;robot?:boolean;className?:string}) {
  const bald=look.hairStyle==='bald'||look.hairStyle==='shaved';
  return <div className={`character-portrait ${className}`} aria-hidden="true">
    <svg viewBox="0 0 80 90" role="img">
      <path d="M0 0H80V90H0Z" fill="#d6ddcf"/>
      <path d="M8 90V73L23 62H57L72 73V90" fill={robot?'#8b969d':look.top}/>
      <path d="M33 55H47V68L40 72L33 68" fill={look.skin}/>
      <path d="M21 24L28 15H53L60 25V49L52 60H29L21 49Z" fill={robot?'#c4ccd0':look.skin}/>
      <path d="M21 37H17V47L23 50M59 37H63V47L58 50" fill={look.skin}/>
      {!bald&&<path d={look.hairStyle==='curly'||look.hairStyle==='messy'?'M20 38L18 25L23 21L22 17L30 13L37 16L43 11L50 15L57 14L63 23L59 38L54 32V26L29 28L25 36Z':'M20 36L19 24L27 15L45 12L58 20L61 29L57 37L53 27L44 25L30 29L25 26L25 37Z'} fill={look.hair}/>}
      <path d="M32 38V43M49 38V43" stroke="#252b30" strokeWidth="3" strokeLinecap="round"/>
      <path d="M37 51H44" stroke="#995f49" strokeWidth="1.3"/>
      {look.glassesId!=='none'&&<g fill="none" stroke="#30363a" strokeWidth="1.7"><rect x="25" y="34" width="13" height="12" rx={look.glassesId==='round'?6:1}/><rect x="43" y="34" width="13" height="12" rx={look.glassesId==='round'?6:1}/><path d="M38 38H43M21 36H25M56 36H60"/></g>}
      {(look.topId==='blazer'||look.topId==='jacket')&&<path d="M30 63L39 79L33 90H49L42 79L51 63L44 69H36Z" fill="#dbe0df"/>}
      {robot&&<path d="M28 31H54V46H28Z" fill="#2e404c"/>}
      {robot&&<path d="M34 35V41M48 35V41" stroke="#68c4ed" strokeWidth="4"/>}
    </svg>
  </div>;
}
