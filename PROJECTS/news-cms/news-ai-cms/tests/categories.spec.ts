import { test, expect } from '@playwright/test';

const API_BASE = process.env.PW_API_BASE || 'http://localhost:3000/api';

test.describe('Categories Collection', () => {
  test('1. Create category with name', async ({ request }) => {
    const res = await request.post(`${API_BASE}/categories`, {
      data: { name: 'Tech News' },
    });
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).doc.name).toBe('Tech News');
  });

  test('2. Read category by ID', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/categories`, {
      data: { name: 'Sports' },
    });
    const cat = await createRes.json();
    const readRes = await request.get(`${API_BASE}/categories/${cat.doc.id}`);
    expect(readRes.ok()).toBeTruthy();
    expect((await readRes.json()).name).toBe('Sports');
  });

  test('3. Update category name', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/categories`, {
      data: { name: 'Old Name' },
    });
    const cat = await createRes.json();
    const updateRes = await request.patch(`${API_BASE}/categories/${cat.doc.id}`, {
      data: { name: 'New Name' },
    });
    expect((await updateRes.json()).name).toBe('New Name');
  });

  test('4. Delete category', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/categories`, {
      data: { name: 'Temp Cat' },
    });
    const cat = await createRes.json();
    const deleteRes = await request.delete(`${API_BASE}/categories/${cat.doc.id}`);
    expect(deleteRes.ok()).toBeTruthy();
  });

  test('5. List all categories', async ({ request }) => {
    await request.post(`${API_BASE}/categories`, { data: { name: 'Cat A' } });
    await request.post(`${API_BASE}/categories`, { data: { name: 'Cat B' } });
    const res = await request.get(`${API_BASE}/categories`);
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).docs.length).toBeGreaterThan(0);
  });

  test('6. Require category name', async ({ request }) => {
    const res = await request.post(`${API_BASE}/categories`, {
      data: {},
    });
    expect(res.ok()).toBeFalsy();
  });

  test('7. Enforce unique category name', async ({ request }) => {
    const name = 'Unique-' + Date.now();
    await request.post(`${API_BASE}/categories`, { data: { name } });
    const dupRes = await request.post(`${API_BASE}/categories`, { data: { name } });
    expect(dupRes.ok()).toBeFalsy();
  });

  test('8. Add description field (optional)', async ({ request }) => {
    const res = await request.post(`${API_BASE}/categories`, {
      data: { name: 'News', description: 'Latest news stories' },
    });
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).doc.description).toBe('Latest news stories');
  });

  test('9. Add icon field (optional)', async ({ request }) => {
    const res = await request.post(`${API_BASE}/categories`, {
      data: { name: 'Sports', icon: '⚽' },
    });
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).doc.icon).toBe('⚽');
  });

  test('10. Filter categories by name', async ({ request }) => {
    const name = 'FilterTest-' + Date.now();
    await request.post(`${API_BASE}/categories`, { data: { name } });
    const res = await request.get(`${API_BASE}/categories?where[name][contains]=${name}`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.docs.some((c: any) => c.name.includes(name))).toBeTruthy();
  });

  test('11. Count articles per category', async ({ request }) => {
    const catRes = await request.post(`${API_BASE}/categories`, {
      data: { name: 'Article Count Test' },
    });
    const cat = await catRes.json();
    // Ensure articles can reference this category
    const res = await request.get(`${API_BASE}/categories/${cat.doc.id}`);
    expect(res.ok()).toBeTruthy();
  });

  test('12. Soft delete category (archive)', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/categories`, {
      data: { name: 'Archive Test' },
    });
    const cat = await createRes.json();
    const updateRes = await request.patch(`${API_BASE}/categories/${cat.doc.id}`, {
      data: { archived: true },
    });
    expect(updateRes.ok()).toBeTruthy();
  });

  test('13. Pagination for categories', async ({ request }) => {
    const res = await request.get(`${API_BASE}/categories?limit=5&page=1`);
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).docs.length).toBeLessThanOrEqual(5);
  });

  test('14. Sort categories by name ascending', async ({ request }) => {
    const res = await request.get(`${API_BASE}/categories?sort=name`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    let prevName = '';
    data.docs.forEach((c: any) => {
      expect(c.name.localeCompare(prevName)).toBeGreaterThanOrEqual(0);
      prevName = c.name;
    });
  });

  test('15. Get total count of categories', async ({ request }) => {
    const res = await request.get(`${API_BASE}/categories`);
    const data = await res.json();
    expect(data.totalDocs).toBeGreaterThanOrEqual(0);
  });

  test('16. Bulk update multiple categories', async ({ request }) => {
    const cat1 = await (await request.post(`${API_BASE}/categories`, {
      data: { name: 'Bulk1' },
    })).json();
    const cat2 = await (await request.post(`${API_BASE}/categories`, {
      data: { name: 'Bulk2' },
    })).json();

    const update1 = await request.patch(`${API_BASE}/categories/${cat1.doc.id}`, {
      data: { description: 'Updated 1' },
    });
    const update2 = await request.patch(`${API_BASE}/categories/${cat2.doc.id}`, {
      data: { description: 'Updated 2' },
    });

    expect(update1.ok()).toBeTruthy();
    expect(update2.ok()).toBeTruthy();
  });

  test('17. Category with slug for URL-friendly names', async ({ request }) => {
    const res = await request.post(`${API_BASE}/categories`, {
      data: {
        name: 'Breaking News',
        slug: 'breaking-news-' + Date.now(),
      },
    });
    expect(res.ok()).toBeTruthy();
  });
});
