import { describe, it, expect, beforeAll, afterAll, vi, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/prisma';
import * as fsPromises from 'fs/promises';

vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>();
  return { ...actual, writeFile: vi.fn(actual.writeFile) };
});

describe('POST /api/tickets', () => {
  let requesterId: number;
  let categoryId: number;
  let relatedSystemId: number;
  const createdTicketIds: number[] = [];

  beforeAll(async () => {
    const requester = await prisma.requesterUser.create({
      data: { name: 'Create Ticket Tester', email: `create-ticket-${Date.now()}@example.edu`, active: true },
    });
    requesterId = requester.id;

    const category = await prisma.category.findFirst();
    const relatedSystem = await prisma.relatedSystem.findFirst();
    categoryId = category!.id;
    relatedSystemId = relatedSystem!.id;
  });

  afterAll(async () => {
    await prisma.attachment.deleteMany({ where: { ticket: { requesterId } } });
    await prisma.ticket.deleteMany({ where: { id: { in: createdTicketIds } } });
    await prisma.requesterUser.delete({ where: { id: requesterId } });
    await prisma.$disconnect();
  });

  const validBody = () => ({
    categoryId,
    relatedSystemId,
    summary: 'Laptop battery drains quickly',
    description: 'Battery drops from 100% to 20% within two hours of normal use.',
    requestedPriority: 'MEDIUM',
  });

  it('401s without a valid X-Dev-Requester-Id header (BR-27, BR-28)', async () => {
    const res = await request(app).post('/api/tickets').send(validBody());
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_REQUESTER');
  });

  it('creates a ticket and returns a generated ticket number (AC-01)', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('X-Dev-Requester-Id', String(requesterId))
      .send(validBody());

    expect(res.status).toBe(201);
    expect(res.body.ticketNumber).toMatch(/^TCK-\d{6}-\d{4}$/);
    expect(res.body.currentStatus).toBe('NEW');
    expect(res.body.requesterId).toBe(requesterId);
    createdTicketIds.push(res.body.id);
  });

  it('returns field-level errors and makes no partial change for missing required fields (AC-08, BR-19)', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('X-Dev-Requester-Id', String(requesterId))
      .send({ categoryId, relatedSystemId });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields).toHaveProperty('summary');
    expect(res.body.error.fields).toHaveProperty('description');
    expect(res.body.error.fields).toHaveProperty('requestedPriority');
  });

  it('rejects a Summary shorter than 5 characters (AC-09, BR-09)', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('X-Dev-Requester-Id', String(requesterId))
      .send({ ...validBody(), summary: 'Hi' });

    expect(res.status).toBe(400);
    expect(res.body.error.fields.summary).toMatch(/5-150/);
  });

  it('rejects when no Requested Priority is chosen (AC-10, BR-11)', async () => {
    const { requestedPriority, ...rest } = validBody();
    void requestedPriority;
    const res = await request(app).post('/api/tickets').set('X-Dev-Requester-Id', String(requesterId)).send(rest);

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty('requestedPriority');
  });

  it('rejects an invalid Requested Priority value', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('X-Dev-Requester-Id', String(requesterId))
      .send({ ...validBody(), requestedPriority: 'BANANA' });

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty('requestedPriority');
  });

  it('rejects a categoryId that does not reference an existing row (BR-08)', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('X-Dev-Requester-Id', String(requesterId))
      .send({ ...validBody(), categoryId: 999999 });

    expect(res.status).toBe(400);
    expect(res.body.error.fields).toHaveProperty('categoryId');
  });

  it('generates distinct, collision-free ticket numbers under concurrent creation (AC-30, BR-29)', async () => {
    const [a, b] = await Promise.all([
      request(app).post('/api/tickets').set('X-Dev-Requester-Id', String(requesterId)).send(validBody()),
      request(app).post('/api/tickets').set('X-Dev-Requester-Id', String(requesterId)).send(validBody()),
    ]);

    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    expect(a.body.ticketNumber).not.toBe(b.body.ticketNumber);
    createdTicketIds.push(a.body.id, b.body.id);
  });
});

describe('POST /api/tickets/:id/attachments', () => {
  let requesterId: number;
  let otherRequesterId: number;
  let ticketId: number;

  beforeAll(async () => {
    const requester = await prisma.requesterUser.create({
      data: { name: 'Attachment Tester', email: `attachment-${Date.now()}@example.edu`, active: true },
    });
    requesterId = requester.id;

    const otherRequester = await prisma.requesterUser.create({
      data: { name: 'Other Requester', email: `attachment-other-${Date.now()}@example.edu`, active: true },
    });
    otherRequesterId = otherRequester.id;

    const category = await prisma.category.findFirst();
    const relatedSystem = await prisma.relatedSystem.findFirst();

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TCK-TEST-${Date.now()}`,
        requesterId,
        categoryId: category!.id,
        relatedSystemId: relatedSystem!.id,
        summary: 'Attachment test ticket',
        description: 'Ticket used to exercise the attachment upload endpoint.',
        requestedPriority: 'LOW',
      },
    });
    ticketId = ticket.id;
  });

  afterAll(async () => {
    await prisma.attachment.deleteMany({ where: { ticketId } });
    await prisma.ticket.delete({ where: { id: ticketId } });
    await prisma.requesterUser.deleteMany({ where: { id: { in: [requesterId, otherRequesterId] } } });
    await prisma.$disconnect();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uploads a valid attachment (AC-23 backend half)', async () => {
    const res = await request(app)
      .post(`/api/tickets/${ticketId}/attachments`)
      .set('X-Dev-Requester-Id', String(requesterId))
      .attach('file', Buffer.from('fake image bytes'), { filename: 'photo.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body.originalFilename).toBe('photo.png');
    expect(res.body.removed).toBe(false);
  });

  it('404s for a ticket owned by another requester (BR-06, AC-03)', async () => {
    const res = await request(app)
      .post(`/api/tickets/${ticketId}/attachments`)
      .set('X-Dev-Requester-Id', String(otherRequesterId))
      .attach('file', Buffer.from('fake'), { filename: 'photo.png', contentType: 'image/png' });

    expect(res.status).toBe(404);
  });

  it('rejects a disallowed file type (AC-13, BR-12)', async () => {
    const res = await request(app)
      .post(`/api/tickets/${ticketId}/attachments`)
      .set('X-Dev-Requester-Id', String(requesterId))
      .attach('file', Buffer.from('script'), { filename: 'malware.exe', contentType: 'application/octet-stream' });

    expect(res.status).toBe(415);
  });

  it('rejects a file larger than 5 MB (AC-14, BR-13)', async () => {
    const oversized = Buffer.alloc(5 * 1024 * 1024 + 1);
    const res = await request(app)
      .post(`/api/tickets/${ticketId}/attachments`)
      .set('X-Dev-Requester-Id', String(requesterId))
      .attach('file', oversized, { filename: 'big.png', contentType: 'image/png' });

    expect(res.status).toBe(413);
  });

  it('rejects a 6th attachment once 5 active attachments exist (AC-15, BR-14)', async () => {
    const category = await prisma.category.findFirst();
    const relatedSystem = await prisma.relatedSystem.findFirst();
    const limitTicket = await prisma.ticket.create({
      data: {
        ticketNumber: `TCK-LIMIT-${Date.now()}`,
        requesterId,
        categoryId: category!.id,
        relatedSystemId: relatedSystem!.id,
        summary: 'Attachment limit test ticket',
        description: 'Ticket used to exercise the 5-active-attachment limit.',
        requestedPriority: 'LOW',
      },
    });

    try {
      for (let i = 0; i < 5; i += 1) {
        const res = await request(app)
          .post(`/api/tickets/${limitTicket.id}/attachments`)
          .set('X-Dev-Requester-Id', String(requesterId))
          .attach('file', Buffer.from(`file-${i}`), { filename: `file-${i}.png`, contentType: 'image/png' });
        expect(res.status).toBe(201);
      }

      const sixth = await request(app)
        .post(`/api/tickets/${limitTicket.id}/attachments`)
        .set('X-Dev-Requester-Id', String(requesterId))
        .attach('file', Buffer.from('sixth'), { filename: 'sixth.png', contentType: 'image/png' });

      expect(sixth.status).toBe(409);
      expect(sixth.body.error.code).toBe('ATTACHMENT_LIMIT_REACHED');
    } finally {
      await prisma.attachment.deleteMany({ where: { ticketId: limitTicket.id } });
      await prisma.ticket.delete({ where: { id: limitTicket.id } });
    }
  });

  it('creates no Attachment row when the disk write fails (AC-34, BR-32)', async () => {
    vi.mocked(fsPromises.writeFile).mockRejectedValueOnce(new Error('disk full'));

    const countBefore = await prisma.attachment.count({ where: { ticketId } });

    const res = await request(app)
      .post(`/api/tickets/${ticketId}/attachments`)
      .set('X-Dev-Requester-Id', String(requesterId))
      .attach('file', Buffer.from('doomed'), { filename: 'doomed.png', contentType: 'image/png' });

    expect(res.status).toBe(500);

    const countAfter = await prisma.attachment.count({ where: { ticketId } });
    expect(countAfter).toBe(countBefore);
  });
});
