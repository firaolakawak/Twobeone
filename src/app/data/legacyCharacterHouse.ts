// Preserved helpers for the existing administration preview and saved designs.
export type HomeType = 'house' | 'villa' | 'townhouse' | 'apartment' | 'duplex' | 'penthouse';
export type InteriorStyle = 'warm-modern' | 'ethiopian-heritage' | 'peaceful-minimalist';

export interface HouseFinishes {
  wallPaint: string;
  sofaFabric: string;
  livingAccent: string;
  diningWood: string;
  kitchenCabinet: string;
  bathroomTile: string;
  masterBedding: string;
  guestBedding: string;
}

interface HomeDefinition {
  id: HomeType;
  name: string;
  description: string;
  floorRange: [number, number];
  bedroomRange: [number, number];
  bathroomRange: [number, number];
  defaults: Pick<HouseConfig, 'floors' | 'bedrooms' | 'bathrooms'>;
  shape: 'pitched' | 'villa' | 'narrow' | 'tower' | 'split' | 'terrace';
}

interface HouseConfig {
  homeType: HomeType;
  floors: number;
  bedrooms: number;
  bathrooms: number;
  interiorStyle: InteriorStyle;
  homeName: string;
  completedDays: number;
  finishes: HouseFinishes;
  lastBlockDate?: string;
  blueprintStatus: 'draft' | 'pending' | 'active';
  blueprintSubmittedAt?: string;
  blueprintApprovedAt?: string;
  challengeStartedAt?: string;
  submittedBy?: string;
  submittedByName?: string;
  approvedBy?: string;
  approvedByName?: string;
}

export interface Room {
  id: string;
  name: string;
  meaning: string;
  kind: 'living' | 'bedroom' | 'service' | 'faith' | 'outdoor';
  span?: number;
}


export const HOME_DEFINITIONS: HomeDefinition[] = [
  { id: 'house', name: 'House', description: 'Warm and welcoming', floorRange: [1, 2], bedroomRange: [1, 5], bathroomRange: [1, 4], defaults: { floors: 2, bedrooms: 3, bathrooms: 2 }, shape: 'pitched' },
  { id: 'villa', name: 'Villa', description: 'Spacious and hospitable', floorRange: [1, 3], bedroomRange: [3, 7], bathroomRange: [2, 6], defaults: { floors: 2, bedrooms: 5, bathrooms: 4 }, shape: 'villa' },
  { id: 'townhouse', name: 'Townhouse', description: 'Compact vertical living', floorRange: [2, 3], bedroomRange: [2, 5], bathroomRange: [2, 4], defaults: { floors: 3, bedrooms: 3, bathrooms: 2 }, shape: 'narrow' },
  { id: 'apartment', name: 'Apartment', description: 'Peaceful urban home', floorRange: [1, 1], bedroomRange: [1, 4], bathroomRange: [1, 3], defaults: { floors: 1, bedrooms: 2, bathrooms: 2 }, shape: 'tower' },
  { id: 'duplex', name: 'Duplex', description: 'Two lives, one home', floorRange: [2, 3], bedroomRange: [3, 6], bathroomRange: [2, 5], defaults: { floors: 2, bedrooms: 4, bathrooms: 3 }, shape: 'split' },
  { id: 'penthouse', name: 'Penthouse', description: 'Light-filled rooftop home', floorRange: [1, 2], bedroomRange: [2, 5], bathroomRange: [2, 5], defaults: { floors: 1, bedrooms: 3, bathrooms: 3 }, shape: 'terrace' },
];

export const FINISH_PRESETS: Record<InteriorStyle, HouseFinishes> = {
  'warm-modern': { wallPaint: '#fff8e9', sofaFabric: '#9b5960', livingAccent: '#d3a65f', diningWood: '#87532f', kitchenCabinet: '#72836d', bathroomTile: '#c9e0df', masterBedding: '#b87979', guestBedding: '#7c8e73' },
  'ethiopian-heritage': { wallPaint: '#fff1d2', sofaFabric: '#9d4432', livingAccent: '#d9a227', diningWood: '#6e3b22', kitchenCabinet: '#a85a31', bathroomTile: '#d8c0a0', masterBedding: '#b64a35', guestBedding: '#d4a43b' },
  'peaceful-minimalist': { wallPaint: '#f3f0e8', sofaFabric: '#788580', livingAccent: '#b7ab98', diningWood: '#817563', kitchenCabinet: '#a5aaa2', bathroomTile: '#dce5e2', masterBedding: '#8b9791', guestBedding: '#b1a99d' },
};

const STAGES = [
  { end: 40, name: 'Foundation', verse: 'Psalm 127:1' },
  { end: 70, name: 'Floors', verse: 'Luke 6:48' },
  { end: 115, name: 'Framework', verse: 'Proverbs 24:3' },
  { end: 170, name: 'Walls', verse: 'Nehemiah 2:18' },
  { end: 200, name: 'Doors & Windows', verse: 'Colossians 4:3' },
  { end: 240, name: 'Roof', verse: 'Psalm 91:1' },
  { end: 295, name: 'Rooms', verse: 'Romans 12:10' },
  { end: 325, name: 'Light & Water', verse: 'Matthew 5:14' },
  { end: 350, name: 'Interior & Garden', verse: 'Galatians 5:22–23' },
  { end: 365, name: 'Dedication', verse: 'Joshua 24:15' },
] as const;

export function isBlueprintNameReady(name: string) {
  return name.trim().length >= 3;
}

export function canUserApproveBlueprint(status: HouseConfig['blueprintStatus'], submittedBy: string | undefined, currentUserId: string | undefined, partnerId: string | undefined) {
  return status === 'pending' && Boolean(submittedBy && currentUserId && partnerId && submittedBy === partnerId && submittedBy !== currentUserId);
}

export function clampToRange(value: number, range: [number, number]) {
  return Math.min(range[1], Math.max(range[0], value));
}

export function getConstructionStage(completedDays: number) {
  const safeDays = Math.min(365, Math.max(0, Math.floor(completedDays)));
  const index = STAGES.findIndex(stage => safeDays < stage.end);
  return STAGES[index === -1 ? STAGES.length - 1 : index];
}

export function createFloorRooms(config: Pick<HouseConfig, 'floors' | 'bedrooms' | 'bathrooms' | 'homeType'>): Room[][] {
  const floors = Array.from({ length: config.floors }, () => [] as Room[]);
  const add = (floor: number, room: Room) => floors[Math.min(floors.length - 1, floor)].push(room);

  add(0, { id: 'living', name: 'Living Room', meaning: 'Fellowship and communication', kind: 'living', span: 2 });
  add(0, { id: 'dining', name: 'Dining Room', meaning: 'Gratitude and hospitality', kind: 'living' });
  add(0, { id: 'kitchen', name: 'Kitchen', meaning: 'Service and daily provision', kind: 'service' });
  add(0, { id: 'prayer', name: config.homeType === 'apartment' ? 'Prayer Corner' : 'Prayer Room', meaning: 'Worship and dependence on God', kind: 'faith' });
  if (config.homeType !== 'apartment') add(0, { id: 'entry', name: 'Welcome', meaning: 'Hospitality and openness', kind: 'outdoor' });

  for (let index = 0; index < config.bedrooms; index += 1) {
    const floor = config.floors === 1 ? 0 : 1 + (index % (config.floors - 1));
    add(floor, { id: `bed-${index}`, name: index === 0 ? 'Master Bedroom' : index === 1 ? 'Guest Room' : `Bedroom ${index + 1}`, meaning: 'Trust, rest, and care', kind: 'bedroom' });
  }
  for (let index = 0; index < config.bathrooms; index += 1) {
    const floor = index % config.floors;
    add(floor, { id: `bath-${index}`, name: index === 0 ? 'Bathroom' : `Bathroom ${index + 1}`, meaning: 'Renewal and healthy care', kind: 'service' });
  }
  if (config.homeType === 'villa' || config.homeType === 'penthouse') {
    add(config.floors - 1, { id: 'terrace', name: 'Terrace', meaning: 'Vision and shared dreams', kind: 'outdoor', span: 2 });
  }
  if (config.homeType === 'duplex') {
    add(0, { id: 'family', name: 'Family Room', meaning: 'Unity across generations', kind: 'living' });
  }
  return floors;
}

