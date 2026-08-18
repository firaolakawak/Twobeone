import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('milestone route contract', () => {
  const appSource = readFileSync(join(process.cwd(), 'src/app/App.tsx'), 'utf8');
  const serverSource = readFileSync(join(process.cwd(), 'supabase/functions/server/index.tsx'), 'utf8');

  it('uses the plural milestones endpoint for create, update, and delete', () => {
    expect(appSource).not.toContain('make-server-6d579fee/milestone`');
    expect(appSource).not.toContain('make-server-6d579fee/milestone/${id}');
    expect(appSource.match(/make-server-6d579fee\/milestones/g)).toHaveLength(3);
  });

  it('provides matching create, update, and delete server routes', () => {
    expect(serverSource).toContain("app.post('/make-server-6d579fee/milestones'");
    expect(serverSource).toContain("app.put('/make-server-6d579fee/milestones/:id'");
    expect(serverSource).toContain("app.delete('/make-server-6d579fee/milestones/:id'");
    expect(serverSource).toContain('emotionLevel: Math.max(1, Math.min(10');
    expect(serverSource).toContain('normalizeMilestone(milestone, true)');
  });
});
