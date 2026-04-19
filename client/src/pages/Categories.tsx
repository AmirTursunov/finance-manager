import { useState, useEffect } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { Trash2, Plus, Tag, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const socket = io();

const fetcher = (url: string) => axios.get(url).then(res => res.data);

const Categories = () => {
  const { data: categories, mutate } = useSWR(`${API_URL}/categories`, fetcher);
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    socket.on('categories_updated', () => mutate());
    return () => {
      socket.off('categories_updated');
    };
  }, [mutate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await axios.post(`${API_URL}/categories`, { name, type });
      toast.success("Kategoriya qo'shildi");
      setName('');
      mutate();
    } catch (e) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Ushbu kategoriyani o'chirmoqchimisiz?")) {
      try {
        await axios.delete(`${API_URL}/categories/${id}`);
        toast.success("O'chirildi");
        mutate();
      } catch (e) {
        toast.error("Xatolik");
      }
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Kategoriyalar Sozlamasi</h1>
          <span className="subtitle">Moliya turlarini boshqarish</span>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'minmax(300px, 400px) 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Qo'shish Formasi */}
        <div className="glass-card">
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Plus size={20} className="text-primary" /> Yangi qo'shish
          </h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <label>Nomi</label>
              <input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="input-main" 
                placeholder="Masalan: Ijara, Oylik..." 
                required 
              />
            </div>
            <div className="form-group">
              <label>Turi</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setType('income')}
                  className={`btn-primary ${type === 'income' ? 'active' : ''}`}
                  style={{ background: type === 'income' ? 'var(--success)' : 'rgba(255,255,255,0.05)', color: type === 'income' ? 'white' : 'var(--text-muted)', border: '1px solid var(--border-color)' }}
                >
                  <ArrowUpCircle size={18} /> Kirim
                </button>
                <button 
                  type="button" 
                  onClick={() => setType('expense')}
                  className={`btn-primary ${type === 'expense' ? 'active' : ''}`}
                  style={{ background: type === 'expense' ? 'var(--error)' : 'rgba(255,255,255,0.05)', color: type === 'expense' ? 'white' : 'var(--text-muted)', border: '1px solid var(--border-color)' }}
                >
                  <ArrowDownCircle size={18} /> Chiqim
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '10px' }}>
              {loading ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </form>
        </div>

        {/* Kategoriyalar Ro'yxati */}
        <div className="glass-card">
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Tag size={20} className="text-primary" /> Mavjud kategoriyalar
          </h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nomi</th>
                  <th>Turi</th>
                  <th style={{ textAlign: 'center' }}>O'chirish</th>
                </tr>
              </thead>
              <tbody>
                {categories?.map((cat: any) => (
                  <tr key={cat.id}>
                    <td style={{ fontWeight: 600 }}>{cat.name}</td>
                    <td>
                      <span className={`badge ${cat.type}`}>
                        {cat.type === 'income' ? 'Kirim' : 'Chiqim'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => handleDelete(cat.id)} className="btn-circle">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!categories?.length && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Hech nima topilmadi</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;
