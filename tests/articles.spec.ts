import { test, expect } from '@playwright/test';

const API_BASE = process.env.PW_API_BASE || 'http://localhost:3000/api';
const ADMIN_URL = process.env.PW_ADMIN_URL || 'http://localhost:3000/admin';

test.describe('Articles Collection', () => {
  // Article CRUD tests
  test('1. Create article with required fields', async ({ request }) => {
    const response = await request.post(`${API_BASE}/articles`, {
      data: {
        title: 'Test Article',
        slug: 'test-article-' + Date.now(),
        category: 'test-category',
        status: 'draft',
      },
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.doc?.title).toBe('Test Article');
  });

  test('2. Read article by ID', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/articles`, {
      data: { title: 'Read Test', slug: 'read-test-' + Date.now(), status: 'draft' },
    });
    const article = await createRes.json();
    const readRes = await request.get(`${API_BASE}/articles/${article.doc.id}`);
    expect(readRes.ok()).toBeTruthy();
    expect((await readRes.json()).title).toBe('Read Test');
  });

  test('3. Update article title', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/articles`, {
      data: { title: 'Old Title', slug: 'update-test-' + Date.now(), status: 'draft' },
    });
    const article = await createRes.json();
    const updateRes = await request.patch(`${API_BASE}/articles/${article.doc.id}`, {
      data: { title: 'New Title' },
    });
    expect(updateRes.ok()).toBeTruthy();
    expect((await updateRes.json()).title).toBe('New Title');
  });

  test('4. Delete article', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/articles`, {
      data: { title: 'Delete Test', slug: 'delete-test-' + Date.now(), status: 'draft' },
    });
    const article = await createRes.json();
    const deleteRes = await request.delete(`${API_BASE}/articles/${article.doc.id}`);
    expect(deleteRes.ok()).toBeTruthy();
  });

  // Status workflow tests
  test('5. Transition article from draft to review', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/articles`, {
      data: { title: 'Workflow Test', slug: 'workflow-' + Date.now(), status: 'draft' },
    });
    const article = await createRes.json();
    const updateRes = await request.patch(`${API_BASE}/articles/${article.doc.id}`, {
      data: { status: 'review' },
    });
    expect((await updateRes.json()).status).toBe('review');
  });

  test('6. Transition article from review to published', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/articles`, {
      data: { title: 'Publish Test', slug: 'publish-' + Date.now(), status: 'review' },
    });
    const article = await createRes.json();
    const updateRes = await request.patch(`${API_BASE}/articles/${article.doc.id}`, {
      data: { status: 'published', publishedAt: new Date().toISOString() },
    });
    expect((await updateRes.json()).status).toBe('published');
  });

  test('7. Set rejection reason on draft articles', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/articles`, {
      data: { title: 'Rejection Test', slug: 'reject-' + Date.now(), status: 'draft' },
    });
    const article = await createRes.json();
    const updateRes = await request.patch(`${API_BASE}/articles/${article.doc.id}`, {
      data: { rejectionReason: 'Needs more sources' },
    });
    expect((await updateRes.json()).rejectionReason).toBe('Needs more sources');
  });

  // Field validation tests
  test('8. Require article title', async ({ request }) => {
    const response = await request.post(`${API_BASE}/articles`, {
      data: { slug: 'no-title-' + Date.now(), status: 'draft' },
    });
    expect(response.ok()).toBeFalsy();
  });

  test('9. Enforce unique slug', async ({ request }) => {
    const slug = 'unique-slug-' + Date.now();
    await request.post(`${API_BASE}/articles`, {
      data: { title: 'First', slug, status: 'draft' },
    });
    const dupRes = await request.post(`${API_BASE}/articles`, {
      data: { title: 'Second', slug, status: 'draft' },
    });
    expect(dupRes.ok()).toBeFalsy();
  });

  test('10. Limit excerpt to 300 chars', async ({ request }) => {
    const longExcerpt = 'a'.repeat(400);
    const response = await request.post(`${API_BASE}/articles`, {
      data: {
        title: 'Excerpt Test',
        slug: 'excerpt-' + Date.now(),
        excerpt: longExcerpt,
        status: 'draft',
      },
    });
    expect(response.ok()).toBeFalsy();
  });

  // AI metadata tests
  test('11. Store AI provider metadata', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/articles`, {
      data: {
        title: 'AI Test',
        slug: 'ai-' + Date.now(),
        aiProvider: 'anthropic',
        aiModel: 'claude-opus',
        status: 'draft',
      },
    });
    const article = await createRes.json();
    expect(article.doc.aiProvider).toBe('anthropic');
    expect(article.doc.aiModel).toBe('claude-opus');
  });

  test('12. Query articles by category', async ({ request }) => {
    await request.post(`${API_BASE}/articles`, {
      data: {
        title: 'Category A',
        slug: 'cat-a-' + Date.now(),
        category: 'tech',
        status: 'draft',
      },
    });
    const res = await request.get(`${API_BASE}/articles?where[category][equals]=tech`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.docs.length).toBeGreaterThan(0);
  });

  test('13. Query published articles only', async ({ request }) => {
    await request.post(`${API_BASE}/articles`, {
      data: {
        title: 'Published',
        slug: 'pub-' + Date.now(),
        status: 'published',
      },
    });
    const res = await request.get(`${API_BASE}/articles?where[status][equals]=published`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    data.docs.forEach((doc: any) => {
      expect(doc.status).toBe('published');
    });
  });

  // Rich text and localization
  test('14. Store rich text content', async ({ request }) => {
    const body = { root: { type: 'root', children: [{ type: 'text', text: 'Test' }] } };
    const createRes = await request.post(`${API_BASE}/articles`, {
      data: {
        title: 'RichText Test',
        slug: 'richtext-' + Date.now(),
        body,
        status: 'draft',
      },
    });
    expect(createRes.ok()).toBeTruthy();
  });

  test('15. Localize article content (ES/EN)', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/articles`, {
      data: {
        title_es: 'Artículo Test',
        title_en: 'Test Article',
        slug: 'localized-' + Date.now(),
        status: 'draft',
      },
    });
    const article = await createRes.json();
    expect(article.doc.title_es || article.doc.title).toBeTruthy();
  });

  // Bulk and pagination
  test('16. Paginate articles (limit 10)', async ({ request }) => {
    const res = await request.get(`${API_BASE}/articles?limit=10&page=1`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.docs.length).toBeLessThanOrEqual(10);
  });

  test('17. Sort articles by publishedAt descending', async ({ request }) => {
    const res = await request.get(`${API_BASE}/articles?sort=-publishedAt`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    let prevDate = new Date().toISOString();
    data.docs.forEach((doc: any) => {
      if (doc.publishedAt) {
        expect(doc.publishedAt <= prevDate).toBeTruthy();
        prevDate = doc.publishedAt;
      }
    });
  });
});
