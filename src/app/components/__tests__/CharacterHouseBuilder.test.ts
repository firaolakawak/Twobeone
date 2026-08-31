import { describe, expect, it } from 'vitest';
import {
  HOME_DEFINITIONS,
  clampToRange,
  createFloorRooms,
  getConstructionStage,
  isBlueprintNameReady,
} from '../CharacterHouseBuilder';

describe('CharacterHouseBuilder helpers', () => {
  it('keeps configuration values inside the selected home limits', () => {
    expect(clampToRange(0, [2, 5])).toBe(2);
    expect(clampToRange(4, [2, 5])).toBe(4);
    expect(clampToRange(9, [2, 5])).toBe(5);
  });

  it('offers all six prototype home designs', () => {
    expect(HOME_DEFINITIONS.map(home => home.id)).toEqual([
      'house', 'villa', 'townhouse', 'apartment', 'duplex', 'penthouse',
    ]);
  });

  it('maps progress to the correct construction stage', () => {
    expect(getConstructionStage(14).name).toBe('Foundation');
    expect(getConstructionStage(40).name).toBe('Floors');
    expect(getConstructionStage(364).name).toBe('Dedication');
    expect(getConstructionStage(365).name).toBe('Dedication');
  });

  it('builds the configured number of floors, bedrooms, and bathrooms', () => {
    const floors = createFloorRooms({ homeType: 'villa', floors: 3, bedrooms: 5, bathrooms: 4 });
    const rooms = floors.flat();

    expect(floors).toHaveLength(3);
    expect(rooms.filter(room => room.id.startsWith('bed-'))).toHaveLength(5);
    expect(rooms.filter(room => room.id.startsWith('bath-'))).toHaveLength(4);
    expect(rooms.some(room => room.name === 'Prayer Room')).toBe(true);
    expect(rooms.some(room => room.name === 'Dining Room')).toBe(true);
    expect(rooms.some(room => room.name === 'Master Bedroom')).toBe(true);
    expect(rooms.some(room => room.name === 'Guest Room')).toBe(true);
  });

  it('uses a prayer corner for an apartment floor plan', () => {
    const rooms = createFloorRooms({ homeType: 'apartment', floors: 1, bedrooms: 2, bathrooms: 1 }).flat();
    expect(rooms.some(room => room.name === 'Prayer Corner')).toBe(true);
  });

  it('requires a meaningful house name before blueprint submission', () => {
    expect(isBlueprintNameReady('')).toBe(false);
    expect(isBlueprintNameReady('  Hi  ')).toBe(false);
    expect(isBlueprintNameReady('Our Covenant Home')).toBe(true);
  });
});
