'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { hasRole } from '@/lib/auth';
import { Edit2, Check, X, Box, Layers, User, Save, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HistoryPage() {
  const [counts, setCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [histRes, setRes] = await Promise.all([
        fetch('/api/counting'),
        fetch('/api/settings')
      ]);
      
      if (histRes.ok) setCounts(await histRes.json());
      if (setRes.ok) setSettings(await setRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (id) => {
    if (editValue === '') return;
    setSaving(true);
    try {
      const res = await fetch(`/api/counting/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_count: editValue, userId: user?.id })
      });
      
      if (res.ok) {
        setCounts(counts.map(c => c.id === id ? { ...c, new_count: Number(editValue) } : c));
        setEditingId(null);
      } else {
        alert('خطا در ثبت اصلاحیه');
      }
    } catch (e) {
      alert('خطای شبکه');
    } finally {
      setSaving(false);
    }
  };

  const canCorrect = settings?.correction_roles ? hasRole(user?.roles, settings.correction_roles) : false;

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24 overflow-x-hidden">
      <Header title="تاریخچه کل شمارش‌ها" showBack={true} />
      
      <div className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full flex flex-col gap-4 mt-2">
        
        {loading ? (
          <div className="flex flex-col justify-center items-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-bold text-sm">در حال دریافت تاریخچه...</p>
          </div>
        ) : counts.length === 0 ? (
          <div className="bg-white rounded-[24px] border border-dashed border-gray-300 p-10 text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
              <History size={32} className="text-gray-300" />
            </div>
            <p className="font-bold text-gray-500 text-sm">هیچ رکورد انبارگردانی یافت نشد.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="font-black text-gray-800 text-sm">آخرین رکوردهای ثبت شده</h3>
              <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black">
                {counts.length} رکورد
              </span>
            </div>

            <AnimatePresence>
              {counts.map(count => {
                const isEditing = editingId === count.id;
                
                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={count.id} 
                    className="bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-[12px] flex items-center justify-center shrink-0">
                          <Box size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800 text-sm leading-tight line-clamp-1">{count.product_name}</span>
                          <span className="text-[10px] text-gray-400 mt-1">کد: {count.product_id}</span>
                        </div>
                      </div>
                      
                      {!isEditing && (
                        <div className="flex flex-col items-center bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 shrink-0 ml-1">
                          <span className="font-black text-lg text-gray-800">{count.new_count}</span>
                          <span className="text-[9px] font-bold text-gray-400">شمارش شده</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                          <Layers size={12} className="text-gray-400" />
                          قفسه: <span className="text-gray-800 uppercase tracking-widest">{count.shelfCode || count.shelf || 'ثبت نشده'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                          <User size={12} className="text-gray-400" />
                          شمارنده: <span className="text-gray-800">{count.user?.name || 'نامشخص'}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-[9px] text-gray-400 dir-ltr text-right font-medium">
                          {new Date(count.createdAt).toLocaleString('fa-IR')}
                        </span>
                        
                        {canCorrect && !isEditing && (
                          <button 
                            onClick={() => { setEditingId(count.id); setEditValue(count.new_count); }}
                            className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            <Edit2 size={10} />
                            اصلاحیه
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Edit Mode */}
                    <AnimatePresence>
                      {isEditing && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="pt-3 border-t border-gray-100 flex items-center gap-2 overflow-hidden"
                        >
                          <input 
                            type="number" 
                            dir="ltr"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-20 bg-gray-50 border border-gray-200 rounded-[12px] px-3 py-2 text-center text-sm font-black text-gray-800 focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                          <button 
                            onClick={() => handleEditSubmit(count.id)}
                            disabled={saving}
                            className="bg-gray-900 text-white px-4 py-2 rounded-[12px] text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {saving ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={14} />}
                            ثبت
                          </button>
                          <button 
                            onClick={() => setEditingId(null)}
                            disabled={saving}
                            className="bg-red-50 text-red-500 p-2 rounded-[12px] transition-all hover:bg-red-100 disabled:opacity-50"
                          >
                            <X size={16} />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
