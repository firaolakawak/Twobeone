import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('calendar AI prayer generation', () => {
  const source = readFileSync(
    join(process.cwd(), 'supabase/functions/server/calendar_routes.tsx'),
    'utf8',
  );

  it('uses the configured Gemini stack with the title and description', () => {
    expect(source).toContain("Deno.env.get('GEMINI_API_KEY')");
    expect(source).not.toContain("Deno.env.get('OPENAI_API_KEY')");
    expect(source).toContain('Plan title: ${input.title}');
    expect(source).toContain("Plan description: ${input.description || 'No description provided'}");
    expect(source).toContain('Write 25-45 words');
  });

  it('uses the saved app language and records the generation source', () => {
    expect(source).toContain('resolveLanguage(profile?.language || body.language)');
    expect(source).toContain("generationSource: 'ai'");
    expect(source).toContain("generationSource: 'fallback'");
    expect(source).toContain('language, generationSource: generated.generationSource');
  });
});
