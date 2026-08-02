import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import { requireDevRequester } from '../../src/middleware/devRequester';
import prisma from '../../src/prisma';

const app = express();
app.get('/protected', requireDevRequester, (req, res) => {
  res.status(200).json({ requester: req.devRequester });
});

describe('requireDevRequester middleware (BR-27, BR-28)', () => {
  let activeId: number;
  let inactiveId: number;

  beforeAll(async () => {
    const active = await prisma.requesterUser.create({
      data: { name: 'Middleware Active', email: `mw-active-${Date.now()}@example.edu`, active: true },
    });
    const inactive = await prisma.requesterUser.create({
      data: { name: 'Middleware Inactive', email: `mw-inactive-${Date.now()}@example.edu`, active: false },
    });
    activeId = active.id;
    inactiveId = inactive.id;
  });

  afterAll(async () => {
    await prisma.requesterUser.deleteMany({ where: { id: { in: [activeId, inactiveId] } } });
    await prisma.$disconnect();
  });

  it('401s when the header is missing', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_REQUESTER');
  });

  it('401s when the header is non-numeric', async () => {
    const res = await request(app).get('/protected').set('X-Dev-Requester-Id', 'abc');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_REQUESTER');
  });

  it("401s when the id doesn't match an existing requester", async () => {
    const res = await request(app).get('/protected').set('X-Dev-Requester-Id', '999999');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_REQUESTER');
  });

  it('401s for a deactivated requester (AC-33, BR-31)', async () => {
    const res = await request(app).get('/protected').set('X-Dev-Requester-Id', String(inactiveId));
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_REQUESTER');
  });

  it('passes through and attaches the requester for an active id', async () => {
    const res = await request(app).get('/protected').set('X-Dev-Requester-Id', String(activeId));
    expect(res.status).toBe(200);
    expect(res.body.requester).toMatchObject({ id: activeId, name: 'Middleware Active' });
  });
});
