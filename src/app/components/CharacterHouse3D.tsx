import { ContactShadows, Html, OrbitControls, RoundedBox } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useState } from 'react';
import type { HomeType, HouseFinishes, InteriorStyle, Room } from './CharacterHouseBuilder';

interface CharacterHouse3DProps {
  homeType: HomeType;
  floors: Room[][];
  activeFloor: number;
  interiorStyle: InteriorStyle;
  reveal: number;
  showRoof: boolean;
  selectedRoom?: string;
  onRoomSelect: (room: Room) => void;
  autoRotate?: boolean;
  finishes?: HouseFinishes;
  viewMode?: 'house' | 'room';
}

const STYLE_PALETTES = {
  'warm-modern': { trim: '#8a5236', wood: '#a96d3d', floor: '#d7a46e' },
  'ethiopian-heritage': { trim: '#753725', wood: '#914c28', floor: '#c78147' },
  'peaceful-minimalist': { trim: '#53615e', wood: '#968774', floor: '#c9baa5' },
} as const;

const DEFAULT_FINISHES: HouseFinishes = {
  wallPaint: '#fff8e9', sofaFabric: '#9b5960', livingAccent: '#d3a65f', diningWood: '#87532f',
  kitchenCabinet: '#72836d', bathroomTile: '#c9e0df', masterBedding: '#b87979', guestBedding: '#7c8e73',
};

function dimensionsFor(homeType: HomeType) {
  if (homeType === 'villa') return { width: 13, depth: 9 };
  if (homeType === 'townhouse') return { width: 7.5, depth: 9 };
  if (homeType === 'duplex') return { width: 13.5, depth: 8.5 };
  if (homeType === 'penthouse') return { width: 12.5, depth: 9 };
  if (homeType === 'apartment') return { width: 10.5, depth: 8 };
  return { width: 10.5, depth: 8.5 };
}

function roomPlacement(index: number, count: number, width: number, depth: number) {
  const columns = 2;
  const rows = Math.ceil(count / columns);
  const cellWidth = width / columns;
  const cellDepth = depth / rows;
  const column = index % columns;
  const row = Math.floor(index / columns);
  return {
    x: -width / 2 + cellWidth / 2 + column * cellWidth,
    z: -depth / 2 + cellDepth / 2 + row * cellDepth,
    cellWidth,
    cellDepth,
    column,
    row,
  };
}

function Box({ position, args, color, rotation, opacity = 1, metalness = 0, roughness = .72 }: { position: [number, number, number]; args: [number, number, number]; color: string; rotation?: [number, number, number]; opacity?: number; metalness?: number; roughness?: number }) {
  return <mesh position={position} rotation={rotation} castShadow receiveShadow><boxGeometry args={args} /><meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} metalness={metalness} roughness={roughness} /></mesh>;
}

function Glass({ position, args, rotation }: { position: [number, number, number]; args: [number, number, number]; rotation?: [number, number, number] }) {
  return <mesh position={position} rotation={rotation}><boxGeometry args={args} /><meshPhysicalMaterial color="#bdebf0" transparent opacity={.38} roughness={.08} transmission={.35} thickness={.12} /></mesh>;
}

function Window({ position, rotation = [0, 0, 0], scale = [1.65, 1.25] }: { position: [number, number, number]; rotation?: [number, number, number]; scale?: [number, number] }) {
  return <group position={position} rotation={rotation}><Box position={[0, 0, 0]} args={[scale[0] + .18, scale[1] + .18, .1]} color="#73432f" /><Glass position={[0, 0, .07]} args={[scale[0], scale[1], .08]} /><Box position={[0, 0, .14]} args={[.055, scale[1], .04]} color="#73432f" /></group>;
}

function Rug({ color, size = [2.9, 2] }: { color: string; size?: [number, number] }) {
  return <RoundedBox args={[size[0], .035, size[1]]} radius={.1} position={[0, .045, 0]} receiveShadow><meshStandardMaterial color={color} roughness={1} /></RoundedBox>;
}

function Plant({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  return <group position={position}><mesh position={[0, .23, 0]} castShadow><cylinderGeometry args={[.25, .18, .46, 16]} /><meshStandardMaterial color="#9b623f" /></mesh>{[[-.18, .72, 0], [.16, .84, .08], [0, 1.02, -.08]].map((leaf, index) => <mesh key={index} position={leaf as [number, number, number]} rotation={[0, 0, index === 0 ? -.45 : .35]} castShadow><sphereGeometry args={[.22, 14, 10]} /><meshStandardMaterial color={index === 1 ? '#4f8d52' : '#397642'} /></mesh>)}</group>;
}

function Sofa({ position, rotation = [0, 0, 0], color }: { position: [number, number, number]; rotation?: [number, number, number]; color: string }) {
  return <group position={position} rotation={rotation}><RoundedBox args={[2.45, .55, .88]} radius={.16} position={[0, .46, 0]} castShadow><meshStandardMaterial color={color} roughness={.9} /></RoundedBox><RoundedBox args={[2.45, .78, .24]} radius={.1} position={[0, .88, -.34]} castShadow><meshStandardMaterial color={color} roughness={.9} /></RoundedBox><Box position={[-1.05, .52, 0]} args={[.22, .76, .88]} color={color} /><Box position={[1.05, .52, 0]} args={[.22, .76, .88]} color={color} /><RoundedBox args={[.55, .16, .55]} radius={.08} position={[-.48, .83, .05]}><meshStandardMaterial color="#f0d9b9" /></RoundedBox><RoundedBox args={[.55, .16, .55]} radius={.08} position={[.48, .83, .05]}><meshStandardMaterial color="#efe7da" /></RoundedBox></group>;
}

function CoffeeTable({ wood }: { wood: string }) {
  return <group><RoundedBox args={[1.65, .12, .86]} radius={.12} position={[0, .46, 0]} castShadow><meshStandardMaterial color={wood} roughness={.45} /></RoundedBox><Box position={[-.58, .22, 0]} args={[.1, .45, .1]} color="#3d3732" metalness={.5} /><Box position={[.58, .22, 0]} args={[.1, .45, .1]} color="#3d3732" metalness={.5} /></group>;
}

function LivingRoom({ finishes, wood }: { finishes: HouseFinishes; wood: string }) {
  return <group><Rug color={finishes.livingAccent} size={[4.3, 3.15]} /><Sofa position={[0, 0, -.9]} color={finishes.sofaFabric} /><Sofa position={[-1.6, 0, .65]} rotation={[0, Math.PI / 2, 0]} color={finishes.sofaFabric} /><group position={[.35, 0, .45]}><CoffeeTable wood={wood} /></group><group position={[1.9, 0, 1.2]}><Box position={[0, .42, 0]} args={[1.8, .7, .36]} color={wood} /><Box position={[0, 1.25, -.12]} args={[1.75, 1.05, .12]} color="#15191c" roughness={.25} /></group><Plant position={[2.15, 0, -1.25]} /></group>;
}

function DiningRoom({ finishes }: { finishes: HouseFinishes }) {
  const chairPositions: Array<[number, number, number, number]> = [[-1.35, 0, -.65, 0], [0, 0, -.65, 0], [1.35, 0, -.65, 0], [-1.35, 0, .65, Math.PI], [0, 0, .65, Math.PI], [1.35, 0, .65, Math.PI]];
  return <group><Rug color={finishes.livingAccent} size={[4.4, 2.8]} /><RoundedBox args={[3.45, .16, 1.35]} radius={.1} position={[0, .78, 0]} castShadow><meshStandardMaterial color={finishes.diningWood} roughness={.42} /></RoundedBox><Box position={[-1.15, .38, 0]} args={[.16, .75, .16]} color={finishes.diningWood} /><Box position={[1.15, .38, 0]} args={[.16, .75, .16]} color={finishes.diningWood} />{chairPositions.map(([x, y, z, rotation], index) => <group key={index} position={[x, y, z]} rotation={[0, rotation, 0]}><Box position={[0, .46, 0]} args={[.55, .12, .55]} color={finishes.diningWood} /><Box position={[0, .82, .24]} args={[.55, .75, .12]} color={finishes.diningWood} /></group>)}<mesh position={[0, 2.1, 0]}><sphereGeometry args={[.18, 16, 12]} /><meshStandardMaterial color="#e5b852" emissive="#e5b852" emissiveIntensity={.35} /></mesh></group>;
}

function Kitchen({ finishes }: { finishes: HouseFinishes }) {
  return <group><Box position={[0, 1.05, -1.55]} args={[4.6, 2.1, .55]} color={finishes.kitchenCabinet} /><Box position={[0, 1.02, -1.2]} args={[4.7, .16, .75]} color="#eee2d2" roughness={.28} /><Box position={[-1.55, 1.85, -1.15]} args={[1.1, 1.05, .45]} color={finishes.kitchenCabinet} /><Box position={[1.55, 1.85, -1.15]} args={[1.1, 1.05, .45]} color={finishes.kitchenCabinet} /><Box position={[0, .72, .35]} args={[2.9, 1.25, 1.15]} color={finishes.kitchenCabinet} /><Box position={[0, 1.39, .35]} args={[3.05, .12, 1.25]} color="#f2eadf" roughness={.22} /><Box position={[-1.8, 1.15, -1.22]} args={[.9, 1.9, .1]} color="#d9e0df" metalness={.55} /><mesh position={[.55, 1.49, .32]}><torusGeometry args={[.18, .035, 10, 20, Math.PI]} /><meshStandardMaterial color="#8c9290" metalness={.8} roughness={.2} /></mesh>{[-.8, .8].map((x, index) => <group key={index} position={[x, 0, 1.25]}><mesh position={[0, .55, 0]}><cylinderGeometry args={[.34, .28, .12, 18]} /><meshStandardMaterial color={finishes.diningWood} /></mesh><Box position={[0, .28, 0]} args={[.1, .55, .1]} color="#363b3b" metalness={.5} /></group>)}</group>;
}

function Bedroom({ master, finishes, wood }: { master: boolean; finishes: HouseFinishes; wood: string }) {
  const bedding = master ? finishes.masterBedding : finishes.guestBedding;
  return <group><Rug color={bedding} size={master ? [3.8, 3.8] : [3.2, 3.5]} /><group position={[0, 0, -.25]}><RoundedBox args={[master ? 2.65 : 2.25, .42, 3]} radius={.14} position={[0, .35, 0]} castShadow><meshStandardMaterial color="#eee6db" /></RoundedBox><RoundedBox args={[master ? 2.55 : 2.15, .22, 1.75]} radius={.08} position={[0, .72, .45]}><meshStandardMaterial color={bedding} roughness={.92} /></RoundedBox><RoundedBox args={[master ? 2.55 : 2.15, 1.25, .2]} radius={.08} position={[0, 1.05, -1.42]}><meshStandardMaterial color={wood} /></RoundedBox><RoundedBox args={[.82, .2, .55]} radius={.1} position={[-.58, .88, -.75]}><meshStandardMaterial color="#fffaf1" /></RoundedBox><RoundedBox args={[.82, .2, .55]} radius={.1} position={[.58, .88, -.75]}><meshStandardMaterial color="#fffaf1" /></RoundedBox></group>{[-1.75, 1.75].map((x, index) => <group key={index} position={[x, 0, -.85]}><Box position={[0, .38, 0]} args={[.65, .7, .55]} color={wood} /><mesh position={[0, 1.1, 0]}><sphereGeometry args={[.22, 14, 10]} /><meshStandardMaterial color="#f3c96f" emissive="#f3c96f" emissiveIntensity={.25} /></mesh></group>)}<Box position={[2.05, 1.05, 1.15]} args={[1.1, 2.1, .55]} color={wood} />{master && <Box position={[0, .35, 1.65]} args={[1.7, .65, .55]} color={wood} />}</group>;
}

function Bathroom({ finishes, wood }: { finishes: HouseFinishes; wood: string }) {
  return <group><Box position={[0, .035, 0]} args={[4.4, .06, 3.7]} color={finishes.bathroomTile} roughness={.35} /><RoundedBox args={[2, .72, 1]} radius={.35} position={[-.85, .4, -.95]} castShadow><meshStandardMaterial color="#f9faf8" roughness={.18} /></RoundedBox><Box position={[-.85, 1.1, -1.38]} args={[.08, 1.25, .08]} color="#9ca3a0" metalness={.8} /><group position={[1.2, 0, -.9]}><mesh position={[0, .45, 0]}><cylinderGeometry args={[.42, .34, .65, 20]} /><meshStandardMaterial color="#fafbf9" /></mesh><RoundedBox args={[.8, .16, .9]} radius={.16} position={[0, .78, 0]}><meshStandardMaterial color="#fafbf9" /></RoundedBox></group><Box position={[1.1, .55, .95]} args={[1.65, 1, .65]} color={wood} /><Box position={[1.1, 1.08, .95]} args={[1.8, .1, .75]} color="#f1e9de" roughness={.22} /><Glass position={[1.1, 1.95, 1.24]} args={[1.45, 1.25, .06]} /><group position={[-1.25, 0, 1.05]}><Glass position={[0, 1.2, 0]} args={[1.5, 2.4, .08]} /><Box position={[0, .1, 0]} args={[1.55, .12, 1.45]} color={finishes.bathroomTile} /></group></group>;
}

function PrayerSpace({ accent, wood }: { accent: string; wood: string }) {
  return <group><Rug color={accent} size={[2.2, 3.2]} /><Box position={[0, 1.25, -1.45]} args={[2.6, 2.5, .12]} color="#f7e8bc" /><Box position={[0, .9, -1.34]} args={[1.55, 1.6, .35]} color={wood} /><Box position={[0, 1.1, -.95]} args={[1.05, .08, .72]} color="#e8c36a" rotation={[-.18, 0, 0]} /><RoundedBox args={[1.25, .25, .65]} radius={.12} position={[0, .18, .75]}><meshStandardMaterial color="#e8dcc6" /></RoundedBox></group>;
}

function Terrace({ wood }: { wood: string }) {
  return <group><Box position={[0, .04, 0]} args={[4.5, .08, 3.8]} color={wood} /><Sofa position={[0, 0, -.65]} color="#8ba284" /><CoffeeTable wood={wood} /><Plant position={[-1.8, 0, 1.25]} /><Plant position={[1.8, 0, 1.25]} /></group>;
}

function RoomFurniture({ room, finishes, wood }: { room: Room; finishes: HouseFinishes; wood: string }) {
  if (room.name === 'Living Room' || room.name === 'Family Room') return <LivingRoom finishes={finishes} wood={wood} />;
  if (room.name === 'Dining Room') return <DiningRoom finishes={finishes} />;
  if (room.name === 'Kitchen') return <Kitchen finishes={finishes} />;
  if (room.name === 'Master Bedroom') return <Bedroom master finishes={finishes} wood={wood} />;
  if (room.name === 'Guest Room' || room.kind === 'bedroom') return <Bedroom master={false} finishes={finishes} wood={wood} />;
  if (room.name.includes('Bathroom')) return <Bathroom finishes={finishes} wood={wood} />;
  if (room.kind === 'faith') return <PrayerSpace accent={finishes.livingAccent} wood={wood} />;
  if (room.name === 'Terrace') return <Terrace wood={wood} />;
  return <group><Rug color={finishes.livingAccent} /><Box position={[0, .5, 0]} args={[1.5, 1, .6]} color={wood} /><Plant position={[1.2, 0, .6]} /></group>;
}

function RoomCell({ room, index, count, width, depth, y, wallColor, floorColor, wood, finishes, selected, furnished, detailMode, onSelect }: { room: Room; index: number; count: number; width: number; depth: number; y: number; wallColor: string; floorColor: string; wood: string; finishes: HouseFinishes; selected: boolean; furnished: boolean; detailMode: boolean; onSelect: () => void }) {
  const placement = roomPlacement(index, count, width, depth);
  const { x, z, cellWidth, cellDepth, column, row } = placement;
  const muted = detailMode && !selected;
  const furnitureScale = Math.min(1, Math.max(.42, Math.min((cellWidth - .35) / 5, (cellDepth - .35) / 4)));
  return <group>
    <mesh position={[x, y + .1, z]} onClick={event => { event.stopPropagation(); onSelect(); }} receiveShadow visible={!muted || detailMode}><boxGeometry args={[cellWidth - .12, .16, cellDepth - .12]} /><meshStandardMaterial color={selected ? '#f2cd62' : floorColor} transparent={muted} opacity={muted ? .07 : 1} roughness={.7} /></mesh>
    {!muted && (column > 0 || detailMode) && <Box position={[x - cellWidth / 2, y + 1.3, z]} args={[.14, 2.6, cellDepth]} color={wallColor} />}
    {!muted && (row > 0 || detailMode) && <Box position={[x, y + 1.3, z - cellDepth / 2]} args={[cellWidth, 2.6, .14]} color={wallColor} />}
    {!muted && furnished && <group position={[x, y + .16, z]} scale={furnitureScale}><RoomFurniture room={room} finishes={finishes} wood={wood} /></group>}
    {selected && <Html position={[x, y + 2.65, z]} center distanceFactor={9} style={{ pointerEvents: 'none' }}><div className="whitespace-nowrap rounded-full bg-stone-950/90 px-3 py-1.5 text-xs font-bold text-white shadow-xl">{room.name}</div></Html>}
  </group>;
}

function Stairs({ position, wood }: { position: [number, number, number]; wood: string }) {
  return <group position={position}>{Array.from({ length: 10 }).map((_, index) => <Box key={index} position={[0, index * .16, index * .2]} args={[1.15, .16, .34]} color={wood} />)}</group>;
}

function Roof({ width, depth, y, color, flat }: { width: number; depth: number; y: number; color: string; flat: boolean }) {
  if (flat) return <Box position={[0, y, 0]} args={[width + .5, .3, depth + .5]} color={color} />;
  return <group position={[0, y, 0]}><Box position={[-width * .235, .58, 0]} args={[width * .56, .24, depth + .7]} color={color} rotation={[0, 0, Math.PI / 7]} /><Box position={[width * .235, .58, 0]} args={[width * .56, .24, depth + .7]} color={color} rotation={[0, 0, -Math.PI / 7]} /></group>;
}

function focusPoint(props: CharacterHouse3DProps, width: number, depth: number): [number, number, number] {
  if (props.viewMode !== 'room' || !props.selectedRoom) return [0, Math.max(1.5, props.activeFloor * 1.35), 0];
  for (let floorIndex = 0; floorIndex < props.floors.length; floorIndex += 1) {
    const rooms = props.floors[floorIndex];
    const index = rooms.findIndex(room => room.id === props.selectedRoom);
    if (index >= 0) {
      const placement = roomPlacement(index, rooms.length, width, depth);
      return [placement.x, floorIndex * 3 + .8, placement.z];
    }
  }
  return [0, 1.5, 0];
}

function HouseScene(props: CharacterHouse3DProps) {
  const { homeType, floors, activeFloor, interiorStyle, reveal, showRoof, selectedRoom, onRoomSelect } = props;
  const palette = STYLE_PALETTES[interiorStyle];
  const finishes = props.finishes || DEFAULT_FINISHES;
  const { width, depth } = dimensionsFor(homeType);
  const floorHeight = 3;
  const visibleFloorCount = Math.min(floors.length, activeFloor + 1);
  const showSlabs = reveal > .1, showFrame = reveal > .28, showWalls = reveal > .4, showWindows = reveal > .54, showFurniture = reveal > .68, showGarden = reveal > .88;
  const detailMode = props.viewMode === 'room' && Boolean(selectedRoom);
  return <group>
    <Box position={[0, -.35, 0]} args={[width + 1, .7, depth + 1]} color="#b7aa98" />
    {showSlabs && floors.slice(0, visibleFloorCount).map((rooms, floorIndex) => {
      const y = floorIndex * floorHeight;
      return <group key={floorIndex}>
        <Box position={[0, y, 0]} args={[width, .24, depth]} color={palette.floor} />
        {showFrame && [[-width / 2, -depth / 2], [width / 2, -depth / 2], [-width / 2, depth / 2], [width / 2, depth / 2]].map(([x, z], index) => <Box key={index} position={[x, y + 1.5, z]} args={[.22, 3, .22]} color={palette.trim} />)}
        {showWalls && !detailMode && <><Box position={[0, y + 1.4, -depth / 2]} args={[width, 2.8, .18]} color={finishes.wallPaint} /><Box position={[-width / 2, y + 1.4, 0]} args={[.18, 2.8, depth]} color={finishes.wallPaint} /><Box position={[width / 2, y + 1.4, -depth * .18]} args={[.18, 2.8, depth * .64]} color={finishes.wallPaint} /></>}
        {showWindows && !detailMode && <><Window position={[-width * .27, y + 1.55, -depth / 2 - .1]} /><Window position={[width * .27, y + 1.55, -depth / 2 - .1]} /><Window position={[-width / 2 - .1, y + 1.55, 0]} rotation={[0, Math.PI / 2, 0]} /></>}
        {rooms.map((room, index) => <RoomCell key={room.id} room={room} index={index} count={rooms.length} width={width} depth={depth} y={y} wallColor={finishes.wallPaint} floorColor={room.name.includes('Bathroom') ? finishes.bathroomTile : palette.floor} wood={palette.wood} finishes={finishes} selected={selectedRoom === room.id} furnished={showFurniture} detailMode={detailMode} onSelect={() => onRoomSelect(room)} />)}
        {!detailMode && floorIndex < floors.length - 1 && <Stairs position={[width / 2 - 1, y + .12, depth / 2 - 2.4]} wood={palette.wood} />}
        {!detailMode && floorIndex > 0 && <Box position={[0, y + .14, depth / 2 + .9]} args={[width * .72, .18, 1.8]} color={palette.wood} />}
      </group>;
    })}
    {!detailMode && showRoof && reveal > .58 && <Roof width={width} depth={depth} y={visibleFloorCount * floorHeight + .1} color={palette.trim} flat={homeType === 'apartment' || homeType === 'penthouse'} />}
    {!detailMode && showGarden && <><Box position={[0, -.02, depth / 2 + 2.1]} args={[width * .82, .12, 3]} color="#c89053" />{[-width * .35, width * .35].map((x, index) => <Plant key={index} position={[x, 0, depth / 2 + 2.5]} />)}</>}
  </group>;
}

function CameraControls({ props, width, depth }: { props: CharacterHouse3DProps; width: number; depth: number }) {
  const { camera } = useThree();
  const target = focusPoint(props, width, depth);
  const detail = props.viewMode === 'room' && Boolean(props.selectedRoom);
  useEffect(() => {
    const distance = detail ? 6.8 : width * 1.05;
    camera.position.set(target[0] + distance * .68, target[1] + (detail ? 4.2 : Math.max(7, props.floors.length * 3.6)), target[2] + distance);
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
  }, [camera, detail, props.floors.length, props.homeType, props.selectedRoom, target[0], target[1], target[2], width]);
  return <OrbitControls makeDefault enablePan={detail} autoRotate={props.autoRotate && !detail} autoRotateSpeed={.55} minDistance={detail ? 3.8 : 9} maxDistance={detail ? 13 : 36} minPolarAngle={.2} maxPolarAngle={Math.PI / 2.08} target={target} />;
}

export function CharacterHouse3D(props: CharacterHouse3DProps) {
  const [canvasError, setCanvasError] = useState(false);
  const dimensions = useMemo(() => dimensionsFor(props.homeType), [props.homeType]);
  const initialCamera = useMemo<[number, number, number]>(() => [dimensions.width * .85, Math.max(8, props.floors.length * 4.4), dimensions.width * 1.05], [dimensions.width, props.floors.length]);
  if (canvasError) return <div className="grid min-h-[32rem] place-items-center rounded-[2rem] bg-stone-100 p-8 text-center text-sm text-stone-600">This device could not start the 3D viewer. Please enable WebGL or try a current browser.</div>;
  return <div className="relative h-[38rem] overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-gradient-to-b from-cyan-50 to-emerald-100 shadow-inner">
    <Canvas shadows dpr={[1, 1.65]} camera={{ position: initialCamera, fov: props.viewMode === 'room' ? 32 : 38, near: .1, far: 140 }} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }} onCreated={({ gl }) => { gl.domElement.setAttribute('aria-label', 'Detailed interactive 3D cutaway house. Drag to rotate, scroll or pinch to zoom, and tap a room.'); gl.domElement.addEventListener('webglcontextlost', () => setCanvasError(true), { once: true }); }}>
      <color attach="background" args={['#dff5f2']} /><fog attach="fog" args={['#dff5f2', 32, 68]} />
      <ambientLight intensity={.9} /><hemisphereLight args={['#fff8df', '#3d7338', 1.45]} /><directionalLight position={[12, 20, 14]} intensity={2.5} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-far={60} />
      <Suspense fallback={null}><HouseScene {...props} /><mesh position={[0, -.75, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[80, 80]} /><meshStandardMaterial color="#3d8a36" roughness={1} /></mesh><ContactShadows position={[0, -.7, 0]} opacity={.42} scale={32} blur={2.5} far={18} /></Suspense>
      <CameraControls props={props} width={dimensions.width} depth={dimensions.depth} />
    </Canvas>
    <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-stone-950/78 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur">{props.viewMode === 'room' ? 'Room detail · Drag to inspect · Pinch to zoom' : 'Full house · Drag to orbit · Tap a room'}</div>
  </div>;
}
