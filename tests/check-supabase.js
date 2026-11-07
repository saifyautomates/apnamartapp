const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

async function testSupabase() {
  console.log('Testing Supabase REST API & Storage connection...');
  const supabaseUrl = "https://ezwkjxhdkhgvyahypsjn.supabase.co";
  const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6d2tqeGhka2hndnlhaHlwc2puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5Nzg1OTEsImV4cCI6MjEwOTU1NDU5MX0.ebPntydKslECC1Ta45fMw9-ghe5EDVlI7u50wuMGaUY";
  
  try {
    const supabase = createClient(supabaseUrl, anonKey);
    const { data, error } = await supabase.from('Store').select('count', { count: 'exact', head: true });
    if (error) {
      console.log('Supabase REST status:', error.message || error);
    } else {
      console.log('Supabase REST connection: SUCCESS! Tables reachable.');
    }
  } catch (err) {
    console.log('Supabase REST error:', err.message);
  }

  console.log('\nTesting Prisma Client with timeout...');
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres.ezwkjxhdkhgvyahypsjn:Hufsasaifquazi@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=3"
      }
    }
  });

  try {
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timed out (local ISP might block port 6543 or IPv6)')), 5000));
    const queryPromise = prisma.$queryRaw`SELECT 1 as test`;
    const res = await Promise.race([queryPromise, timeoutPromise]);
    console.log('Prisma direct query SUCCESS:', res);
  } catch (err) {
    console.log('Prisma test result:', err.message);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

testSupabase();

