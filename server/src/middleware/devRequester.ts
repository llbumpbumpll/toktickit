import type { NextFunction, Request, Response } from 'express';
import prisma from '../prisma';

export type DevRequester = { id: number; name: string; email: string };

declare module 'express-serve-static-core' {
  interface Request {
    devRequester?: DevRequester;
  }
}

const INVALID_REQUESTER_RESPONSE = {
  error: { code: 'INVALID_REQUESTER', message: 'Select a Development Requester to continue.' },
};

/**
 * BR-27/BR-28: reads X-Dev-Requester-Id and rejects with 401 unless it
 * resolves to an existing, active RequesterUser. Not wired into any route
 * yet -- the Requester-scoped endpoints that need it land in Issue #8-10.
 */
export async function requireDevRequester(req: Request, res: Response, next: NextFunction) {
  const header = req.header('X-Dev-Requester-Id');
  const id = header ? Number(header) : NaN;

  if (!header || !Number.isInteger(id)) {
    res.status(401).json(INVALID_REQUESTER_RESPONSE);
    return;
  }

  try {
    const requester = await prisma.requesterUser.findUnique({ where: { id } });
    if (!requester || !requester.active) {
      res.status(401).json(INVALID_REQUESTER_RESPONSE);
      return;
    }

    req.devRequester = { id: requester.id, name: requester.name, email: requester.email };
    next();
  } catch {
    res.status(401).json(INVALID_REQUESTER_RESPONSE);
  }
}
