import { describe, it, expect, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('prisma seed', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('running the seed twice creates no duplicate RequesterUser/RelatedSystem rows', async () => {
    execSync('npx prisma db seed', { cwd: __dirname + '/..' });
    const requestersAfterFirst = await prisma.requesterUser.count();
    const relatedSystemsAfterFirst = await prisma.relatedSystem.count();

    execSync('npx prisma db seed', { cwd: __dirname + '/..' });
    const requestersAfterSecond = await prisma.requesterUser.count();
    const relatedSystemsAfterSecond = await prisma.relatedSystem.count();

    expect(requestersAfterSecond).toBe(requestersAfterFirst);
    expect(relatedSystemsAfterSecond).toBe(relatedSystemsAfterFirst);
  }, 20000);

  it('seeds at least 4 active and 1 inactive RequesterUser, and at least 6 RelatedSystems', async () => {
    const activeCount = await prisma.requesterUser.count({ where: { active: true } });
    const inactiveCount = await prisma.requesterUser.count({ where: { active: false } });
    const relatedSystemCount = await prisma.relatedSystem.count();

    expect(activeCount).toBeGreaterThanOrEqual(4);
    expect(inactiveCount).toBeGreaterThanOrEqual(1);
    expect(relatedSystemCount).toBeGreaterThanOrEqual(6);
  });
});
