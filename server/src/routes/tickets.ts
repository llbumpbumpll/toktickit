import crypto from 'crypto';
import * as fs from 'fs/promises';
import path from 'path';
import { Router } from 'express';
import multer from 'multer';
import prisma from '../prisma';
import { requireDevRequester } from '../middleware/devRequester';
import { generateTicketNumber } from '../lib/ticketNumber';
import {
  ALLOWED_ATTACHMENT_TYPES,
  ensureUploadDir,
  isAllowedAttachment,
  MAX_ACTIVE_ATTACHMENTS_PER_TICKET,
  MAX_ATTACHMENT_SIZE_BYTES,
  UPLOAD_DIR,
} from '../lib/uploads';

const router = Router();

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
type Priority = (typeof PRIORITIES)[number];

const INTERNAL_ERROR_RESPONSE = {
  error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' },
};

function notFound(message: string) {
  return { error: { code: 'NOT_FOUND', message } };
}

// BR-09, BR-10, BR-11: identical validation limits enforced server-side as the source of truth.
router.post('/', requireDevRequester, async (req, res) => {
  const requester = req.devRequester!;
  const body = req.body ?? {};
  const fields: Record<string, string> = {};

  const categoryId = Number(body.categoryId);
  if (body.categoryId === undefined || body.categoryId === null || body.categoryId === '' || !Number.isInteger(categoryId)) {
    fields.categoryId = 'Category is required.';
  }

  const relatedSystemId = Number(body.relatedSystemId);
  if (
    body.relatedSystemId === undefined ||
    body.relatedSystemId === null ||
    body.relatedSystemId === '' ||
    !Number.isInteger(relatedSystemId)
  ) {
    fields.relatedSystemId = 'Related System is required.';
  }

  let summary = '';
  if (typeof body.summary !== 'string' || body.summary.trim().length === 0) {
    fields.summary = 'Ticket Summary is required.';
  } else {
    summary = body.summary.trim();
    if (summary.length < 5 || summary.length > 150) {
      fields.summary = 'Ticket Summary must be 5-150 characters.';
    }
  }

  let description = '';
  if (typeof body.description !== 'string' || body.description.trim().length === 0) {
    fields.description = 'Description is required.';
  } else {
    description = body.description.trim();
    if (description.length < 10 || description.length > 5000) {
      fields.description = 'Description must be 10-5000 characters.';
    }
  }

  if (typeof body.requestedPriority !== 'string' || !PRIORITIES.includes(body.requestedPriority as Priority)) {
    fields.requestedPriority = 'Requested Priority is required.';
  }

  try {
    if (!fields.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) fields.categoryId = 'Selected Category no longer exists.';
    }
    if (!fields.relatedSystemId) {
      const relatedSystem = await prisma.relatedSystem.findUnique({ where: { id: relatedSystemId } });
      if (!relatedSystem) fields.relatedSystemId = 'Selected Related System no longer exists.';
    }

    if (Object.keys(fields).length > 0) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', fields } });
      return;
    }

    const ticket = await prisma.$transaction(async (tx) => {
      const ticketNumber = await generateTicketNumber(tx);
      return tx.ticket.create({
        data: {
          ticketNumber,
          requesterId: requester.id,
          categoryId,
          relatedSystemId,
          summary,
          description,
          requestedPriority: body.requestedPriority as Priority,
        },
      });
    });

    res.status(201).json(ticket);
  } catch {
    res.status(500).json(INTERNAL_ERROR_RESPONSE);
  }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ATTACHMENT_SIZE_BYTES },
});

// BR-12,13,14,32: ownership check first, then type/size/limit, then write-then-record.
router.post('/:id/attachments', requireDevRequester, async (req, res) => {
  const requester = req.devRequester!;
  const ticketId = Number(req.params.id);

  if (!Number.isInteger(ticketId)) {
    res.status(404).json(notFound('Ticket not found.'));
    return;
  }

  let ticket;
  try {
    ticket = await prisma.ticket.findFirst({ where: { id: ticketId, requesterId: requester.id } });
  } catch {
    res.status(500).json(INTERNAL_ERROR_RESPONSE);
    return;
  }

  if (!ticket) {
    res.status(404).json(notFound('Ticket not found.'));
    return;
  }

  upload.single('file')(req, res, async (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      res
        .status(413)
        .json({ error: { code: 'FILE_TOO_LARGE', message: 'Attachment must be 5 MB or smaller.' } });
      return;
    }
    if (err) {
      res.status(500).json(INTERNAL_ERROR_RESPONSE);
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', fields: { file: 'A file is required.' } } });
      return;
    }

    if (!isAllowedAttachment(file.originalname, file.mimetype)) {
      res.status(415).json({
        error: {
          code: 'UNSUPPORTED_FILE_TYPE',
          message: `Allowed attachment types: ${Object.keys(ALLOWED_ATTACHMENT_TYPES).join(', ')}.`,
        },
      });
      return;
    }

    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      res
        .status(413)
        .json({ error: { code: 'FILE_TOO_LARGE', message: 'Attachment must be 5 MB or smaller.' } });
      return;
    }

    try {
      const activeCount = await prisma.attachment.count({ where: { ticketId: ticket.id, removed: false } });
      if (activeCount >= MAX_ACTIVE_ATTACHMENTS_PER_TICKET) {
        res.status(409).json({
          error: { code: 'ATTACHMENT_LIMIT_REACHED', message: 'This ticket already has 5 active attachments.' },
        });
        return;
      }

      const ext = path.extname(file.originalname).toLowerCase();
      const storedFilename = `${crypto.randomUUID()}${ext}`;

      ensureUploadDir();
      await fs.writeFile(path.join(UPLOAD_DIR, storedFilename), file.buffer);

      const attachment = await prisma.attachment.create({
        data: {
          ticketId: ticket.id,
          originalFilename: file.originalname,
          storedFilename,
          mimeType: file.mimetype,
          sizeBytes: file.size,
        },
      });

      res.status(201).json({
        id: attachment.id,
        ticketId: attachment.ticketId,
        originalFilename: attachment.originalFilename,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
        uploadedAt: attachment.uploadedAt,
        removed: attachment.removed,
      });
    } catch {
      res.status(500).json(INTERNAL_ERROR_RESPONSE);
    }
  });
});

export default router;
