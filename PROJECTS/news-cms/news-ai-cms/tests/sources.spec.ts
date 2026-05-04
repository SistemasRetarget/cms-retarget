import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3000/api';

test.describe('Sources Collection (RSS/API feeds)', () => {
  test('1. Create news source with URL', async ({ request }) => {
    const res = await request.post(`${API_BASE}/sources`, {
      data: {
        name: 'BBC News',
        feedUrl: 'https://feeds.bbc.co.uk/news/rss.xml',
        type: 'rss',
      },
    });
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).doc.name).toBe('BBC News');
  });

  test('2. Read source by ID', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/sources`, {
      data: {
        name: 'CNN',
        feedUrl: 'https://cnn.com/feed.xml',
        type: 'rss',
      },
    });
    const source = await createRes.json();
    const readRes = await request.get(`${API_BASE}/sources/${source.doc.id}`);
    expect(readRes.ok()).toBeTruthy();
    expect((await readRes.json()).name).toBe('CNN');
  });

  test('3. Update source URL', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/sources`, {
      data: {
        name: 'Reuters',
        feedUrl: 'https://reuters.com/old.xml',
        type: 'rss',
      },
    });
    const source = await createRes.json();
    const updateRes = await request.patch(`${API_BASE}/sources/${source.doc.id}`, {
      data: { feedUrl: 'https://reuters.com/new.xml' },
    });
    expect((await updateRes.json()).feedUrl).toBe('https://reuters.com/new.xml');
  });

  test('4. Delete source', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/sources`, {
      data: {
        name: 'Temp Source',
        feedUrl: 'https://example.com/feed',
        type: 'rss',
      },
    });
    const source = await createRes.json();
    const deleteRes = await request.delete(`${API_BASE}/sources/${source.doc.id}`);
    expect(deleteRes.ok()).toBeTruthy();
  });

  test('5. Validate RSS feed URL format', async ({ request }) => {
    const res = await request.post(`${API_BASE}/sources`, {
      data: {
        name: 'Invalid Feed',
        feedUrl: 'not-a-valid-url',
        type: 'rss',
      },
    });
    expect(res.ok()).toBeFalsy();
  });

  test('6. Support multiple feed types (RSS, Atom, JSON)', async ({ request }) => {
    const rssRes = await request.post(`${API_BASE}/sources`, {
      data: { name: 'RSS Feed', feedUrl: 'https://example.com/rss', type: 'rss' },
    });
    const atomRes = await request.post(`${API_BASE}/sources`, {
      data: { name: 'Atom Feed', feedUrl: 'https://example.com/atom', type: 'atom' },
    });
    expect(rssRes.ok()).toBeTruthy();
    expect(atomRes.ok()).toBeTruthy();
  });

  test('7. Set source as active/inactive', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/sources`, {
      data: {
        name: 'Active Source',
        feedUrl: 'https://example.com/feed',
        type: 'rss',
        active: true,
      },
    });
    expect((await createRes.json()).doc.active).toBe(true);
  });

  test('8. Enable/disable source aggregation', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/sources`, {
      data: {
        name: 'Test Source',
        feedUrl: 'https://example.com/feed',
        type: 'rss',
      },
    });
    const source = await createRes.json();
    const updateRes = await request.patch(`${API_BASE}/sources/${source.doc.id}`, {
      data: { aggregationEnabled: false },
    });
    expect(updateRes.ok()).toBeTruthy();
  });

  test('9. Track last fetch time', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/sources`, {
      data: {
        name: 'Track Source',
        feedUrl: 'https://example.com/feed',
        type: 'rss',
      },
    });
    const source = await createRes.json();
    const updateRes = await request.patch(`${API_BASE}/sources/${source.doc.id}`, {
      data: { lastFetchedAt: new Date().toISOString() },
    });
    expect((await updateRes.json()).lastFetchedAt).toBeTruthy();
  });

  test('10. Store fetch error log', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/sources`, {
      data: {
        name: 'Error Source',
        feedUrl: 'https://example.com/feed',
        type: 'rss',
      },
    });
    const source = await createRes.json();
    const updateRes = await request.patch(`${API_BASE}/sources/${source.doc.id}`, {
      data: { lastError: 'Connection timeout' },
    });
    expect((await updateRes.json()).lastError).toBe('Connection timeout');
  });

  test('11. List all active sources', async ({ request }) => {
    await request.post(`${API_BASE}/sources`, {
      data: {
        name: 'Active 1',
        feedUrl: 'https://example1.com',
        type: 'rss',
        active: true,
      },
    });
    const res = await request.get(`${API_BASE}/sources?where[active][equals]=true`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    data.docs.forEach((s: any) => {
      expect(s.active).toBe(true);
    });
  });

  test('12. Filter sources by type', async ({ request }) => {
    await request.post(`${API_BASE}/sources`, {
      data: {
        name: 'Atom Example',
        feedUrl: 'https://example.com/atom',
        type: 'atom',
      },
    });
    const res = await request.get(`${API_BASE}/sources?where[type][equals]=atom`);
    expect(res.ok()).toBeTruthy();
  });

  test('13. Pagination for sources', async ({ request }) => {
    const res = await request.get(`${API_BASE}/sources?limit=10&page=1`);
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).docs.length).toBeLessThanOrEqual(10);
  });

  test('14. Sort sources by name', async ({ request }) => {
    const res = await request.get(`${API_BASE}/sources?sort=name`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    let prevName = '';
    data.docs.forEach((s: any) => {
      expect(s.name.localeCompare(prevName)).toBeGreaterThanOrEqual(0);
      prevName = s.name;
    });
  });

  test('15. Bulk enable/disable sources', async ({ request }) => {
    const s1 = await (await request.post(`${API_BASE}/sources`, {
      data: { name: 'Bulk1', feedUrl: 'https://bulk1.com', type: 'rss', active: true },
    })).json();
    const s2 = await (await request.post(`${API_BASE}/sources`, {
      data: { name: 'Bulk2', feedUrl: 'https://bulk2.com', type: 'rss', active: true },
    })).json();

    const u1 = await request.patch(`${API_BASE}/sources/${s1.doc.id}`, {
      data: { active: false },
    });
    const u2 = await request.patch(`${API_BASE}/sources/${s2.doc.id}`, {
      data: { active: false },
    });

    expect(u1.ok()).toBeTruthy();
    expect(u2.ok()).toBeTruthy();
  });

  test('16. Add source metadata (language, region)', async ({ request }) => {
    const res = await request.post(`${API_BASE}/sources`, {
      data: {
        name: 'Regional Source',
        feedUrl: 'https://example.com/feed',
        type: 'rss',
        language: 'es',
        region: 'CL',
      },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('17. Track article count per source', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/sources`, {
      data: {
        name: 'Count Source',
        feedUrl: 'https://example.com/feed',
        type: 'rss',
      },
    });
    const source = await createRes.json();
    const updateRes = await request.patch(`${API_BASE}/sources/${source.doc.id}`, {
      data: { articleCount: 42 },
    });
    expect((await updateRes.json()).articleCount).toBe(42);
  });
});
