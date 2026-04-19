import { Router } from 'express';
import { prisma } from './db';
import { getIO } from './socket';
import { getFinancialAdvisorAdvice } from './ai-service';

const router = Router();

// Auth - Simple Login
router.post('/auth/login', (req, res) => {
  const { password } = req.body;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

  if (password === ADMIN_PASSWORD) {
    res.json({ success: true, token: 'secret-session-token-' + Date.now() });
  } else {
    res.status(401).json({ error: 'Parol noto\'g\'ri' });
  }
});

// Get all transactions
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: { category: true },
      orderBy: { date: 'desc' },
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching transactions' });
  }
});

// Delete a transaction
router.delete('/transactions/:id', async (req, res) => {
  try {
    await prisma.transaction.delete({ where: { id: req.params.id } });
    getIO().emit('transactions_updated');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// Update a transaction
router.put('/transactions/:id', async (req, res) => {
  const { id } = req.params;
  const { amount, type, categoryId, note, date } = req.body;
  try {
    const updated = await prisma.transaction.update({
      where: { id },
      data: { 
        amount, 
        type, 
        categoryId, 
        note, 
        date: date ? new Date(date) : undefined 
      },
    });
    getIO().emit('transactions_updated');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create category
router.post('/categories', async (req, res) => {
  try {
    const { name, type } = req.body;
    const cat = await prisma.category.create({ data: { name, type } });
    getIO().emit('categories_updated');
    res.json(cat);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Delete a category
router.delete('/categories/:id', async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    getIO().emit('categories_updated');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Get analytics data with Monthly Dynamics
router.get('/stats/analytics', async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: { category: true }
    });
    
    // Group by Month for Dynamics Chart
    const monthsUz = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
    const monthlyHistoryMap: Record<string, { month: string, income: number, expense: number }> = {};

    transactions.forEach(tx => {
      const date = new Date(tx.date);
      const month = monthsUz[date.getMonth()];
      const year = date.getFullYear();
      const key = `${month} ${year}`;

      if (!monthlyHistoryMap[key]) {
        monthlyHistoryMap[key] = { month: key, income: 0, expense: 0 };
      }

      if (tx.type === 'income') monthlyHistoryMap[key].income += tx.amount;
      else monthlyHistoryMap[key].expense += tx.amount;
    });

    // Convert map to sorted array
    const monthlyHistory = Object.values(monthlyHistoryMap).sort((a, b) => {
      const [mA, yA] = a.month.split(' ');
      const [mB, yB] = b.month.split(' ');
      const monthIndexA = monthsUz.indexOf(mA);
      const monthIndexB = monthsUz.indexOf(mB);
      if (yA !== yB) return Number(yA) - Number(yB);
      return monthIndexA - monthIndexB;
    });

    const expenses = transactions.filter(tx => tx.type === 'expense');
    const incomes = transactions.filter(tx => tx.type === 'income');

    const categoryBreakdown = expenses.reduce((acc, curr) => {
      const catName = curr.category?.name || 'Boshqa';
      acc[catName] = (acc[catName] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      totalIncome: incomes.reduce((sum, tx) => sum + tx.amount, 0),
      totalExpense: expenses.reduce((sum, tx) => sum + tx.amount, 0),
      categoryBreakdown: Object.keys(categoryBreakdown).map(name => ({
        name,
        value: categoryBreakdown[name]
      })),
      monthlyHistory
    });
  } catch (error) {
    console.error('Analytics Fetch Error:', error);
    res.status(500).json({ error: 'Analytics Error' });
  }
});

// Get overview stats
router.get('/stats/overview', async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    const totalIncome = transactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalExpense = transactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    res.json({
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      incomeTrend: 0, // Placeholder for trend logic
      expenseTrend: 0,
      profitTrend: 0,
      recentTransactions: transactions.slice(0, 10),
    });
  } catch (error) {
    console.error('Overview Stats Error:', error);
    res.status(500).json({ error: 'Failed to fetch overview stats' });
  }
});

// AI Advisor - Consult with AI Expert
router.post('/ai/advisor', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Savol kiritilmagan' });

  try {
    const transactions = await prisma.transaction.findMany({
      include: { category: true }
    });

    const expenses = transactions.filter(t => t.type === 'expense');
    const income = transactions.filter(t => t.type === 'income');

    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

    const categoryBreakdown = expenses.reduce((acc, curr) => {
      const catName = curr.category?.name || 'Boshqa';
      acc[catName] = (acc[catName] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    const dataSummary = {
      totalIncome,
      totalExpense,
      categoryBreakdown: Object.keys(categoryBreakdown).map(name => ({
        name,
        value: categoryBreakdown[name]
      })),
      recentTransactions: transactions.slice(0, 10).map(t => ({
        date: t.date,
        type: t.type,
        amount: t.amount,
        category: t.category?.name || 'Boshqa',
        note: t.note
      }))
    };

    const advice = await getFinancialAdvisorAdvice(query, dataSummary);
    res.json({ advice });
  } catch (error) {
    console.error('API Advisor error:', error);
    res.status(500).json({ error: 'AI tahlilida xatolik yuz berdi' });
  }
});

export default router;
