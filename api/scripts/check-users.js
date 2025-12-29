import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_KmTUknLSb2q4@ep-muddy-wave-afiatd2m.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require');

async function checkUsers() {
  try {
    const users = await sql`SELECT id, email, created_at FROM users ORDER BY created_at DESC LIMIT 10`;
    console.log('Total users:', users.length);
    console.log(JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUsers();
