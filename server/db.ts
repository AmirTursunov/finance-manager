import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export const initPrisma = async (retries = 3) => {
  while (retries > 0) {
    try {
      await prisma.$connect();
      console.log('✅ Database connected via Prisma (Supabase State)');
      
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
      return;
    } catch (error) {
      retries--;
      console.error(`❌ DB Connection failed. Retries left: ${retries}`, error);
      if (retries === 0) throw error;
      await new Promise(res => setTimeout(res, 5000)); // Wait 5s before retry
    }
  }
};
