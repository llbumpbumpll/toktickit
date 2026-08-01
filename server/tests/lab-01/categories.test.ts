import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('GET /api/categories', () => {
  it('should return 200 with categories ordered by id', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    res.body.forEach((category: { id: number; name: string }) => {
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
    });

    const ids = res.body.map((category: { id: number }) => category.id);
    const sortedIds = [...ids].sort((a, b) => a - b);
    expect(ids).toEqual(sortedIds);

    const names = res.body.map((category: { name: string }) => category.name);
    expect(names).toEqual(
      expect.arrayContaining(['Account and Access', 'Hardware', 'Software', 'Network']),
    );
  });
});
