import { db } from './api/db/index.js';
import { users } from './api/db/schema.js';
import { eq } from 'drizzle-orm';

async function checkUser() {
  const result = await db.select().from(users).where(eq(users.email, 'kuwahata@mdc-japan.org'));
  console.log('User found:', result.length > 0);
  if (result.length > 0) {
    console.log('User ID:', result[0].id);
    console.log('Email:', result[0].email);
    console.log('Created at:', result[0].createdAt);
    console.log('Has password:', !!result[0].passwordHash);
  } else {
    console.log('User NOT found in database');
  }
}

checkUser();
