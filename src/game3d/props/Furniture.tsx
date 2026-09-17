import type { Vector3Tuple } from 'three';
import { Bevel } from '../geometry/Bevel';
import {
  getBookSpineTexture,
  getConferenceBadgeTexture,
  getGPUBoxTexture,
  getPizzaBoxTexture,
  getScreenTexture,
  getWhiteboardTexture,
} from '../textures/decals';

type Position = { position: Vector3Tuple };

// Color palette from 3D Style Guide
const charcoal = '#2b2e32';
const darkGray = '#33373b';
const lightGray = '#dedede';
const woodTone = '#c89e6e';
const screenBlue = '#5599ff';
const serverBlue = '#1e78ff';
const plantGreen = '#5c8646';
const paper = '#ffffff';

export function Desk({ position, color = woodTone, standing = false }: { position: Vector3Tuple; color?: string; standing?: boolean }) {
  const h = standing ? 0.95 : 0.74;
  return (
    <group position={position}>
      {/* Light oak wood top with clean beveled edges */}
      <Bevel position={[0, h, 0]} size={[1.6, 0.075, 0.8]} color={color} radius={0.018} />
      {/* Under-desk metal frame */}
      <Bevel position={[0, h - 0.05, 0]} size={[1.42, 0.04, 0.62]} color={darkGray} radius={0.008} />
      {/* 4 dark metal square-profile legs */}
      {[-0.68, 0.68].map((x) =>
        [-0.3, 0.3].map((z) => (
          <Bevel key={`${x},${z}`} position={[x, (h - 0.075) / 2, z]} size={[0.065, h - 0.075, 0.065]} color={charcoal} radius={0.008} />
        ))
      )}
    </group>
  );
}

export function Chair({ position, rotation = 0, color = charcoal }: { position: Vector3Tuple; rotation?: number; color?: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Ergonomic curved mesh backrest */}
      <Bevel position={[0, 0.73, -0.21]} rotation={[-0.08, 0, 0]} size={[0.46, 0.52, 0.09]} color={color} radius={0.055} />
      {/* Backrest lumbar connector */}
      <Bevel position={[0, 0.52, -0.22]} size={[0.09, 0.34, 0.05]} color={darkGray} radius={0.008} />
      {/* Horizontal seat cushion */}
      <Bevel position={[0, 0.425, 0]} size={[0.48, 0.095, 0.46]} color={color} radius={0.05} />
      {/* Left and right armrests */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Bevel position={[side * 0.25, 0.52, 0.01]} size={[0.035, 0.22, 0.045]} color={darkGray} radius={0.008} />
          <Bevel position={[side * 0.25, 0.63, 0.0]} size={[0.08, 0.05, 0.28]} color={color} radius={0.02} />
        </group>
      ))}
      {/* Center hydraulic cylinder post */}
      <mesh position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.036, 0.042, 0.3, 10]} />
        <meshStandardMaterial color="#686e73" roughness={0.8} />
      </mesh>
      {/* 5-star wheeled caster base */}
      {Array.from({ length: 5 }, (_, i) => (
        <group key={i} rotation={[0, (i * Math.PI * 2) / 5, 0]}>
          <Bevel position={[0, 0.085, 0.145]} rotation={[-0.09, 0, 0]} size={[0.048, 0.044, 0.29]} color={darkGray} radius={0.008} />
          <mesh position={[0, 0.05, 0.285]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.045, 0.045, 0.06, 10]} />
            <meshStandardMaterial color="#1f2226" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Keyboard({ position }: Position) {
  return (
    <group position={position}>
      {/* Low-profile dark grey rectangular wedge */}
      <Bevel size={[0.44, 0.024, 0.17]} color={charcoal} radius={0.012} />
      {/* Key grid */}
      {[0, 1, 2, 3].map((row) =>
        Array.from({ length: 10 }, (_, col) => (
          <Bevel
            key={`${row}-${col}`}
            position={[(col - 4.5) * 0.038, 0.015, (row - 1.5) * 0.036]}
            size={[0.031, 0.006, 0.026]}
            color="#50555c"
            radius={0.002}
          />
        ))
      )}
    </group>
  );
}

export function Laptop({ position, color = '#9fa4a9', open = true }: { position: Vector3Tuple; color?: string; open?: boolean }) {
  const screenTex = open ? getScreenTexture('laptop') : null;
  return (
    <group position={position}>
      {/* Metallic wedge base with keyboard indent */}
      <Bevel size={[0.53, 0.026, 0.35]} color={color} radius={0.014} />
      {open ? (
        <>
          {/* Open angled screen with glowing screen blue */}
          <group position={[0, 0.028, -0.16]} rotation={[-0.22, 0, 0]}>
            <Bevel position={[0, 0.175, 0]} size={[0.53, 0.35, 0.024]} color={color} radius={0.016} />
            {/* Screen bezel */}
            <Bevel position={[0, 0.177, 0.014]} size={[0.49, 0.31, 0.008]} color="#23262a" radius={0.006} />
            {/* Glowing screen display */}
            <mesh position={[0, 0.178, 0.019]}>
              <planeGeometry args={[0.46, 0.28]} />
              {screenTex ? (
                <meshBasicMaterial map={screenTex} />
              ) : (
                <meshStandardMaterial color={screenBlue} emissive={screenBlue} emissiveIntensity={0.5} />
              )}
            </mesh>
          </group>
          {/* Keyboard & trackpad indent */}
          <Bevel position={[0, 0.015, -0.04]} size={[0.44, 0.006, 0.16]} color="#242629" radius={0.005} />
          <Bevel position={[0, 0.015, 0.11]} size={[0.15, 0.004, 0.07]} color="#80858c" radius={0.006} />
        </>
      ) : (
        <Bevel position={[0, 0.028, 0]} size={[0.53, 0.024, 0.35]} color={color} radius={0.012} />
      )}
    </group>
  );
}

export function Monitor({ position }: Position) {
  const screenTex = getScreenTexture('monitor');
  return (
    <group position={position}>
      {/* Thin-bezel widescreen monitor */}
      <Bevel size={[0.72, 0.44, 0.048]} color={charcoal} radius={0.014} />
      {/* Glowing screen display */}
      <mesh position={[0, 0.005, 0.026]}>
        <planeGeometry args={[0.67, 0.39]} />
        {screenTex ? (
          <meshBasicMaterial map={screenTex} />
        ) : (
          <meshStandardMaterial color={screenBlue} emissive={screenBlue} emissiveIntensity={0.5} />
        )}
      </mesh>
      {/* Sleek angled stand neck */}
      <Bevel position={[0, -0.26, -0.01]} size={[0.06, 0.16, 0.045]} color={darkGray} radius={0.008} />
      {/* Flat rectangular base plate */}
      <Bevel position={[0, -0.34, 0.01]} size={[0.29, 0.025, 0.18]} color={darkGray} radius={0.012} />
      {/* Power LED */}
      <Bevel position={[0.29, -0.198, 0.026]} size={[0.015, 0.008, 0.008]} color={screenBlue} radius={0.002} />
    </group>
  );
}

export function Mug({ position, color = paper }: { position: Vector3Tuple; color?: string }) {
  return (
    <group position={position}>
      {/* Ceramic mug body */}
      <mesh castShadow>
        <cylinderGeometry args={[0.058, 0.052, 0.115, 16]} />
        <meshStandardMaterial color={color} roughness={0.88} />
      </mesh>
      {/* Coffee inside */}
      <mesh position={[0, 0.048, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.048, 14]} />
        <meshStandardMaterial color="#4a3528" roughness={0.9} />
      </mesh>
      {/* Handle */}
      <mesh position={[0.058, 0.006, 0]}>
        <torusGeometry args={[0.034, 0.011, 6, 12]} />
        <meshStandardMaterial color={color} roughness={0.88} />
      </mesh>
    </group>
  );
}

export function BookStack({ position }: Position) {
  // 6 colorful books matching design sheet titles & colors:
  // 1. "Product" (Dark green #4a6b48)
  // 2. "Technology" (Navy #284162)
  // 3. "People" (Blue #3d6ca8)
  // 4. "Scaling" (Gold/Mustard #c9983e)
  // 5. "Better Decisions" (Light teal #5a96a8)
  // 6. "A Kinder Internet" (Light grey/white #dcd8cf)
  const books = [
    { color: '#dcd8cf', spine: 'A Kinder Internet', textColor: '#23272e' },
    { color: '#5a96a8', spine: 'Better Decisions', textColor: '#ffffff' },
    { color: '#c9983e', spine: 'Scaling', textColor: '#ffffff' },
    { color: '#3d6ca8', spine: 'People', textColor: '#ffffff' },
    { color: '#284162', spine: 'Technology', textColor: '#ffffff' },
    { color: '#4a6b48', spine: 'Product', textColor: '#ffffff' },
  ];

  return (
    <group position={position} rotation={[0, 1.35, 0]}>
      {books.map((book, i) => {
        const spineTex = getBookSpineTexture(book.spine, book.color, book.textColor);
        return (
          <group key={i} position={[(i % 2) * 0.018, 0.028 + i * 0.058, 0]} rotation={[0, (i - 2.5) * 0.06, 0]}>
            {/* Book cover */}
            <Bevel size={[0.31, 0.054, 0.38]} color={book.color} radius={0.006} />
            {/* Pages edge */}
            <Bevel position={[0.015, 0, 0.008]} size={[0.29, 0.04, 0.365]} color="#faf6ec" radius={0.002} />
            {/* Spine with printed title */}
            <mesh position={[-0.156, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
              <planeGeometry args={[0.38, 0.054]} />
              {spineTex ? (
                <meshBasicMaterial map={spineTex} />
              ) : (
                <meshStandardMaterial color={book.color} roughness={0.8} />
              )}
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export function Plant({ position, scale = 1 }: { position: Vector3Tuple; scale?: number }) {
  // Clean light ceramic cylindrical pot (#dedede) with dark soil and faceted broad green leaves
  return (
    <group position={position} scale={scale}>
      {/* Light ceramic pot */}
      <mesh position={[0, 0.17, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.17, 0.34, 14]} />
        <meshStandardMaterial color={lightGray} roughness={0.9} />
      </mesh>
      {/* Pot rim */}
      <mesh position={[0, 0.34, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.015, 6, 14]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.9} />
      </mesh>
      {/* Dark soil */}
      <mesh position={[0, 0.33, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.205, 14]} />
        <meshStandardMaterial color="#3d2e24" roughness={1} />
      </mesh>

      {/* Faceted low-poly broad leaves branching upward (#5c8646 / #557f3f) */}
      {[
        { pitch: 0.35, yaw: 0.2, h: 0.46, s: 0.24, c: plantGreen },
        { pitch: 0.42, yaw: 1.1, h: 0.52, s: 0.26, c: '#557f3f' },
        { pitch: 0.32, yaw: 2.0, h: 0.48, s: 0.25, c: plantGreen },
        { pitch: 0.45, yaw: 2.9, h: 0.54, s: 0.27, c: '#6e9652' },
        { pitch: 0.38, yaw: 3.8, h: 0.5, s: 0.24, c: '#557f3f' },
        { pitch: 0.44, yaw: 4.7, h: 0.53, s: 0.26, c: plantGreen },
        { pitch: 0.3, yaw: 5.6, h: 0.47, s: 0.25, c: '#6e9652' },
        { pitch: 0.15, yaw: 0.8, h: 0.62, s: 0.28, c: plantGreen },
        { pitch: 0.12, yaw: 3.4, h: 0.64, s: 0.28, c: '#557f3f' },
      ].map((leaf, i) => (
        <group key={i} position={[0, 0.32, 0]} rotation={[Math.sin(leaf.yaw) * leaf.pitch, leaf.yaw, Math.cos(leaf.yaw) * leaf.pitch]}>
          {/* Stem */}
          <mesh position={[0, leaf.h * 0.4, 0]}>
            <cylinderGeometry args={[0.009, 0.015, leaf.h * 0.8, 6]} />
            <meshStandardMaterial color="#4d6f3b" roughness={1} />
          </mesh>
          {/* Broad faceted leaf */}
          <mesh position={[0, leaf.h, 0.02]} scale={[leaf.s * 0.8, leaf.s * 1.3, leaf.s * 0.25]} rotation={[0.22, 0, 0.1]} castShadow>
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color={leaf.c} roughness={1} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Couch({ position }: Position) {
  // Modern blue 2-seat sofa (#2b3e55) with cushions, armrests, and 4 short light wood peg legs (#c89e6e)
  return (
    <group position={position}>
      {/* 4 short light wood peg legs */}
      {[-0.78, 0.78].map((x) =>
        [-0.28, 0.28].map((z) => (
          <Bevel key={`${x},${z}`} position={[x, 0.09, z]} size={[0.075, 0.18, 0.075]} color={woodTone} radius={0.01} />
        ))
      )}
      {/* Main sofa frame */}
      <Bevel position={[0, 0.26, 0]} size={[1.86, 0.26, 0.84]} color="#2b3e55" radius={0.045} />
      {/* Two seat cushions */}
      {[-0.41, 0.41].map((x) => (
        <group key={x}>
          <Bevel position={[x, 0.41, 0.04]} size={[0.8, 0.16, 0.66]} color="#354e6d" radius={0.038} />
          {/* Backrest cushions */}
          <Bevel position={[x, 0.71, -0.28]} rotation={[-0.1, 0, 0]} size={[0.8, 0.52, 0.21]} color="#334b68" radius={0.042} />
        </group>
      ))}
      {/* Left and right armrests */}
      {[-0.88, 0.88].map((x) => (
        <Bevel key={x} position={[x, 0.5, 0]} size={[0.21, 0.5, 0.84]} color="#26384d" radius={0.046} />
      ))}
    </group>
  );
}

export function Fridge({ position }: Position) {
  return (
    <group position={position}>
      <Bevel size={[0.64, 1.35, 0.62]} color="#e2e1db" radius={0.036} />
      <Bevel position={[0, 0.37, 0.31]} size={[0.59, 0.57, 0.03]} color="#d8d9d5" radius={0.02} />
      <Bevel position={[0, -0.29, 0.31]} size={[0.59, 0.72, 0.03]} color="#e4e2dc" radius={0.02} />
      {[0.23, -0.09].map((y) => (
        <Bevel key={y} position={[0.22, y, 0.35]} size={[0.024, 0.19, 0.036]} color="#7a8088" radius={0.007} />
      ))}
    </group>
  );
}

export function Whiteboard({ position }: Position) {
  const height = position?.[1] || 1.35;
  const decalTex = getWhiteboardTexture();
  return (
    <group position={position}>
      {/* Aluminum frame */}
      <Bevel size={[2.04, 1.24, 0.06]} color="#8e949c" radius={0.025} />
      {/* Board front surface with clean decal */}
      <mesh position={[0, 0, 0.032]} castShadow receiveShadow>
        <planeGeometry args={[1.92, 1.12]} />
        {decalTex ? (
          <meshBasicMaterial map={decalTex} />
        ) : (
          <meshStandardMaterial color="#f8f9fa" roughness={0.9} />
        )}
      </mesh>
      {/* Board back surface */}
      <Bevel position={[0, 0, -0.032]} size={[1.92, 1.12, 0.014]} color="#edebe4" radius={0.008} />

      {/* Marker tray on front face */}
      <Bevel position={[0, -0.63, 0.05]} size={[1.94, 0.035, 0.12]} color="#828890" radius={0.008} />
      {/* Dry erase markers on tray */}
      <Bevel position={[-0.35, -0.61, 0.06]} size={[0.14, 0.018, 0.018]} color="#2563eb" radius={0.004} />
      <Bevel position={[-0.18, -0.61, 0.06]} size={[0.14, 0.018, 0.018]} color="#dc2626" radius={0.004} />
      <Bevel position={[-0.01, -0.61, 0.06]} size={[0.14, 0.018, 0.018]} color="#1f2937" radius={0.004} />
      {/* Eraser */}
      <Bevel position={[0.22, -0.605, 0.06]} size={[0.16, 0.026, 0.055]} color="#374151" radius={0.005} />

      {/* Rolling legs / casters */}
      {[-0.85, 0.85].map((x) => (
        <group key={x}>
          {/* Vertical leg from frame down to floor */}
          <Bevel position={[x, -height / 2 - 0.3, 0]} size={[0.045, Math.max(0.1, height - 0.58), 0.045]} color="#8e949c" radius={0.006} />
          {/* Horizontal T-foot */}
          <Bevel position={[x, 0.11 - height, 0]} size={[0.07, 0.065, 0.54]} color="#7e848c" radius={0.012} />
          {/* Rolling casters / wheels */}
          {[-0.23, 0.23].map((z) => (
            <mesh key={z} position={[x, 0.05 - height, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.05, 0.05, 0.045, 12]} />
              <meshStandardMaterial color={charcoal} roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export function CoffeeMachine({ position }: Position) {
  // Modern espresso tower (#33373b) with rear water reservoir, drip nozzle, and white mug on drip tray
  return (
    <group position={position}>
      {/* Main tower body */}
      <Bevel position={[0.14, 0.21, -0.04]} size={[0.21, 0.42, 0.32]} color={darkGray} radius={0.018} />
      {/* Upper front grouphead/dispenser */}
      <Bevel position={[-0.11, 0.36, -0.02]} size={[0.34, 0.18, 0.34]} color={charcoal} radius={0.025} />
      {/* Bottom base plate */}
      <Bevel position={[-0.11, 0.022, 0]} size={[0.35, 0.045, 0.36]} color="#23262a" radius={0.012} />
      {/* Drip tray grid */}
      <Bevel position={[-0.11, 0.048, 0.05]} size={[0.26, 0.01, 0.22]} color="#828a90" radius={0.004} />
      {/* Rear water reservoir (dark tinted acrylic) */}
      <Bevel position={[-0.11, 0.19, -0.135]} size={[0.31, 0.29, 0.075]} color="#4a545e" radius={0.012} />
      {/* Front status / button panel */}
      <Bevel position={[-0.12, 0.39, 0.155]} size={[0.16, 0.045, 0.008]} color="#7c8892" radius={0.004} />
      {/* Drip nozzle */}
      <Bevel position={[-0.11, 0.24, 0.045]} size={[0.032, 0.065, 0.04]} color="#9ba2a6" radius={0.005} />
      {/* Crisp white ceramic coffee mug resting on the drip tray */}
      <Mug position={[-0.11, 0.106, 0.05]} />
    </group>
  );
}

export function ServerRack({ position, load = 0.3 }: { position: Vector3Tuple; load?: number }) {
  // Matte black cabinet with horizontal server blades and glowing server blue status LEDs (#1e78ff)
  return (
    <group position={position}>
      {/* Matte black cabinet outer frame */}
      <Bevel size={[0.82, 1.76, 0.66]} color="#1e2126" radius={0.024} />
      {/* Recessed front bay */}
      <Bevel position={[0, 0, 0.33]} size={[0.7, 1.62, 0.02]} color="#15171b" radius={0.012} />
      {/* 7 stacked horizontal server blade trays */}
      {Array.from({ length: 7 }, (_, i) => (
        <group key={i} position={[0, 0.64 - i * 0.21, 0.35]}>
          {/* Server blade chassis */}
          <Bevel size={[0.64, 0.175, 0.03]} color="#2d333b" radius={0.006} />
          {/* Glowing server blue status LEDs */}
          <Bevel
            position={[-0.23, 0, 0.02]}
            size={[0.07, 0.038, 0.012]}
            color={load > 0.85 ? '#dc9c56' : serverBlue}
            emissive={load > 0.85 ? '#dc9c56' : serverBlue}
            emissiveIntensity={0.6}
            radius={0.003}
          />
          {/* Server blade vent slots / drive bays */}
          {[0, 1, 2].map((j) => (
            <Bevel key={j} position={[0.05, 0.038 - j * 0.038, 0.02]} size={[0.34, 0.009, 0.008]} color="#1a1c20" radius={0.002} />
          ))}
        </group>
      ))}
    </group>
  );
}

export function PizzaBox({ position }: Position) {
  const decalTex = getPizzaBoxTexture();
  return (
    <group position={position} rotation={[0, 0.19, 0]}>
      {/* Kraft cardboard pizza box body */}
      <Bevel size={[0.48, 0.072, 0.46]} color="#d1a980" radius={0.007} />
      {/* Top lid rim */}
      <Bevel position={[0, 0.038, 0]} size={[0.496, 0.014, 0.478]} color="#dfba94" radius={0.004} />
      {/* Printed top surface decal */}
      <mesh position={[0, 0.046, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[0.47, 0.45]} />
        {decalTex ? (
          <meshBasicMaterial map={decalTex} />
        ) : (
          <meshStandardMaterial color="#d1a980" roughness={0.9} />
        )}
      </mesh>
    </group>
  );
}

export function CardboardBox({ position, scale = 1 }: { position: Vector3Tuple; scale?: number }) {
  const gpuTex = getGPUBoxTexture();
  return (
    <group position={position} scale={scale}>
      {/* Box body in Kraft cardboard */}
      <Bevel size={[0.54, 0.42, 0.46]} color="#b89065" radius={0.007} />
      {/* Packing tape across top flaps */}
      <Bevel position={[0, 0.214, 0]} size={[0.085, 0.006, 0.466]} color="#d8b68f" radius={0.001} />
      {/* Front decal with bold GPU and barcode */}
      <mesh position={[0, 0, 0.233]} receiveShadow>
        <planeGeometry args={[0.52, 0.40]} />
        {gpuTex ? (
          <meshBasicMaterial map={gpuTex} />
        ) : (
          <meshStandardMaterial color="#b89065" roughness={0.9} />
        )}
      </mesh>
    </group>
  );
}

export function Notebook({ position }: Position) {
  // Dark charcoal moleskine notebook (#2c2e32) with cream page edges and tan elastic band strap
  return (
    <group position={position}>
      {/* Cover */}
      <Bevel size={[0.26, 0.032, 0.36]} color="#2c2e32" radius={0.008} />
      {/* Cream page edge */}
      <Bevel position={[0.012, 0, 0.006]} size={[0.24, 0.022, 0.345]} color="#eae6db" radius={0.002} />
      {/* Vertical tan elastic band strap */}
      <Bevel position={[0.07, 0, 0]} size={[0.02, 0.036, 0.365]} color="#c2aa8a" radius={0.002} />
    </group>
  );
}

export function Headphones({ position }: Position) {
  // Over-ear dark headphones (#292b2f) with curved padded headband and earcups
  return (
    <group position={position}>
      {/* Padded headband arc */}
      <mesh position={[0, 0.11, 0]}>
        <torusGeometry args={[0.13, 0.016, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#292b2f" roughness={0.9} />
      </mesh>
      {/* Left and right earcups */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.13, 0.09, 0]}>
          <Bevel size={[0.045, 0.11, 0.085]} color="#222428" radius={0.02} />
          {/* Cushion */}
          <Bevel position={[side * -0.015, 0, 0]} size={[0.025, 0.095, 0.075]} color="#18191b" radius={0.015} />
        </group>
      ))}
    </group>
  );
}

export function ConferenceBadge({ position }: Position) {
  const badgeTex = getConferenceBadgeTexture();
  return (
    <group position={position}>
      {/* Blue lanyard ribbon */}
      <mesh position={[0, 0.22, 0]}>
        <torusGeometry args={[0.12, 0.008, 4, 16, Math.PI]} />
        <meshStandardMaterial color="#2563eb" roughness={0.8} />
      </mesh>
      {/* Lanyard clip */}
      <Bevel position={[0, 0.1, 0]} size={[0.03, 0.025, 0.015]} color="#9ba2a8" radius={0.003} />
      {/* Badge card with decal */}
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[0.18, 0.24]} />
        {badgeTex ? <meshBasicMaterial map={badgeTex} /> : <meshStandardMaterial color="#ffffff" />}
      </mesh>
      <Bevel position={[0, 0, 0]} size={[0.184, 0.244, 0.008]} color="#e2e8f0" radius={0.008} />
    </group>
  );
}

export function Smartphone({ position }: Position) {
  // Sleek dark smartphone (#1c1e22) with slim bezel and screen
  return (
    <group position={position}>
      {/* Phone chassis */}
      <Bevel size={[0.15, 0.012, 0.28]} color="#1c1e22" radius={0.015} />
      {/* Screen display */}
      <Bevel position={[0, 0.007, 0]} size={[0.135, 0.004, 0.26]} color="#2c3440" radius={0.01} />
      {/* Camera lens bump */}
      <Bevel position={[-0.04, -0.007, 0.09]} size={[0.035, 0.005, 0.045]} color="#141517" radius={0.006} />
    </group>
  );
}

export function RobotAssistant({ position }: Position) {
  // White rounded head with glossy black visor, glowing cyan eyes (#50a8ff), rounded body, and cute arms
  return (
    <group position={position}>
      {/* Rounded white head */}
      <Bevel position={[0, 0.65, 0]} size={[0.48, 0.36, 0.34]} color="#f0f3f2" radius={0.11} />
      {/* Glossy dark visor face plate */}
      <Bevel position={[0, 0.65, 0.16]} size={[0.38, 0.24, 0.05]} color="#1e2328" radius={0.07} />
      {/* Glowing cyan pill eyes */}
      {[-0.08, 0.08].map((x) => (
        <Bevel
          key={x}
          position={[x, 0.66, 0.19]}
          size={[0.038, 0.075, 0.012]}
          radius={0.016}
          color="#50a8ff"
          emissive="#50a8ff"
          emissiveIntensity={0.7}
        />
      ))}
      {/* Dark neck joint */}
      <Bevel position={[0, 0.44, 0]} size={[0.14, 0.08, 0.14]} color="#33373b" radius={0.02} />
      {/* Rounded white body */}
      <Bevel position={[0, 0.22, 0]} size={[0.44, 0.42, 0.34]} color="#f0f3f2" radius={0.12} />
      {/* Chest seam/badge */}
      <Bevel position={[0, 0.24, 0.17]} size={[0.1, 0.06, 0.01]} color="#50a8ff" emissive="#50a8ff" emissiveIntensity={0.4} radius={0.004} />
      {/* Cute pivot arms */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.26, 0.26, 0]}>
          <Bevel position={[0, -0.09, 0.04]} rotation={[0.3, 0, side * -0.15]} size={[0.09, 0.2, 0.09]} color="#e2e7e6" radius={0.035} />
          <Bevel position={[0, -0.21, 0.08]} size={[0.07, 0.08, 0.07]} color="#50a8ff" radius={0.02} />
        </group>
      ))}
    </group>
  );
}

export function Rug({ position, color = '#9da998' }: { position: Vector3Tuple; color?: string }) {
  return (
    <group position={position}>
      <Bevel size={[2.6, 0.022, 1.8]} color={color} radius={0.011} />
      <Bevel position={[0, 0.013, 0]} size={[2.39, 0.004, 1.59]} color="#adb8a5" radius={0.001} />
    </group>
  );
}

export function BrandSign({ position, color, mark = 'wordmark', width = 1.8 }: { position: Vector3Tuple; color: string; mark?: string; width?: number }) {
  return (
    <group position={position}>
      <Bevel size={[width, 0.42, 0.045]} color={color} radius={0.014} />
      {mark === 'circle' ? (
        <mesh position={[0, 0, 0.028]}>
          <circleGeometry args={[0.115, 16]} />
          <meshStandardMaterial color={paper} />
        </mesh>
      ) : mark === 'spark' ? (
        <Bevel position={[0, 0, 0.028]} rotation={[0, 0, Math.PI / 4]} size={[0.17, 0.17, 0.008]} color={paper} radius={0.005} />
      ) : (
        [-0.18, 0, 0.18].map((x, i) => (
          <Bevel key={x} position={[x, 0, 0.028]} size={[mark === 'wordmark' ? 0.1 : 0.07, 0.14 + i * 0.04, 0.009]} color={paper} radius={0.004} />
        ))
      )}
    </group>
  );
}

export function Lamp({ position }: Position) {
  return (
    <group position={position}>
      <Bevel position={[0, -0.3, 0]} size={[0.3, 0.045, 0.24]} color={charcoal} radius={0.025} />
      <Bevel size={[0.036, 0.62, 0.036]} color="#686e73" radius={0.008} />
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.1, 0.19, 0.23, 10, 1, true]} />
        <meshStandardMaterial color={paper} roughness={1} side={2} />
      </mesh>
    </group>
  );
}
