import { useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import { Color, type Group } from 'three';
import type { CharacterLook, ExpressionId } from '../../simulation/types';
import { Bevel } from '../geometry/Bevel';
import { FaceMesh } from './Face';
import { HairMesh } from './Hair';
import type { CharacterActivity } from './Animations';
export type { CharacterActivity };

export function Character({
  look,
  activity = 'idle',
  expression,
  exhausted = false,
  robot = false,
  preview = false,
  seated = false,
}: {
  look: CharacterLook;
  activity?: CharacterActivity;
  expression?: ExpressionId;
  exhausted?: boolean;
  robot?: boolean;
  preview?: boolean;
  seated?: boolean;
}) {
  const ref = useRef<Group>(null);
  const head = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const leftElbow = useRef<Group>(null);
  const rightElbow = useRef<Group>(null);
  const leftLeg = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);
  const leftKnee = useRef<Group>(null);
  const rightKnee = useRef<Group>(null);

  const bodyScale = look.body === 'slim' ? 0.93 : look.body === 'broad' ? 1.08 : 1;
  const heightScale = look.height === 'short' ? 0.94 : look.height === 'tall' ? 1.06 : 1;
  const face = expression ?? (exhausted ? 'tired' : activity === 'celebrate' ? 'happy' : 'neutral');
  const jacket = ['blazer', 'jacket', 'techjacket', 'labcoat', 'overshirt'].includes(look.topId);
  const tee = look.topId === 'tee';
  const hoodie = look.topId === 'hoodie';
  const cloth = look.topId === 'labcoat' ? '#e9e9e3' : look.top;
  const inner = look.topId === 'blazer' ? (look.top === '#2d4972' ? '#b0c8e8' : '#1e2126') : '#141517';

  // Pants styling and accents
  const pantsStyle = look.pantsId ?? 'jeans';
  const { cuffColor, darkAccent, lightAccent, creaseColor, pocketShadow } = useMemo(() => {
    try {
      const c = new Color(look.pants || '#3a3a44');
      return {
        cuffColor: '#' + c.clone().lerp(new Color('#d6e0ea'), 0.38).getHexString(),
        darkAccent: '#' + c.clone().multiplyScalar(0.72).getHexString(),
        lightAccent: '#' + c.clone().lerp(new Color('#ffffff'), 0.28).getHexString(),
        creaseColor: '#' + c.clone().lerp(new Color('#ffffff'), 0.22).getHexString(),
        pocketShadow: '#' + c.clone().multiplyScalar(0.78).getHexString(),
      };
    } catch {
      return {
        cuffColor: '#8ca4b8',
        darkAccent: '#232529',
        lightAccent: '#606a75',
        creaseColor: '#5a6470',
        pocketShadow: '#282b30',
      };
    }
  }, [look.pants]);

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 0.08);
    const t = clock.elapsedTime;
    const smooth = (g: Group | null, axis: 'x' | 'y' | 'z', value: number) => {
      if (g) g.rotation[axis] += (value - g.rotation[axis]) * (1 - Math.exp(-dt * 12));
    };
    const walking = activity === 'walking';
    const working = activity === 'working';
    const talking = activity === 'talking' || activity === 'meeting';
    const celebrate = activity === 'celebrate';
    const sit = seated || activity === 'sit';
    const stride = Math.sin(t * (exhausted ? 5 : 7.5));
    const typing = Math.sin(t * 13) * 0.035;

    if (ref.current) {
      const y = sit
        ? -0.23
        : walking
        ? Math.abs(stride) * 0.018
        : celebrate
        ? Math.abs(Math.sin(t * 5)) * 0.055
        : Math.sin(t * 1.8) * 0.004;
      ref.current.position.y += (y - ref.current.position.y) * (1 - Math.exp(-dt * 12));
    }
    smooth(head.current, 'x', exhausted ? 0.18 : working ? 0.12 : 0);
    smooth(head.current, 'y', talking ? Math.sin(t * 1.8) * 0.14 : preview ? 0.06 : 0);
    smooth(leftArm.current, 'x', walking ? stride * 0.45 : working ? -0.95 + typing : celebrate ? -2.6 : talking ? -0.2 : 0);
    smooth(
      rightArm.current,
      'x',
      walking
        ? -stride * 0.45
        : activity === 'whiteboard'
        ? -1.4
        : activity === 'coffee'
        ? -0.55
        : working
        ? -0.95 - typing
        : celebrate
        ? -2.6
        : talking
        ? -0.4 + Math.sin(t * 2) * 0.15
        : 0
    );
    smooth(leftArm.current, 'z', celebrate ? -0.3 : 0.04);
    smooth(rightArm.current, 'z', celebrate ? 0.3 : -0.04);
    smooth(leftElbow.current, 'x', working ? -0.62 : talking ? -0.5 : -0.08);
    smooth(rightElbow.current, 'x', activity === 'coffee' ? -1.6 : activity === 'whiteboard' ? -0.4 : working ? -0.62 : talking ? -0.7 : -0.08);
    smooth(leftLeg.current, 'x', sit ? -Math.PI / 2 : walking ? -stride * 0.4 : 0);
    smooth(rightLeg.current, 'x', sit ? -Math.PI / 2 : walking ? stride * 0.4 : 0);
    smooth(leftKnee.current, 'x', sit ? Math.PI / 2 : 0);
    smooth(rightKnee.current, 'x', sit ? Math.PI / 2 : 0);
  });

  const sitting = seated || activity === 'sit';

  return (
    <group ref={ref} scale={[bodyScale, heightScale, bodyScale]}>
      {/* Legs and Shoes */}
      {[-1, 1].map((side) => {
        const isShorts = pantsStyle === 'shorts';
        const isJoggers = pantsStyle === 'joggers';
        const isJeans = pantsStyle === 'jeans';
        const isChinos = pantsStyle === 'chinos';
        const isTrousers = pantsStyle === 'trousers';
        const isCargo = pantsStyle === 'cargo';

        // Tailored leg dimensions and taper per pants style
        const legWidth = isChinos ? 0.178 : isJoggers ? 0.194 : isCargo ? 0.19 : 0.184;
        const legDepth = isChinos ? 0.22 : isJoggers ? 0.238 : isCargo ? 0.232 : 0.228;
        const legTaper = isJoggers ? 0.25 : isChinos ? 0.16 : isCargo ? 0.1 : isTrousers ? 0.05 : 0.08;

        return (
          <group key={side} ref={side === -1 ? leftLeg : rightLeg} position={[side * 0.115, 0.72, 0]}>
            {/* Upper Leg / Thigh */}
            {robot ? (
              <Bevel
                position={[0, sitting ? -0.16 : -0.285, 0]}
                size={[0.183, sitting ? 0.35 : 0.61, 0.225]}
                radius={0.032}
                color="#d9dede"
                taper={0.14}
              />
            ) : isShorts ? (
              /* Shorts: Fabric stops above knee, exposing bare thigh/knee */
              <>
                <Bevel
                  position={[0, sitting ? -0.11 : -0.14, 0]}
                  size={[0.188, sitting ? 0.22 : 0.28, 0.23]}
                  radius={0.028}
                  color={look.pants}
                  taper={-0.05}
                />
                {/* Shorts hem band */}
                <Bevel
                  position={[0, sitting ? -0.215 : -0.275, 0]}
                  size={[0.192, 0.024, 0.234]}
                  radius={0.006}
                  color={darkAccent}
                />
                {/* Bare knee in upper leg group */}
                <Bevel
                  position={[0, sitting ? -0.255 : -0.32, 0]}
                  size={[0.155, sitting ? 0.07 : 0.09, 0.19]}
                  radius={0.025}
                  color={look.skin}
                />
              </>
            ) : (
              /* Full length pants: Upper leg mesh */
              <>
                <Bevel
                  position={[0, sitting ? -0.16 : -0.285, 0]}
                  size={[legWidth, sitting ? 0.35 : 0.61, legDepth]}
                  radius={0.032}
                  color={look.pants}
                  taper={sitting ? legTaper * 0.8 : legTaper}
                />

                {/* Jeans outer side-seam */}
                {isJeans && (
                  <Bevel
                    position={[side * (legWidth / 2 + 0.001), sitting ? -0.16 : -0.285, 0]}
                    size={[0.008, sitting ? 0.34 : 0.6, 0.012]}
                    radius={0.002}
                    color={pocketShadow}
                  />
                )}

                {/* Trousers pressed center front crease */}
                {isTrousers && (
                  <Bevel
                    position={[0, sitting ? -0.16 : -0.285, legDepth / 2 + 0.001]}
                    size={[0.008, sitting ? 0.34 : 0.6, 0.008]}
                    radius={0.002}
                    color={creaseColor}
                  />
                )}

                {/* Joggers horizontal knee articulation seam (when standing) */}
                {isJoggers && !sitting && (
                  <Bevel
                    position={[0, -0.31, legDepth / 2 + 0.002]}
                    size={[legWidth * 0.88, 0.012, 0.01]}
                    radius={0.003}
                    color={darkAccent}
                  />
                )}

                {/* Cargo: 3D outer thigh boxy flap pocket */}
                {isCargo && (
                  <group position={[side * (legWidth / 2 + 0.004), sitting ? -0.14 : -0.19, 0]}>
                    <Bevel size={[0.024, 0.13, 0.13]} radius={0.006} color={look.pants} />
                    <Bevel position={[0, 0.065, 0]} size={[0.028, 0.026, 0.136]} radius={0.005} color={darkAccent} />
                    <Bevel position={[side * 0.014, 0.06, 0]} size={[0.006, 0.012, 0.012]} radius={0.003} color="#202224" />
                  </group>
                )}

                {/* Cargo reinforced knee patch (when standing) */}
                {isCargo && !sitting && (
                  <Bevel
                    position={[0, -0.31, legDepth / 2 + 0.001]}
                    size={[legWidth * 0.85, 0.11, 0.008]}
                    radius={0.004}
                    color={pocketShadow}
                  />
                )}
              </>
            )}

            {/* Knee & Ankle Group (pivots when sitting) */}
            <group ref={side === -1 ? leftKnee : rightKnee} position={[0, -0.31, 0]}>
              {/* Lower leg when sitting (or bare calf for shorts) */}
              {robot ? (
                sitting && (
                  <Bevel
                    position={[0, -0.14, 0]}
                    size={[0.17, 0.32, 0.21]}
                    radius={0.025}
                    color="#d9dede"
                    taper={0.1}
                  />
                )
              ) : isShorts ? (
                /* Shorts: Bare skin calf + socks, both when standing and sitting */
                <>
                  <Bevel
                    position={[0, -0.14, 0]}
                    size={[0.152, 0.28, 0.185]}
                    radius={0.025}
                    color={look.skin}
                  />
                  {/* Clean white ankle socks */}
                  <Bevel
                    position={[0, -0.255, 0.01]}
                    size={[0.165, 0.038, 0.2]}
                    radius={0.008}
                    color="#f4f4f0"
                  />
                </>
              ) : (
                /* Full length pants: Calf when sitting */
                sitting && (
                  <>
                    <Bevel
                      position={[0, -0.14, 0]}
                      size={[legWidth * 0.94, 0.32, legDepth * 0.94]}
                      radius={0.025}
                      color={look.pants}
                      taper={legTaper * 0.8}
                    />
                    {isTrousers && (
                      <Bevel
                        position={[0, -0.14, (legDepth * 0.94) / 2 + 0.001]}
                        size={[0.008, 0.3, 0.008]}
                        radius={0.002}
                        color={creaseColor}
                      />
                    )}
                    {isJoggers && (
                      <Bevel
                        position={[0, 0.01, (legDepth * 0.94) / 2 + 0.002]}
                        size={[legWidth * 0.85, 0.012, 0.01]}
                        radius={0.003}
                        color={darkAccent}
                      />
                    )}
                    {isCargo && (
                      <Bevel
                        position={[0, 0, (legDepth * 0.94) / 2 + 0.001]}
                        size={[legWidth * 0.82, 0.1, 0.008]}
                        radius={0.004}
                        color={pocketShadow}
                      />
                    )}
                  </>
                )
              )}

              {/* Ankle Hem / Cuffs Treatments (Right above the shoe) */}
              {!robot && !isShorts && (
                <>
                  {/* Jeans: Rolled-up selvedge denim cuffs */}
                  {isJeans && (
                    <group position={[0, -0.25, 0.005]}>
                      <Bevel
                        size={[legWidth + 0.01, 0.046, legDepth + 0.006]}
                        radius={0.012}
                        color={cuffColor}
                      />
                      <Bevel
                        position={[0, 0.024, 0]}
                        size={[legWidth + 0.006, 0.006, legDepth + 0.004]}
                        radius={0.002}
                        color={darkAccent}
                      />
                    </group>
                  )}

                  {/* Chinos: Sleek tailored hem break */}
                  {isChinos && (
                    <Bevel
                      position={[0, -0.255, 0.005]}
                      size={[legWidth + 0.004, 0.026, legDepth + 0.004]}
                      radius={0.008}
                      color={look.pants}
                    />
                  )}

                  {/* Joggers: Cinched ribbed elastic ankle cuffs */}
                  {isJoggers && (
                    <group position={[0, -0.245, 0.005]}>
                      <Bevel
                        size={[0.16, 0.065, 0.185]}
                        radius={0.015}
                        color={darkAccent}
                      />
                      {[-0.018, 0.018].map((yOff) => (
                        <Bevel
                          key={yOff}
                          position={[0, yOff, 0]}
                          size={[0.164, 0.012, 0.189]}
                          radius={0.004}
                          color={lightAccent}
                        />
                      ))}
                    </group>
                  )}

                  {/* Trousers: Formal clean hem drape over shoes */}
                  {isTrousers && (
                    <Bevel
                      position={[0, -0.26, 0.008]}
                      size={[legWidth + 0.004, 0.024, legDepth + 0.008]}
                      radius={0.006}
                      color={look.pants}
                    />
                  )}
                </>
              )}

              {/* Shoes */}
              <Bevel
                position={[0, -0.32, 0.045]}
                size={[0.205, look.shoesId === 'boots' ? 0.155 : 0.115, 0.32]}
                radius={0.037}
                color={robot ? '#525a61' : look.shoes}
              />
              {(look.shoesId === 'sneakers' || look.shoesId === 'runners') && (
                <>
                  <Bevel position={[0, -0.365, 0.05]} size={[0.208, 0.035, 0.326]} radius={0.014} color="#d7d9d9" />
                  <Bevel position={[0, -0.277, 0.11]} size={[0.125, 0.018, 0.055]} radius={0.005} color="#cbd0d2" />
                </>
              )}
            </group>
          </group>
        );
      })}

      {/* Hip / Waist */}
      <Bevel position={[0, 0.725, 0]} size={[0.405, 0.1, 0.245]} radius={0.035} color={robot ? '#e6e9e8' : look.pants} />

      {/* Pants Waistband & Front Accents */}
      {!robot && (
        <>
          {/* Jeans: Denim fly, brass rivet button, belt loops, curved scoop pocket trims */}
          {pantsStyle === 'jeans' && (
            <>
              <Bevel position={[0, 0.74, 0.126]} size={[0.024, 0.024, 0.008]} radius={0.008} color="#d4b06a" metalness={0.4} />
              <Bevel position={[0, 0.695, 0.125]} size={[0.008, 0.055, 0.006]} radius={0.002} color={pocketShadow} />
              {[-0.14, -0.055, 0.055, 0.14].map((x) => (
                <Bevel key={x} position={[x, 0.725, 0.125]} size={[0.015, 0.065, 0.008]} radius={0.002} color={lightAccent} />
              ))}
              {[-1, 1].map((side) => (
                <Bevel
                  key={side}
                  position={[side * 0.125, 0.72, 0.125]}
                  rotation={[0, 0, side * -0.55]}
                  size={[0.06, 0.01, 0.008]}
                  radius={0.002}
                  color={pocketShadow}
                />
              ))}
            </>
          )}

          {/* Chinos: Smart leather belt with metallic gold buckle and slant pockets */}
          {pantsStyle === 'chinos' && (
            <>
              <Bevel position={[0, 0.73, 0]} size={[0.412, 0.034, 0.252]} radius={0.008} color="#4a3322" />
              <Bevel position={[0, 0.73, 0.128]} size={[0.056, 0.038, 0.012]} radius={0.006} color="#d4af37" metalness={0.5} roughness={0.4} />
              <Bevel position={[0, 0.73, 0.133]} size={[0.03, 0.022, 0.006]} radius={0.002} color="#352418" />
              {[-0.13, -0.055, 0.055, 0.13].map((x) => (
                <Bevel key={x} position={[x, 0.73, 0.128]} size={[0.012, 0.042, 0.006]} radius={0.002} color={look.pants} />
              ))}
              {[-1, 1].map((side) => (
                <Bevel
                  key={side}
                  position={[side * 0.145, 0.71, 0.124]}
                  rotation={[0, 0, side * -0.6]}
                  size={[0.075, 0.01, 0.006]}
                  radius={0.002}
                  color={pocketShadow}
                />
              ))}
            </>
          )}

          {/* Joggers: Gathered elastic waistband and dangling drawstrings with metal aglets */}
          {pantsStyle === 'joggers' && (
            <>
              <Bevel position={[0, 0.735, 0]} size={[0.414, 0.042, 0.252]} radius={0.012} color={darkAccent} />
              {[-0.022, 0.022].map((x, i) => (
                <group key={i} position={[x, 0.672, 0.129]} rotation={[0, 0, i === 0 ? -0.09 : 0.09]}>
                  <Bevel position={[0, 0, 0]} size={[0.008, 0.075, 0.008]} radius={0.003} color="#e5e5e0" />
                  <Bevel position={[0, -0.042, 0]} size={[0.01, 0.018, 0.01]} radius={0.002} color="#9aa0a6" metalness={0.6} />
                </group>
              ))}
              {[-0.022, 0.022].map((x) => (
                <Bevel key={x} position={[x, 0.725, 0.128]} size={[0.016, 0.016, 0.006]} radius={0.004} color="#70757a" />
              ))}
            </>
          )}

          {/* Trousers: Formal tailored waistband with dress tab closure & dress fly */}
          {pantsStyle === 'trousers' && (
            <>
              <Bevel position={[0, 0.735, 0]} size={[0.41, 0.034, 0.25]} radius={0.008} color={look.pants} />
              <Bevel position={[0.018, 0.735, 0.127]} size={[0.038, 0.022, 0.008]} radius={0.003} color="#60666d" metalness={0.5} />
              <Bevel position={[0, 0.69, 0.124]} size={[0.007, 0.065, 0.006]} radius={0.002} color={pocketShadow} />
              {[-1, 1].map((side) => (
                <Bevel
                  key={side}
                  position={[side * 0.14, 0.705, 0.124]}
                  rotation={[0, 0, side * -0.3]}
                  size={[0.06, 0.008, 0.006]}
                  radius={0.002}
                  color={pocketShadow}
                />
              ))}
            </>
          )}

          {/* Cargo: Webbing utility belt with quick-release gunmetal buckle */}
          {pantsStyle === 'cargo' && (
            <>
              <Bevel position={[0, 0.732, 0]} size={[0.412, 0.036, 0.252]} radius={0.008} color="#272a2b" />
              <Bevel position={[0, 0.732, 0.128]} size={[0.065, 0.038, 0.012]} radius={0.004} color="#3c4043" metalness={0.4} />
              {[-0.14, -0.065, 0.065, 0.14].map((x) => (
                <Bevel key={x} position={[x, 0.73, 0.129]} size={[0.02, 0.046, 0.006]} radius={0.002} color={look.pants} />
              ))}
            </>
          )}

          {/* Shorts: Casual button, fly and side pockets */}
          {pantsStyle === 'shorts' && (
            <>
              <Bevel position={[0, 0.735, 0.126]} size={[0.022, 0.022, 0.007]} radius={0.006} color="#e5e5e0" />
              <Bevel position={[0, 0.695, 0.125]} size={[0.007, 0.055, 0.006]} radius={0.002} color={pocketShadow} />
              {[-1, 1].map((side) => (
                <Bevel
                  key={side}
                  position={[side * 0.13, 0.715, 0.125]}
                  rotation={[0, 0, side * -0.5]}
                  size={[0.06, 0.009, 0.007]}
                  radius={0.002}
                  color={pocketShadow}
                />
              ))}
            </>
          )}
        </>
      )}

      {/* Torso */}
      <Bevel position={[0, 0.984, 0]} size={[robot ? 0.51 : 0.455, robot ? 0.49 : 0.55, robot ? 0.32 : 0.28]} radius={0.075} color={robot ? '#ecefeb' : cloth} taper={0.27} />

      {/* Neck */}
      <Bevel position={[0, 1.27, 0]} size={[0.145, 0.14, 0.145]} radius={0.037} color={robot ? '#525a61' : look.topId === 'turtleneck' ? cloth : look.skin} />

      {/* Neck & Clothing Accents */}
      {!robot && (
        <>
          {/* Turtleneck collar roll */}
          {look.topId === 'turtleneck' && <Bevel position={[0, 1.245, 0]} size={[0.19, 0.095, 0.19]} radius={0.035} color={cloth} />}

          {/* Jackets and Blazers */}
          {jacket ? (
            <>
              {/* Inner shirt center panel */}
              <Bevel position={[0, 1.015, 0.144]} size={[0.14, 0.43, 0.012]} radius={0.003} color={inner} />
              {/* Inner shirt collar tips for collared inner (e.g. Bezos' light blue shirt) */}
              {look.top === '#2d4972' &&
                [-1, 1].map((side) => (
                  <Bevel
                    key={side}
                    position={[side * 0.038, 1.205, 0.146]}
                    rotation={[-0.15, 0, side * 0.38]}
                    size={[0.042, 0.06, 0.01]}
                    color="#b0c8e8"
                    radius={0.003}
                  />
                ))}
              {/* Sleek low-profile lapels flush with jacket torso */}
              {[-1, 1].map((side) => (
                <Bevel
                  key={side}
                  position={[side * 0.088, 1.1, 0.148]}
                  rotation={[0, 0, side * -0.22]}
                  size={[0.078, 0.22, 0.012]}
                  radius={0.006}
                  color={cloth}
                />
              ))}
              {look.topId === 'techjacket' && <Bevel position={[0, 0.99, 0.155]} size={[0.009, 0.45, 0.008]} radius={0.002} color="#899194" />}
            </>
          ) : (
            <>
              {/* Standard crewneck collar ring */}
              <mesh position={[0, 1.213, 0.005]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.083, 0.015, 4, 12]} />
                <meshStandardMaterial color={cloth} roughness={1} />
              </mesh>

              {/* White collared shirt peaking out of sweater neckline (Bill Gates style) */}
              {look.topId === 'sweater' && (
                <>
                  <Bevel position={[0, 1.222, 0.01]} size={[0.15, 0.04, 0.15]} radius={0.02} color="#ffffff" />
                  {[-1, 1].map((side) => (
                    <Bevel
                      key={side}
                      position={[side * 0.038, 1.205, 0.135]}
                      rotation={[-0.15, 0, side * 0.38]}
                      size={[0.046, 0.068, 0.012]}
                      color="#ffffff"
                      radius={0.004}
                    />
                  ))}
                </>
              )}
            </>
          )}

          {hoodie && (
            <>
              <Bevel position={[0, 1.185, -0.11]} size={[0.27, 0.16, 0.17]} radius={0.064} color={cloth} />
              <Bevel position={[0, 0.837, 0.15]} size={[0.22, 0.095, 0.02]} radius={0.025} color={cloth} />
              {[-0.062, 0.062].map((x) => (
                <Bevel key={x} position={[x, 1.113, 0.151]} size={[0.009, 0.12, 0.009]} radius={0.003} color="#bcc1bd" />
              ))}
            </>
          )}

          {look.topId === 'vest' && <Bevel position={[0, 1.007, 0.148]} size={[0.01, 0.46, 0.013]} radius={0.002} color="#959da2" />}
        </>
      )}

      {/* Arms & Hands */}
      {[-1, 1].map((side) => (
        <group key={side} ref={side === -1 ? leftArm : rightArm} position={[side * 0.273, 1.162, 0]}>
          {/* Upper Arm: Clean short sleeve vs long sleeve */}
          {tee ? (
            <>
              {/* T-shirt sleeve */}
              <Bevel position={[0, -0.085, 0]} size={[0.145, 0.17, 0.155]} radius={0.03} color={robot ? '#5c6267' : cloth} />
              {/* Bare upper arm */}
              <Bevel position={[0, -0.185, 0]} size={[0.132, 0.16, 0.142]} radius={0.025} color={robot ? '#e2e8e7' : look.skin} />
            </>
          ) : (
            /* Long sleeve */
            <Bevel position={[0, -0.212, 0]} size={[0.148, 0.44, 0.158]} radius={0.035} color={robot ? '#5c6267' : cloth} />
          )}

          {/* Forearm and Hand */}
          <group ref={side === -1 ? leftElbow : rightElbow} position={[0, -0.238, 0]}>
            {/* Forearm: skin tone for tee, cloth for long sleeve */}
            <Bevel
              position={[0, -0.11, 0]}
              size={[0.13, 0.22, 0.14]}
              radius={0.025}
              color={robot ? '#e2e8e7' : tee ? look.skin : cloth}
            />
            {/* Hand */}
            <Bevel position={[0, -0.236, 0.011]} size={[0.125, 0.12, 0.135]} radius={0.035} color={robot ? '#656e72' : look.skin} />
            {!robot && (
              <Bevel
                position={[-side * 0.055, -0.212, 0.05]}
                rotation={[0, 0, side * 0.15]}
                size={[0.046, 0.075, 0.055]}
                radius={0.021}
                color={look.skin}
              />
            )}

            {/* Accessories on hands */}
            {side === 1 && (look.accessory === 'coffee' || activity === 'coffee') && (
              <group position={[0, -0.225, 0.1]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.058, 0.052, 0.1, 10]} />
                  <meshStandardMaterial color="#eeeae0" roughness={0.9} />
                </mesh>
                <mesh position={[0.06, 0, 0]}>
                  <torusGeometry args={[0.031, 0.011, 4, 8]} />
                  <meshStandardMaterial color="#eeeae0" roughness={0.9} />
                </mesh>
              </group>
            )}
            {side === 1 && look.accessory === 'phone' && (
              <Bevel position={[0, -0.22, 0.091]} size={[0.083, 0.16, 0.015]} color="#30353b" radius={0.015} />
            )}
            {side === 1 && look.accessory === 'notebook' && (
              <Bevel position={[0.035, -0.22, 0.075]} size={[0.15, 0.21, 0.032]} color="#365474" radius={0.006} />
            )}
            {side === -1 && look.accessory === 'watch' && (
              <Bevel position={[0, -0.172, 0.084]} size={[0.08, 0.064, 0.023]} color="#aeb7ba" radius={0.014} />
            )}
          </group>
        </group>
      ))}

      {/* Head, Face, Hair, Beard, Glasses */}
      <group ref={head} position={[0, 1.506, 0]}>
        {robot ? (
          <>
            <Bevel size={[0.52, 0.405, 0.385]} radius={0.12} color="#e9edeb" />
            <Bevel position={[0, 0.007, 0.182]} size={[0.405, 0.27, 0.071]} radius={0.094} color="#22252a" />
            {[-0.09, 0.09].map((x) => (
              <Bevel key={x} position={[x, 0.016, 0.224]} size={[0.042, 0.08, 0.014]} radius={0.018} color="#50a8ff" emissive="#50a8ff" emissiveIntensity={0.6} />
            ))}
          </>
        ) : (
          <>
            <FaceMesh skin={look.skin} expression={face} faceId={look.faceId} />
            <HairMesh style={look.hairStyle} color={look.hair} />

            {/* Beard: Clean low-poly goatee for Jobs vs full beard for Reed */}
            {look.beard && (
              <group>
                {look.hairStyle === 'balding' || look.beardColor === '#8c929a' ? (
                  /* Steve Jobs: Stubble goatee framing mouth & chin */
                  <>
                    <Bevel position={[0, -0.165, 0.185]} size={[0.13, 0.075, 0.05]} radius={0.018} color={look.beardColor ?? look.hair} />
                    <Bevel position={[0, -0.086, 0.201]} size={[0.095, 0.015, 0.008]} radius={0.003} color={look.beardColor ?? look.hair} />
                    {[-1, 1].map((side) => (
                      <Bevel key={side} position={[side * 0.058, -0.125, 0.19]} size={[0.016, 0.065, 0.008]} radius={0.003} color={look.beardColor ?? look.hair} />
                    ))}
                  </>
                ) : (
                  /* Reed Hastings & general full beard: jawline, chin, mustache */
                  <>
                    <Bevel position={[0, -0.165, 0.175]} size={[0.22, 0.085, 0.08]} radius={0.025} color={look.beardColor ?? look.hair} />
                    {[-1, 1].map((side) => (
                      <Bevel key={side} position={[side * 0.212, -0.135, 0.04]} size={[0.032, 0.09, 0.26]} radius={0.016} color={look.beardColor ?? look.hair} />
                    ))}
                    <Bevel position={[0, -0.082, 0.201]} size={[0.125, 0.018, 0.008]} radius={0.003} color={look.beardColor ?? look.hair} />
                  </>
                )}
              </group>
            )}

            {/* Glasses */}
            {look.glassesId !== 'none' && (
              <group position={[0, -0.004, 0.218]}>
                {[-1, 1].map((side) => (
                  <group key={side} position={[side * 0.083, 0, 0]}>
                    {look.glassesId === 'round' ? (
                      <mesh>
                        <torusGeometry args={[0.046, 0.006, 6, 16]} />
                        <meshStandardMaterial color="#2b2e32" roughness={0.8} />
                      </mesh>
                    ) : (
                      <>
                        {[-1, 1].map((edge) => (
                          <group key={edge}>
                            <Bevel position={[0, edge * 0.043, 0]} size={[0.122, 0.013, 0.02]} color="#23262a" radius={0.005} />
                            <Bevel position={[edge * 0.055, 0, 0]} size={[0.013, 0.085, 0.02]} color="#23262a" radius={0.005} />
                          </group>
                        ))}
                      </>
                    )}
                  </group>
                ))}
                {/* Bridge */}
                <Bevel position={[0, 0.002, 0]} size={[0.064, 0.011, 0.018]} radius={0.003} color="#23262a" />
                {/* Temple arms to ears */}
                {[-1, 1].map((side) => (
                  <Bevel key={side} position={[side * 0.195, 0.01, -0.08]} rotation={[0, side * -0.2, 0]} size={[0.014, 0.016, 0.18]} color="#23262a" radius={0.005} />
                ))}
              </group>
            )}

            {look.accessory === 'headphones' && (
              <>
                <mesh position={[0, 0.07, -0.025]}>
                  <torusGeometry args={[0.25, 0.027, 5, 12, Math.PI]} />
                  <meshStandardMaterial color="#292b2f" roughness={0.9} />
                </mesh>
                {[-0.244, 0.244].map((x) => (
                  <Bevel key={x} position={[x, -0.008, 0]} size={[0.07, 0.16, 0.12]} radius={0.035} color="#292b2f" />
                ))}
              </>
            )}
          </>
        )}
      </group>

      {/* Body Accessories */}
      {look.accessory === 'badge' && (
        <>
          <Bevel position={[0, 1.1, 0.16]} size={[0.012, 0.22, 0.013]} color="#42638a" radius={0.003} />
          <Bevel position={[0, 0.94, 0.163]} size={[0.105, 0.14, 0.014]} radius={0.009} color="#eeeae3" />
        </>
      )}
      {look.accessory === 'scarf' && <Bevel position={[0, 1.225, 0.055]} size={[0.23, 0.088, 0.17]} radius={0.026} color="#b37855" />}
      {look.accessory === 'backpack' && <Bevel position={[0, 1, -0.202]} size={[0.31, 0.39, 0.17]} radius={0.056} color="#365474" />}
    </group>
  );
}
