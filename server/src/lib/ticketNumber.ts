import { Prisma, type PrismaClient } from '@prisma/client';

type TxClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

/**
 * BR-29: TCK-YYYYMM-#### with a monthly-reset atomic sequence. The update
 * path is race-free by construction; the create path only runs for a
 * month's first ticket and can itself race, so a unique-violation there is
 * caught and retried as an update rather than surfacing a 500 (AC-30).
 */
async function nextSequence(tx: TxClient, yearMonth: string): Promise<number> {
  try {
    const updated = await tx.ticketNumberCounter.update({
      where: { yearMonth },
      data: { lastSequence: { increment: 1 } },
    });
    return updated.lastSequence;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      try {
        const created = await tx.ticketNumberCounter.create({
          data: { yearMonth, lastSequence: 1 },
        });
        return created.lastSequence;
      } catch (createErr) {
        if (createErr instanceof Prisma.PrismaClientKnownRequestError && createErr.code === 'P2002') {
          const updated = await tx.ticketNumberCounter.update({
            where: { yearMonth },
            data: { lastSequence: { increment: 1 } },
          });
          return updated.lastSequence;
        }
        throw createErr;
      }
    }
    throw err;
  }
}

export async function generateTicketNumber(tx: TxClient, now: Date = new Date()): Promise<string> {
  const yearMonth = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const sequence = await nextSequence(tx, yearMonth);
  return `TCK-${yearMonth}-${String(sequence).padStart(4, '0')}`;
}
