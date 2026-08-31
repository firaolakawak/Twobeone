import { Html, OrbitControls, RoundedBox } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense, useMemo, useState } from 'react';
import type { HomeType, Room } from './CharacterHouseBuilder';

interface CharacterHouse3DProps {
  homeType: HomeType;
  floors: Room[][];
  activeFloor: number;
  interiorStyle: 'warm-modern' | 'ethiopian-heritage' | 'peaceful-minimalist';
  reveal: number;
  showRoof: boolean;
  selectedRoom?: string;
  onRoomSelect: (room: Room) => void;
}

const STYLE_PALETTES = {
  'warm-modern': { wall: '#fff9ed', trim: '#985d3f', wood: '#b97843', accent: '#8f4350', floor: '#d9a66f' },
  'ethiopian-heritage': { wall: '#fff4dc', trim: '#7a3927', wood: '#a75d2d', accent: '#c28a25', floor: '#c8874e' },
  'peaceful-minimalist': { wall: '#f4f1e9', trim: '#53615e', wood: '#a59682', accent: '#6f8179', floor: '#c9bca9' },
} as const;

const ROOM_COLORS: Record<Room['kind'], string> = {
  living: '#f4d3cb',
  bedroom: '#ddd4ef',
  service: '#cfe5e8',
  faith: '#f4df9e',
  outdoor: '#cce2bd',
};

function dimensionsFor(homeType: HomeType) {
  if (homeType === 'villa') return { width: 12, depth: 8 };
  if (homeType === 'townhouse') return { width: 6.5, depth: 8 };
  if (homeType === 'duplex') return { width: 12.5, depth: 7.5 };
  if (homeType === 'penthouse') return { width: 11.5, depth: 8 };
  if (homeType === 'apartment') return { width: 9.5, depth: 7 };
  return { width: 9.5, depth: 7.5 };
}

function Box({ position, args, color, rotation, opacity = 1 }: { position: [number, number, number]; args: [number, number, number]; color: string; rotation?: [number, number, number]; opacity?: number }) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} roughness={0.78} />
    </mesh>
  );
}

function Window({ position, rotation = [0, 0, 0], scale = [1.5, 1.15] }: { position: [number, number, number]; rotation?: [number, number, number]; scale?: [number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <Box position={[0, 0, 0]} args={[scale[0] + .16, scale[1] + .16, .09]} color="#8b4b36" />
      <Box position={[0, 0, .06]} args={[scale[0], scale[1], .08]} color="#7dc7d1" opacity={.55} />
      <Box position={[0, 0, .13]} args={[.06, scale[1], .05]} color="#8b4b36" />
    </group>
  );
}

function Bed({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <RoundedBox args={[1.65, .34, 2.05]} radius={.12} position={[0, .28, 0]} castShadow><meshStandardMaterial color="#f4eadb" /></RoundedBox>
      <Box position={[0, .58, -.68]} args={[1.55, .2, .58]} color="#fffdf6" />
      <Box position={[0, .18, .95]} args={[1.8, .8, .14]} color={color} />
    </group>
  );
}

function Sofa({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <RoundedBox args={[2.25, .55, .8]} radius={.14} position={[0, .45, 0]} castShadow><meshStandardMaterial color={color} /></RoundedBox>
      <RoundedBox args={[2.25, .7, .22]} radius={.1} position={[0, .85, -.32]} castShadow><meshStandardMaterial color={color} /></RoundedBox>
      <Box position={[-.92, .48, 0]} args={[.2, .72, .82]} color={color} />
      <Box position={[.92, .48, 0]} args={[.2, .72, .82]} color={color} />
    </group>
  );
}

function Table({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <Box position={[0, .62, 0]} args={[1.45, .12, .85]} color={color} />
      {([[-.58, .29, -.28], [.58, .29, -.28], [-.58, .29, .28], [.58, .29, .28]] as [number, number, number][]).map((leg, index) => <Box key={index} position={leg} args={[.12, .58, .12]} color={color} />)}
    </group>
  );
}

function PrayerSpace({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <Box position={[0, .04, 0]} args={[1.4, .08, 2]} color={color} />
      <Box position={[0, 1, -.86]} args={[1.7, 2, .12]} color="#f7e9bc" />
      <Box position={[0, 1.05, -.78]} args={[.08, .75, .08]} color="#8f6939" />
      <Box position={[0, 1.23, -.77]} args={[.55, .08, .08]} color="#8f6939" />
    </group>
  );
}

function RoomFurniture({ room, position, palette }: { room: Room; position: [number, number, number]; palette: typeof STYLE_PALETTES[keyof typeof STYLE_PALETTES] }) {
  if (room.kind === 'bedroom') return <Bed position={position} color={palette.accent} />;
  if (room.kind === 'living') return <Sofa position={position} color={palette.accent} />;
  if (room.kind === 'faith') return <PrayerSpace position={position} color={palette.accent} />;
  if (room.name.includes('Kitchen')) return <Table position={position} color={palette.wood} />;
  if (room.name.includes('Bath')) {
    return <group position={position}><RoundedBox args={[1.55, .55, .75]} radius={.25} position={[0, .34, 0]}><meshStandardMaterial color="#f7faf8" /></RoundedBox><Box position={[.58, .85, 0]} args={[.08, .9, .08]} color="#b9a777" /></group>;
  }
  return <Table position={position} color={palette.wood} />;
}

function RoomCell({ room, index, count, width, depth, y, palette, selected, furnished, onSelect }: { room: Room; index: number; count: number; width: number; depth: number; y: number; palette: typeof STYLE_PALETTES[keyof typeof STYLE_PALETTES]; selected: boolean; furnished: boolean; onSelect: () => void }) {
  const columns = 2;
  const rows = Math.ceil(count / columns);
  const cellWidth = width / columns;
  const cellDepth = depth / rows;
  const column = index % columns;
  const row = Math.floor(index / columns);
  const x = -width / 2 + cellWidth / 2 + column * cellWidth;
  const z = -depth / 2 + cellDepth / 2 + row * cellDepth;

  return (
    <group>
      <mesh position={[x, y + .09, z]} onClick={(event) => { event.stopPropagation(); onSelect(); }} receiveShadow>
        <boxGeometry args={[cellWidth - .12, .14, cellDepth - .12]} />
        <meshStandardMaterial color={selected ? '#ffd76a' : ROOM_COLORS[room.kind]} roughness={.85} />
      </mesh>
      {column > 0 && <Box position={[x - cellWidth / 2, y + 1.25, z]} args={[.12, 2.5, cellDepth]} color={palette.wall} />}
      {row > 0 && <Box position={[x, y + 1.25, z - cellDepth / 2]} args={[cellWidth, 2.5, .12]} color={palette.wall} />}
      {furnished && <RoomFurniture room={room} position={[x, y + .13, z]} palette={palette} />}
      {selected && (
        <Html position={[x, y + 2.4, z]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div className="whitespace-nowrap rounded-full bg-stone-950/90 px-3 py-1.5 text-xs font-bold text-white shadow-xl">{room.name}</div>
        </Html>
      )}
    </group>
  );
}

function Roof({ width, depth, y, palette, flat }: { width: number; depth: number; y: number; palette: typeof STYLE_PALETTES[keyof typeof STYLE_PALETTES]; flat: boolean }) {
  if (flat) return <Box position={[0, y, 0]} args={[width + .5, .28, depth + .5]} color={palette.trim} />;
  return (
    <group position={[0, y, 0]}>
      <Box position={[-width * .235, .55, 0]} args={[width * .56, .22, depth + .7]} color={palette.trim} rotation={[0, 0, Math.PI / 7]} />
      <Box position={[width * .235, .55, 0]} args={[width * .56, .22, depth + .7]} color={palette.trim} rotation={[0, 0, -Math.PI / 7]} />
    </group>
  );
}

function HouseScene({ homeType, floors, activeFloor, interiorStyle, reveal, showRoof, selectedRoom, onRoomSelect }: CharacterHouse3DProps) {
  const palette = STYLE_PALETTES[interiorStyle];
  const { width, depth } = dimensionsFor(homeType);
  const floorHeight = 3;
  const visibleFloorCount = Math.min(floors.length, activeFloor + 1);
  const showSlabs = reveal > .1;
  const showFrame = reveal > .28;
  const showWalls = reveal > .4;
  const showWindows = reveal > .54;
  const showFurniture = reveal > .68;
  const showGarden = reveal > .88;
  const flatRoof = homeType === 'apartment' || homeType === 'penthouse';

  return (
    <group>
      <Box position={[0, -.35, 0]} args={[width + 1, .7, depth + 1]} color="#b9ad9b" />
      {showSlabs && floors.slice(0, visibleFloorCount).map((rooms, floorIndex) => {
        const y = floorIndex * floorHeight;
        return (
          <group key={floorIndex}>
            <Box position={[0, y, 0]} args={[width, .24, depth]} color={palette.floor} />
            {showFrame && [[-width / 2, -depth / 2], [width / 2, -depth / 2], [-width / 2, depth / 2], [width / 2, depth / 2]].map(([x, z], index) => <Box key={index} position={[x, y + 1.45, z]} args={[.2, 2.9, .2]} color={palette.trim} />)}
            {showWalls && <>
              <Box position={[0, y + 1.35, -depth / 2]} args={[width, 2.7, .16]} color={palette.wall} />
              <Box position={[-width / 2, y + 1.35, 0]} args={[.16, 2.7, depth]} color={palette.wall} />
              <Box position={[width / 2, y + 1.35, -depth * .18]} args={[.16, 2.7, depth * .64]} color={palette.wall} />
            </>}
            {showWindows && <>
              <Window position={[-width * .26, y + 1.5, -depth / 2 - .1]} />
              <Window position={[width * .26, y + 1.5, -depth / 2 - .1]} />
              <Window position={[-width / 2 - .1, y + 1.5, 0]} rotation={[0, Math.PI / 2, 0]} />
            </>}
            {rooms.map((room, index) => <RoomCell key={room.id} room={room} index={index} count={rooms.length} width={width} depth={depth} y={y} palette={palette} selected={selectedRoom === room.id} furnished={showFurniture} onSelect={() => onRoomSelect(room)} />)}
            {floorIndex > 0 && <Box position={[0, y + .14, depth / 2 + .8]} args={[width * .72, .18, 1.6]} color={palette.wood} />}
          </group>
        );
      })}
      {showRoof && reveal > .58 && <Roof width={width} depth={depth} y={visibleFloorCount * floorHeight + .1} palette={palette} flat={flatRoof} />}
      {showGarden && <>
        <Box position={[0, -.02, depth / 2 + 2]} args={[width * .8, .12, 2.8]} color="#c99255" />
        {[-width * .34, width * .34].map((x, index) => <group key={index} position={[x, 0, depth / 2 + 2.3]}><mesh position={[0, .65, 0]} castShadow><sphereGeometry args={[.72, 16, 12]} /><meshStandardMaterial color="#4f8b4a" /></mesh><Box position={[0, .25, 0]} args={[.18, .5, .18]} color="#765036" /></group>)}
      </>}
    </group>
  );
}

export function CharacterHouse3D(props: CharacterHouse3DProps) {
  const [canvasError, setCanvasError] = useState(false);
  const cameraPosition = useMemo<[number, number, number]>(() => {
    const { width } = dimensionsFor(props.homeType);
    return [width * .85, Math.max(8, props.floors.length * 4.4), width * 1.05];
  }, [props.homeType, props.floors.length]);

  if (canvasError) {
    return <div className="grid min-h-[32rem] place-items-center rounded-[2rem] bg-stone-100 p-8 text-center text-sm text-stone-600">This device could not start the 3D viewer. Please enable WebGL or try a current browser.</div>;
  }

  return (
    <div className="relative h-[34rem] overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-gradient-to-b from-cyan-50 to-emerald-100 shadow-inner">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: cameraPosition, fov: 38, near: .1, far: 120 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.domElement.setAttribute('aria-label', 'Interactive 3D cutaway house. Drag to rotate and scroll or pinch to zoom.');
          gl.domElement.addEventListener('webglcontextlost', () => setCanvasError(true), { once: true });
        }}
      >
        <color attach="background" args={['#dff5f2']} />
        <fog attach="fog" args={['#dff5f2', 28, 58]} />
        <ambientLight intensity={1.15} />
        <hemisphereLight args={['#fff9e8', '#496f42', 1.7]} />
        <directionalLight position={[10, 18, 12]} intensity={2.4} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-far={55} />
        <Suspense fallback={null}>
          <HouseScene {...props} />
          <mesh position={[0, -.75, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[70, 70]} />
            <meshStandardMaterial color="#3c8a35" roughness={1} />
          </mesh>
        </Suspense>
        <OrbitControls makeDefault enablePan={false} minDistance={9} maxDistance={34} minPolarAngle={.3} maxPolarAngle={Math.PI / 2.15} target={[0, Math.max(1.5, props.activeFloor * 1.25), 0]} />
      </Canvas>
      <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-stone-950/75 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur">Drag to orbit · Scroll or pinch to zoom · Tap a room</div>
    </div>
  );
}

