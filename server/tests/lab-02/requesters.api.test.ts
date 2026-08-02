import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/prisma';

describe('GET /api/requesters', () => {
  let activeId: number;
  let inactiveId: number;

  beforeAll(async () => {
    const active = await prisma.requesterUser.create({
      data: { name: 'Test Active Requester', email: `active-${Date.now()}@example.edu`, active: true },
    });
    const inactive = await prisma.requesterUser.create({
      data: { name: 'Test Inactive Requester', email: `inactive-${Date.now()}@example.edu`, active: false },
    });
    activeId = active.id;
    inactiveId = inactive.id;
  });

  afterAll(async () => {
    await prisma.requesterUser.deleteMany({ where: { id: { in: [activeId, inactiveId] } } });
    await prisma.$disconnect();
  });

  it('returns only active requesters (BR-04, AC-04)', async () => {
    const res = await request(app).get('/api/requesters');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const ids = res.body.map((r: { id: number }) => r.id);
    expect(ids).toContain(activeId);
    expect(ids).not.toContain(inactiveId);

    res.body.forEach((requester: { id: number; name: string; email: string }) => {
      expect(requester).toHaveProperty('id');
      expect(requester).toHaveProperty('name');
      expect(requester).toHaveProperty('email');
    });
  });

  it('returns an empty array when no active requesters exist (AC-05)', async () => {
    const previouslyActive = await prisma.requesterUser.findMany({
      where: { active: true },
      select: { id: true },
    });

    await prisma.requesterUser.updateMany({ data: { active: false } });

    try {
      const res = await request(app).get('/api/requesters');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    } finally {
      await prisma.requesterUser.updateMany({
        where: { id: { in: previouslyActive.map((r) => r.id) } },
        data: { active: true },
      });
    }
  });
});

describe('GET /api/related-systems', () => {
  it('returns the seeded related systems', async () => {
    const res = await request(app).get('/api/related-systems');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(6);
    res.body.forEach((system: { id: number; name: string }) => {
      expect(system).toHaveProperty('id');
      expect(system).toHaveProperty('name');
    });
  });
});
