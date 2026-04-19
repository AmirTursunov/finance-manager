import { useEffect } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Receipt, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const socket = io();

const fetcher = (url: string) => axios.get(url).then(res => res.data);

const StatCard = ({ title, amount, type, icon: Icon, trend }: any) => {
  const isPositive = type === 'income';
  
  return (
    <div className="glass-card stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className={`icon-container ${type}`}>
          <Icon size={24} />
        </div>
        <div className={`trend ${isPositive ? 'up' : 'down'}`}>
          {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          <span>{trend}%</span>
        </div>
      </div>
      <div style={{ marginTop: '20px' }}>
        <p className="stat-label">{title}</p>
        <h2 className="stat-value">{amount?.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 500 }}>UZS</span></h2>
      </div>
    </div>
  );
};

const Overview = () => {
  const { data: stats, mutate } = useSWR(`${API_URL}/stats/overview`, fetcher);

  useEffect(() => {
    socket.on('transactions_updated', () => mutate());
    return () => {
      socket.off('transactions_updated');
    };
  }, [mutate]);

  if (!stats) return <div className="loader-container"><div className="spinner"></div></div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Asosiy Panel</h1>
          <span className="subtitle">Xush kelibsiz, bugungi moliyaviy holatingiz</span>
        </div>
        <div className="date-badge">
          {new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="stats-grid">
        <StatCard 
          title="Umumiy Daromad" 
          amount={stats.totalIncome} 
          type="income" 
          icon={TrendingUp} 
          trend={stats.incomeTrend}
        />
        <StatCard 
          title="Umumiy Xarajat" 
          amount={stats.totalExpense} 
          type="expense" 
          icon={TrendingDown} 
          trend={stats.expenseTrend}
        />
        <StatCard 
          title="Sof Foyda" 
          amount={stats.netProfit} 
          type="profit" 
          icon={Activity} 
          trend={stats.profitTrend}
        />
      </div>

      <div className="glass-card" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Receipt className="text-primary" /> Oxirgi harakatlar
          </h2>
          <a href="/transactions" style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: 600 }}>Hammasini ko'rish</a>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Sana</th>
                <th>Kategoriya</th>
                <th>Turi</th>
                <th>Summa</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentTransactions?.map((tx: any) => (
                <tr key={tx.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{new Date(tx.date).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 600 }}>{tx.category?.name || 'Boshqa'}</td>
                  <td>
                    <span className={`badge ${tx.type}`}>
                      {tx.type === 'income' ? 'Kirim' : 'Chiqim'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: tx.type === 'income' ? 'var(--success)' : 'inherit' }}>
                    {tx.amount.toLocaleString()} UZS
                  </td>
                </tr>
              ))}
              {!stats.recentTransactions?.length && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Hozircha hech qanday ma'lumot yo'q.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Overview;
