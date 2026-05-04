import { test, expect } from '@playwright/test';

const API_BASE = process.env.PW_API_BASE || 'http://localhost:3000/api';

test.describe('Landing Pages Collection', () => {
  test('1. Create landing page with title', async ({ request }) => {
    const res = await request.post(`${API_BASE}/landing-pages`, {
      data: {
        title: 'Home Page',
        slug: 'home-' + Date.now(),
        published: true,
      },
    });
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).doc.title).toBe('Home Page');
  });

  test('2. Read landing page by ID', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/landing-pages`, {
      data: { title: 'About', slug: 'about-' + Date.now(), published: true },
    });
    const page = await createRes.json();
    const readRes = await request.get(`${API_BASE}/landing-pages/${page.doc.id}`);
    expect(readRes.ok()).toBeTruthy();
  });

  test('3. Update landing page title', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/landing-pages`, {
      data: { title: 'Old', slug: 'old-' + Date.now(), published: false },
    });
    const page = await createRes.json();
    const updateRes = await request.patch(`${API_BASE}/landing-pages/${page.doc.id}`, {
      data: { title: 'New Title' },
    });
    expect((await updateRes.json()).title).toBe('New Title');
  });

  test('4. Delete landing page', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/landing-pages`, {
      data: { title: 'Delete Me', slug: 'delete-' + Date.now(), published: false },
    });
    const page = await createRes.json();
    const deleteRes = await request.delete(`${API_BASE}/landing-pages/${page.doc.id}`);
    expect(deleteRes.ok()).toBeTruthy();
  });

  test('5. Add Hero block to landing page', async ({ request }) => {
    const res = await request.post(`${API_BASE}/landing-pages`, {
      data: {
        title: 'Hero Test',
        slug: 'hero-' + Date.now(),
        blocks: [
          {
            blockType: 'hero',
            headline: 'Welcome',
            subheadline: 'Test landing page',
            ctaText: 'Get Started',
            ctaUrl: '/signup',
          },
        ],
        published: true,
      },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.doc.blocks[0].headline).toBe('Welcome');
  });

  test('6. Add Features block', async ({ request }) => {
    const res = await request.post(`${API_BASE}/landing-pages`, {
      data: {
        title: 'Features Page',
        slug: 'features-' + Date.now(),
        blocks: [
          {
            blockType: 'features',
            title: 'Our Features',
            items: [
              { title: 'Feature 1', description: 'Fast' },
              { title: 'Feature 2', description: 'Reliable' },
            ],
          },
        ],
        published: true,
      },
    });
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).doc.blocks[0].items.length).toBe(2);
  });

  test('7. Add CTA block', async ({ request }) => {
    const res = await request.post(`${API_BASE}/landing-pages`, {
      data: {
        title: 'CTA Page',
        slug: 'cta-' + Date.now(),
        blocks: [
          {
            blockType: 'cta',
            headline: 'Ready to get started?',
            buttonText: 'Sign Up',
            buttonUrl: '/signup',
            variant: 'dark',
          },
        ],
        published: true,
      },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('8. Publish/unpublish landing page', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/landing-pages`, {
      data: { title: 'Draft', slug: 'draft-' + Date.now(), published: false },
    });
    const page = await createRes.json();
    const publishRes = await request.patch(`${API_BASE}/landing-pages/${page.doc.id}`, {
      data: { published: true },
    });
    expect((await publishRes.json()).published).toBe(true);
  });

  test('9. Enforce unique slug', async ({ request }) => {
    const slug = 'unique-slug-' + Date.now();
    await request.post(`${API_BASE}/landing-pages`, {
      data: { title: 'Page 1', slug, published: true },
    });
    const dupRes = await request.post(`${API_BASE}/landing-pages`, {
      data: { title: 'Page 2', slug, published: true },
    });
    expect(dupRes.ok()).toBeFalsy();
  });

  test('10. Require title field', async ({ request }) => {
    const res = await request.post(`${API_BASE}/landing-pages`, {
      data: { slug: 'no-title-' + Date.now(), published: true },
    });
    expect(res.ok()).toBeFalsy();
  });

  test('11. List published pages only', async ({ request }) => {
    await request.post(`${API_BASE}/landing-pages`, {
      data: { title: 'Public', slug: 'public-' + Date.now(), published: true },
    });
    const res = await request.get(`${API_BASE}/landing-pages?where[published][equals]=true`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    data.docs.forEach((p: any) => {
      expect(p.published).toBe(true);
    });
  });

  test('12. Add SEO metadata', async ({ request }) => {
    const res = await request.post(`${API_BASE}/landing-pages`, {
      data: {
        title: 'SEO Page',
        slug: 'seo-' + Date.now(),
        meta: {
          description: 'Test page description',
          keywords: 'test, page, seo',
          ogImage: 'https://example.com/og.jpg',
        },
        published: true,
      },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('13. Pagination for landing pages', async ({ request }) => {
    const res = await request.get(`${API_BASE}/landing-pages?limit=10&page=1`);
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).docs.length).toBeLessThanOrEqual(10);
  });

  test('14. Sort pages by title', async ({ request }) => {
    const res = await request.get(`${API_BASE}/landing-pages?sort=title`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    let prevTitle = '';
    data.docs.forEach((p: any) => {
      if (prevTitle) {
        expect(p.title.localeCompare(prevTitle)).toBeGreaterThanOrEqual(0);
      }
      prevTitle = p.title;
    });
  });

  test('15. Reorder blocks on landing page', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/landing-pages`, {
      data: {
        title: 'Reorder Test',
        slug: 'reorder-' + Date.now(),
        blocks: [
          { blockType: 'hero', headline: 'Block 1' },
          { blockType: 'features', title: 'Block 2' },
        ],
        published: true,
      },
    });
    const page = await createRes.json();
    const updateRes = await request.patch(`${API_BASE}/landing-pages/${page.doc.id}`, {
      data: {
        blocks: [
          { blockType: 'features', title: 'Block 2' },
          { blockType: 'hero', headline: 'Block 1' },
        ],
      },
    });
    expect(updateRes.ok()).toBeTruthy();
  });

  test('16. Track page views/analytics', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/landing-pages`, {
      data: {
        title: 'Analytics',
        slug: 'analytics-' + Date.now(),
        published: true,
      },
    });
    const page = await createRes.json();
    const updateRes = await request.patch(`${API_BASE}/landing-pages/${page.doc.id}`, {
      data: { viewCount: 1234 },
    });
    expect((await updateRes.json()).viewCount).toBe(1234);
  });

  test('17. Clone/duplicate landing page', async ({ request }) => {
    const original = await (await request.post(`${API_BASE}/landing-pages`, {
      data: { title: 'Original', slug: 'orig-' + Date.now(), published: true },
    })).json();

    const clone = await request.post(`${API_BASE}/landing-pages`, {
      data: {
        title: 'Clone of Original',
        slug: 'clone-' + Date.now(),
        blocks: original.doc.blocks,
        published: false,
      },
    });
    expect(clone.ok()).toBeTruthy();
  });
});
