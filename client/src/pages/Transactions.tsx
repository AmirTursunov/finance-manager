import { useEffect, useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { Trash2, Pencil, X, Save } from 'lucide-react';
import { format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const socket = io();

const fetcher = (url: string) => axios.get(url).then(res => res.data);

const EditModal = ({ transaction, categories, onClose, onSave }: any) => {
  const [amount, setAmount] = useState(transaction.amount);
  const [type, setType] = useState(transaction.type);
  const [categoryId, setCategoryId] = useState(transaction.categoryId || '');
  const [note, setNote] = useState(transaction.note || '');
  const [date, setDate] = useState(format(new Date(transaction.date), "yyyy-MM-dd'T'HH:mm"));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...transaction, amount: Number(amount), type, categoryId, note, date });
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      backdropFilter: 'blur(8px)'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '500px', animation: 'fadeIn 0.3s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Tahrirlash</h2>
          <button onClick={onClose} className="btn-circle"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label>Summa (UZS)</label>
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              className="input-main"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label>Tur</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="input-main">
                <option value="income">Kirim</option>
                <option value="expense">Chiqim</option>
              </select>
            </div>
            <div className="form-group">
              <label>Kategoriya</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-main">
                <option value="">Tanlang...</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Sana</label>
            <input 
              type="datetime-local" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              className="input-main"
              required
            />
          </div>

          <div className="form-group">
            <label>Izoh</label>
            <textarea 
              value={note} 
              onChange={(e) => setNote(e.target.value)} 
              className="input-main"
              style={{ minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} className="btn-primary" style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>Bekor qilish</button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>
              <Save size={18} /> Saqlash
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Transactions = () => {
  const { data: transactions, error, mutate } = useSWR(`${API_URL}/transactions`, fetcher);
  const { data: categories } = useSWR(`${API_URL}/categories`, fetcher);
  const [editingTx, setEditingTx] = useState<any>(null);

  useEffect(() => {
    socket.on('transactions_updated', mutate);
    return () => {
      socket.off('transactions_updated', mutate);
    };
  }, [mutate]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Ushbu tranzaksiyani o'chirmoqchimisiz?")) {
      try {
        await axios.delete(`${API_URL}/transactions/${id}`);
        toast.success("O'chirildi");
        mutate();
      } catch (e) {
        toast.error("Xatolik");
      }
    }
  };

  const handleUpdate = async (updatedData: any) => {
    try {
      await axios.put(`${API_URL}/transactions/${updatedData.id}`, updatedData);
      toast.success("Muvaffaqiyatli saqlandi");
      setEditingTx(null);
      mutate();
    } catch (e) {
      toast.error("Saqlashda xatolik");
    }
  };

  if (error) {
    return (
      <div className="loader-container">
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <h2>❌ Yuklashda xato</h2>
          <p style={{ color: 'var(--text-muted)' }}>Serverdan ma'lumot olish muvaffaqiyatsiz tugadi.</p>
        </div>
      </div>
    );
  }

  if (!transactions) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tranzaksiyalar Tarixi</h1>
          <span className="subtitle">Barcha moliya amallari ro'yxati</span>
        </div>
      </div>
      
      <div className="glass-card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Sana</th>
                <th>Kategoriya</th>
                <th>Tur</th>
                <th>Izoh</th>
                <th>Summa</th>
                <th style={{ textAlign: 'center' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx: any) => (
                <tr key={tx.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{format(new Date(tx.date), 'dd.MM.yyyy HH:mm')}</td>
                  <td>{tx.category?.name || '-'}</td>
                  <td>
                    <span className={`badge ${tx.type}`}>
                      {tx.type === 'income' ? 'Kirim' : 'Chiqim'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{tx.note || '-'}</td>
                  <td style={{ fontWeight: 700, color: tx.type === 'income' ? 'var(--success)' : 'inherit' }}>
                    {tx.amount.toLocaleString()} UZS
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        onClick={() => setEditingTx(tx)}
                        className="btn-circle"
                        title="Tahrirlash"
                        style={{ color: 'var(--primary)', borderColor: 'var(--primary-glow)' }}
                      >
                        <Pencil size={15} />
                      </button>
                      <button 
                        onClick={() => handleDelete(tx.id)}
                        className="btn-circle"
                        title="O'chirish"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Tranzaksiyalar mavjud emas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingTx && categories && (
        <EditModal 
          transaction={editingTx} 
          categories={categories}
          onClose={() => setEditingTx(null)}
          onSave={handleUpdate}
        />
      )}
    </div>
  );
};

export default Transactions;
