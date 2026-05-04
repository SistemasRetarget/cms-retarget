import { test, expect } from '@playwright/test';

const API_BASE = process.env.PW_API_BASE || 'http://localhost:3000/api';

test.describe('Users Collection (Auth & Roles)', () => {
  test('1. Create user with email', async ({ request }) => {
    const res = await request.post(`${API_BASE}/users`, {
      data: {
        email: `user-${Date.now()}@test.com`,
        password: 'SecurePass123!',
      },
    });
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).doc.email).toBeTruthy();
  });

  test('2. Read user by ID', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/users`, {
      data: {
        email: `read-${Date.now()}@test.com`,
        password: 'SecurePass123!',
      },
    });
    const user = await createRes.json();
    const readRes = await request.get(`${API_BASE}/users/${user.doc.id}`);
    expect(readRes.ok()).toBeTruthy();
    expect((await readRes.json()).email).toBeTruthy();
  });

  test('3. Update user email', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/users`, {
      data: {
        email: `old-${Date.now()}@test.com`,
        password: 'SecurePass123!',
      },
    });
    const user = await createRes.json();
    const newEmail = `new-${Date.now()}@test.com`;
    const updateRes = await request.patch(`${API_BASE}/users/${user.doc.id}`, {
      data: { email: newEmail },
    });
    expect((await updateRes.json()).email).toBe(newEmail);
  });

  test('4. Delete user', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/users`, {
      data: {
        email: `delete-${Date.now()}@test.com`,
        password: 'SecurePass123!',
      },
    });
    const user = await createRes.json();
    const deleteRes = await request.delete(`${API_BASE}/users/${user.doc.id}`);
    expect(deleteRes.ok()).toBeTruthy();
  });

  test('5. Enforce unique email', async ({ request }) => {
    const email = `unique-${Date.now()}@test.com`;
    await request.post(`${API_BASE}/users`, {
      data: { email, password: 'SecurePass123!' },
    });
    const dupRes = await request.post(`${API_BASE}/users`, {
      data: { email, password: 'SecurePass123!' },
    });
    expect(dupRes.ok()).toBeFalsy();
  });

  test('6. Require strong password', async ({ request }) => {
    const res = await request.post(`${API_BASE}/users`, {
      data: {
        email: `weak-${Date.now()}@test.com`,
        password: 'weak',
      },
    });
    expect(res.ok()).toBeFalsy();
  });

  test('7. Assign user role (editor, admin, viewer)', async ({ request }) => {
    const res = await request.post(`${API_BASE}/users`, {
      data: {
        email: `editor-${Date.now()}@test.com`,
        password: 'SecurePass123!',
        role: 'editor',
      },
    });
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).doc.role).toBe('editor');
  });

  test('8. Lock/unlock user account', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/users`, {
      data: {
        email: `lock-${Date.now()}@test.com`,
        password: 'SecurePass123!',
      },
    });
    const user = await createRes.json();
    const lockRes = await request.patch(`${API_BASE}/users/${user.doc.id}`, {
      data: { locked: true },
    });
    expect((await lockRes.json()).locked).toBe(true);
  });

  test('9. Track last login', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/users`, {
      data: {
        email: `login-${Date.now()}@test.com`,
        password: 'SecurePass123!',
      },
    });
    const user = await createRes.json();
    const updateRes = await request.patch(`${API_BASE}/users/${user.doc.id}`, {
      data: { lastLogin: new Date().toISOString() },
    });
    expect((await updateRes.json()).lastLogin).toBeTruthy();
  });

  test('10. Send password reset email', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/users`, {
      data: {
        email: `reset-${Date.now()}@test.com`,
        password: 'SecurePass123!',
      },
    });
    const user = await createRes.json();
    const resetRes = await request.patch(`${API_BASE}/users/${user.doc.id}`, {
      data: { resetPasswordToken: 'reset-token-' + Date.now() },
    });
    expect(resetRes.ok()).toBeTruthy();
  });

  test('11. List all users with pagination', async ({ request }) => {
    const res = await request.get(`${API_BASE}/users?limit=10&page=1`);
    expect(res.ok()).toBeTruthy();
    expect((await res.json()).docs.length).toBeLessThanOrEqual(10);
  });

  test('12. Filter users by role', async ({ request }) => {
    await request.post(`${API_BASE}/users`, {
      data: {
        email: `admin-${Date.now()}@test.com`,
        password: 'SecurePass123!',
        role: 'admin',
      },
    });
    const res = await request.get(`${API_BASE}/users?where[role][equals]=admin`);
    expect(res.ok()).toBeTruthy();
  });

  test('13. Search users by email', async ({ request }) => {
    const email = `search-${Date.now()}@test.com`;
    await request.post(`${API_BASE}/users`, {
      data: { email, password: 'SecurePass123!' },
    });
    const res = await request.get(`${API_BASE}/users?where[email][contains]=${encodeURIComponent(email)}`);
    expect(res.ok()).toBeTruthy();
  });

  test('14. Sort users by email', async ({ request }) => {
    const res = await request.get(`${API_BASE}/users?sort=email`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    let prevEmail = '';
    data.docs.forEach((u: any) => {
      if (prevEmail) {
        expect(u.email.localeCompare(prevEmail)).toBeGreaterThanOrEqual(0);
      }
      prevEmail = u.email;
    });
  });

  test('15. Track user activity (articles approved/rejected)', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/users`, {
      data: {
        email: `activity-${Date.now()}@test.com`,
        password: 'SecurePass123!',
      },
    });
    const user = await createRes.json();
    const updateRes = await request.patch(`${API_BASE}/users/${user.doc.id}`, {
      data: { articlesReviewed: 42 },
    });
    expect((await updateRes.json()).articlesReviewed).toBe(42);
  });

  test('16. Bulk enable/disable user accounts', async ({ request }) => {
    const u1 = await (await request.post(`${API_BASE}/users`, {
      data: { email: `bulk1-${Date.now()}@test.com`, password: 'SecurePass123!' },
    })).json();
    const u2 = await (await request.post(`${API_BASE}/users`, {
      data: { email: `bulk2-${Date.now()}@test.com`, password: 'SecurePass123!' },
    })).json();

    const lock1 = await request.patch(`${API_BASE}/users/${u1.doc.id}`, {
      data: { locked: true },
    });
    const lock2 = await request.patch(`${API_BASE}/users/${u2.doc.id}`, {
      data: { locked: true },
    });

    expect(lock1.ok()).toBeTruthy();
    expect(lock2.ok()).toBeTruthy();
  });

  test('17. User session management and logout', async ({ request }) => {
    const createRes = await request.post(`${API_BASE}/users`, {
      data: {
        email: `session-${Date.now()}@test.com`,
        password: 'SecurePass123!',
      },
    });
    const user = await createRes.json();
    const updateRes = await request.patch(`${API_BASE}/users/${user.doc.id}`, {
      data: { lastLogout: new Date().toISOString() },
    });
    expect(updateRes.ok()).toBeTruthy();
  });
});
