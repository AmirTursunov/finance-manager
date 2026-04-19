import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export const initPrisma = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected via Prisma (Supabase)');
    
    // Seed default categories if none exist
    const catCount = await prisma.category.count();
    if (catCount === 0) {
      await prisma.category.createMany({
        data: [
          { name: 'Sotuvlar', type: 'income' },
          { name: 'Xizmatlar', type: 'income' },
          { name: 'Ijara', type: 'expense' },
          { name: 'Oylik Maosh', type: 'expense' },
          { name: 'Logistika', type: 'expense' },
          { name: 'Boshqa', type: 'expense' }
        ]
      });
      console.log('🌱 Default categories seeded');
    }
  } catch (error) {
    console.error('❌ Failed to connect DB', error);
  }
};
