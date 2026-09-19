const isWhitespace = (character: string | undefined) => Boolean(character && /\s/u.test(character));

type SegmenterConstructor = new (
  locales?: string | string[],
  options?: { granularity: 'grapheme' },
) => { segment: (input: string) => Iterable<{ segment: string }> };

function splitGraphemes(content: string): string[] {
  const Segmenter = (Intl as unknown as { Segmenter?: SegmenterConstructor }).Segmenter;
  if (!Segmenter) return Array.from(content);
  return Array.from(
    new Segmenter(undefined, { granularity: 'grapheme' }).segment(content),
    ({ segment }) => segment,
  );
}

/**
 * Keeps a collapsed card close to half of the authored text while preferring
 * a nearby word boundary. Intl.Segmenter preserves joined emoji and combining
 * marks; Array.from is the fallback for older runtimes.
 */
export function getHalfTextPreview(content: string): string {
  const characters = splitGraphemes(content);
  if (characters.length < 2) return content;

  const midpoint = Math.ceil(characters.length / 2);
  let cutoff = midpoint;

  if (!isWhitespace(characters[midpoint - 1]) && !isWhitespace(characters[midpoint])) {
    let previousBoundary = midpoint;
    while (previousBoundary > 0 && !isWhitespace(characters[previousBoundary - 1])) {
      previousBoundary -= 1;
    }

    let nextBoundary = midpoint;
    while (nextBoundary < characters.length && !isWhitespace(characters[nextBoundary])) {
      nextBoundary += 1;
    }

    const previousDistance = midpoint - previousBoundary;
    const nextDistance = nextBoundary - midpoint;
    const maximumShift = Math.max(4, Math.floor(characters.length * 0.08));

    if (nextBoundary < characters.length && nextDistance <= previousDistance && nextDistance <= maximumShift) {
      cutoff = nextBoundary;
    } else if (previousBoundary > 0 && previousDistance <= maximumShift) {
      cutoff = previousBoundary;
    }
  }

  const preview = characters.slice(0, cutoff).join('').trimEnd();
  return preview && cutoff < characters.length ? `${preview}…` : content;
}
