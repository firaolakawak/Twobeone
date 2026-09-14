import { describe, expect, it } from 'vitest';
import { glassMaterial } from '../materials';

describe('glassMaterial', () => {
  it('applies defaults when a caller only changes hover, focus, or descendant states', () => {
    expect(glassMaterial('primary', 'hover:bg-accent focus:bg-accent dark:hover:bg-input/50 [&_span]:bg-white')).toBe('tbo-ui-primary');
  });

  it('keeps semantic surface aliases eligible for the shared material', () => {
    expect(glassMaterial('raised', 'bg-card dark:bg-popover p-4')).toBe('tbo-ui-raised');
    expect(glassMaterial('card', 'bg-background')).toBe('tbo-ui-card');
  });

  it('preserves deliberate semantic status fills and their foreground utility', () => {
    expect(glassMaterial('card', 'bg-emerald-50 text-emerald-700')).toBe('bg-card text-card-foreground');
    expect(glassMaterial('primary', 'bg-destructive text-white')).toBe('');
  });

  it('preserves custom artwork and dark resting fills', () => {
    expect(glassMaterial('raised', 'bg-gradient-to-r from-violet-500 to-pink-300')).toBe('bg-popover text-popover-foreground');
    expect(glassMaterial('field', 'dark:bg-slate-950')).toBe('bg-input-background border-input');
  });

  it('respects the explicit plain opt-out and existing glass compositions', () => {
    expect(glassMaterial('card', 'tbo-surface-plain')).toBe('bg-card text-card-foreground');
    expect(glassMaterial('raised', 'tbo-glass-raised')).toBe('bg-popover text-popover-foreground');
  });

  it('preserves inline background paint without suppressing material for ordinary layout styles', () => {
    expect(glassMaterial('card', undefined, { backgroundImage: 'url(/cover.webp)' })).toBe('bg-card text-card-foreground');
    expect(glassMaterial('field', undefined, { backgroundColor: 'transparent' })).toBe('bg-input-background border-input');
    expect(glassMaterial('card', undefined, { padding: 16 })).toBe('tbo-ui-card');
  });
});
