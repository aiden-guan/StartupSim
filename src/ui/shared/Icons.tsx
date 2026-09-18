import { primitiveIconPaths } from './PrimitiveIcons';

export function GameIcon({name,className=''}:{name:string;className?:string}) {
  const paths:Record<string,string>={
    products:'M4 7L12 3L20 7V17L12 21L4 17ZM4 7L12 11L20 7M12 11V21',
    team:'M9 12A4 4 0 1 0 9 4A4 4 0 0 0 9 12M3 21V18Q3 14 9 14Q15 14 15 18V21M17 5Q23 8 17 11M18 14Q22 15 22 19',
    research:'M7 3H17M9 3V10L3 20H21L15 10V3M7 15H17',
    finance:'M4 3H20V21H4ZM8 7H16M8 12H10M14 12H16M8 17H10M14 17H16',
    infrastructure:'M4 3H20V9H4ZM4 15H20V21H4ZM8 6H8.1M8 18H8.1M12 9V15',
    company:'M3 21H21M5 21V8L12 3L19 8V21M9 21V15H15V21M9 10H15',
    world:'M21 12A9 9 0 1 0 3 12A9 9 0 0 0 21 12M3 12H21M12 3Q3 12 12 21Q21 12 12 3',
    inbox:'M3 5H21V19H3ZM3 5L12 13L21 5',
  };
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={primitiveIconPaths[name]??paths[name]??paths.products}/></svg>;
}
