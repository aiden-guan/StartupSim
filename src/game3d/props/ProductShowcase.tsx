import type { Vector3Tuple } from 'three';
import type { Product } from '../../simulation/types';
import { Bevel } from '../geometry/Bevel';
import { Hotspot } from './Hotspot';
import { ProductArtifact } from './ProductArtifact';

// One display follows the company to each office. The newest completed
// product is shown, so a growing catalog never fills every desk.
const stations: { position: Vector3Tuple; scale: number }[] = [
  { position: [3.1, 0, .4], scale: .4 },
  { position: [3.3, 0, .7], scale: .5 },
  { position: [4.5, 0, 1], scale: .7 },
  { position: [5, 0, 2], scale: .95 },
  { position: [6, 0, 2], scale: 1.2 },
  { position: [8, 0, 3], scale: 1.4 },
];

export function ProductShowcase({ product, level, onOpen }: { product: Product; level: number; onOpen: () => void }) {
  const station = stations[Math.min(level, stations.length - 1)]!;
  const { position, scale } = station;
  return <group position={position}>
    <Bevel position={[0, .22 * scale, 0]} size={[2.5 * scale, .44 * scale, 1.68 * scale]} color="#a9a28f" radius={.08 * scale} />
    <Bevel position={[0, .44 * scale, 0]} size={[2.58 * scale, .075 * scale, 1.76 * scale]} color="#e6dac5" radius={.03 * scale} />
    <group position={[0, .48 * scale, 0]} scale={scale}>
      <ProductArtifact a={product.combo[0]} b={product.combo[1]} />
    </group>
    <Hotspot id="product-showcase" position={[0, 1.25 * scale, 0]} size={[2.6 * scale, 2.5 * scale, 1.8 * scale]} label={`View ${product.name}`} onClick={onOpen} />
  </group>;
}
