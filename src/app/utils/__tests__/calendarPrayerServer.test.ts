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
    expect(source).toContain('Plan title: ${input.title.slice(0, 240)}');
    expect(source).toContain("Plan description: ${input.description.slice(0, 1_000) || 'No description provided'}");
    expect(source).toContain('Write 25-45 words');
  });

  it('uses the saved app language and records the generation source', () => {
    expect(source).toContain('resolveLanguage(profile?.language || body.language)');
    expect(source).toContain("generationSource: 'ai'");
    expect(source).toContain("generationSource: 'fallback'");
    expect(source).toContain('language, generationSource: generated.generationSource');
  });

  it('securely regenerates existing linked fallback prayers in place', () => {
    expect(source).toContain("app.post('/calendar/:id/regenerate-prayer'");
    expect(source).toContain("Only the creator can regenerate this prayer");
    expect(source).toContain("generationSource !== 'ai'");
    expect(source).toContain('kv.set(prayerKey, updatedPrayer)');
    expect(source).toContain('prayerDescription(generated.text, generated.scripture, language)');
  });

  it('answers linked prayers manually and when a one-time calendar date is fulfilled', () => {
    expect(source).toContain("app.post('/calendar/:id/answer-prayer'");
    expect(source).toContain('isAnswered: true');
    expect(source).toContain("item.recurrence !== 'none'");
    expect(source).toContain('calendarItemIsFulfilled(item, now)');
    expect(source).toContain("kv.del(`marriage-readiness:v2:${cacheBase}`)");
  });

  it('keeps the linked prayer id and regenerates prayer copy when a plan is edited', () => {
    expect(source).toContain("const prayerTopicChanged = Boolean(item.prayerId)");
    expect(source).toContain('id: item.prayerId');
    expect(source).toContain("prayerGenerationSource: 'ai'");
  });
});
