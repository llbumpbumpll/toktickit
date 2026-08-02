import express from 'express';
import cors from 'cors';
import prisma from './prisma';

const app = express();

app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'TokTickIT API'
  });
});

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
    });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load categories' });
  }
});

// BR-04: only active Development Requesters are ever listed.
app.get('/api/requesters', async (req, res) => {
  try {
    const requesters = await prisma.requesterUser.findMany({
      where: { active: true },
      select: { id: true, name: true, email: true },
      orderBy: { id: 'asc' },
    });
    res.status(200).json(requesters);
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' } });
  }
});

app.get('/api/related-systems', async (req, res) => {
  try {
    const relatedSystems = await prisma.relatedSystem.findMany({
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
    });
    res.status(200).json(relatedSystems);
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' } });
  }
});

export default app;
