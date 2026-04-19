import { useEffect, useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { io } from 'socket.io-client';
import { FileText, Table, Sparkles } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const socket = io();

const fetcher = (url: string) => axios.get(url).then(res => res.data);

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Analytics = () => {
  const { data, mutate } = useSWR(`${API_URL}/stats/analytics`, fetcher);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    socket.on('transactions_updated', () => mutate());
    return () => {
      socket.off('transactions_updated');
    };
  }, [mutate]);

  const exportToPDF = async () => {
    setIsExporting(true);
    const element = document.getElementById('analytics-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#020617' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Moliya_Hisoboti_${format(new Date(), 'dd_MM_yyyy')}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = async () => {
    if (!data) return;
    
    // Fetch all transactions for detailed export if not in data
    let txs = data.recentTransactions;
    try {
      const res = await axios.get(`${API_URL}/transactions`);
      txs = res.data;
    } catch (e) {
      console.error('Full TX fetch failed, using recent only');
    }

    const detailedData = txs.map((tx: any) => ({
      'Sana': format(new Date(tx.date), 'dd/MM/yyyy, HH:mm:ss'),
      'Kategoriya': tx.category?.name || 'Boshqa',
      'Tur': tx.type === 'income' ? 'Kirim' : 'Chiqim',
      'Summa (UZS)': tx.amount,
      'Izoh': tx.note || '-'
    }));

    const wsDetailed = XLSX.utils.json_to_sheet(detailedData);
    const wsSummary = XLSX.utils.json_to_sheet(data.categoryBreakdown);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsDetailed, "Batafsil Tranzaksiyalar");
    XLSX.utils.book_append_sheet(wb, wsSummary, "Kategoriyalar Boyicha");
    
    XLSX.writeFile(wb, `Moliya_Tahlili_${format(new Date(), 'dd_MM_yyyy')}.xlsx`);
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  if (!data) return <div className="loader-container"><div className="spinner"></div></div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Moliyaviy Tahlil</h1>
          <span className="subtitle">Grafiklar va sarf-harajatlar statistikasi</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-primary" onClick={exportToExcel} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <Table size={18} /> Excel
          </button>
          <button className="btn-primary" onClick={exportToPDF} disabled={isExporting}>
            {isExporting ? <div className="spinner" style={{ width: '16px', height: '16px' }}></div> : <><FileText size={18} /> PDF</>}
          </button>
        </div>
      </div>

      <div id="analytics-content" style={{ padding: isExporting ? '20px' : '0' }}>
        <div className="stats-grid">
          {/* Pie Chart */}
          <div className="glass-card">
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '18px', background: 'var(--primary)', borderRadius: '4px' }}></div>
              Xarajatlar bo'linishi
            </h2>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    paddingAngle={8}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {data.categoryBreakdown.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                    itemStyle={{ color: 'white' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Quick Insight Shortcut */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))' }}>
            <div className="brand-icon" style={{ marginBottom: '20px' }}>
               <Sparkles size={32} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>AI-dan so'rang</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '250px', marginBottom: '24px' }}>
              Grafiklarni AI orqali tahlil qilding va biznesingiz uchun tavsiyalar oling.
            </p>
            <a href="/advisor" className="btn-primary" style={{ width: 'auto' }}>
               Maslahat olish
            </a>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="glass-card" style={{ marginTop: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '18px', background: '#10b981', borderRadius: '4px' }}></div>
            Oylik dinamika
          </h2>
          <div style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="var(--text-muted)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={formatYAxis}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--border-color)', borderRadius: '12px' }}
                />
                <Bar dataKey="income" name="Kirim" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} />
                <Bar dataKey="expense" name="Chiqim" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
