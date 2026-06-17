// ============================================================
// Prisma Seed Script — Create Admin User
// ============================================================
// This script creates a default admin user for the Keevan Store platform.
// Run with: npx prisma db seed
// ============================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Check if admin already exists
  const existingAdmin = await prisma.creator.findUnique({
    where: { email: 'admin@keevanstore.com' },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists, skipping creation');
    return;
  }

  // Create admin user
  const admin = await prisma.creator.create({
    data: {
      id: 'admin-user-id',
      email: 'admin@keevanstore.com',
      username: 'admin',
      displayName: 'Keevan Store Admin',
      bio: 'Platform administrator',
      isAdmin: true,
      isVerified: true,
      isActive: true,
      balance: 0,
      totalEarnings: 0,
      totalSales: 0,
      totalViews: 0,
    },
  });

  console.log('✅ Admin user created successfully:', {
    email: admin.email,
    username: admin.username,
    isAdmin: admin.isAdmin,
  });

  console.log('🌱 Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
