'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, XCircle, Building2, Server } from 'lucide-react';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', isError: false });

  const showToast = (message, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setWarehouses(data.warehouses || []);
      }
    } catch (error) {
      console.error(error);
      showToast('خطا در دریافت انبارها', true);
    } finally {
      setLoading(false);
    }
  };

  const saveWarehouses = async (newWarehouses) => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warehouses: newWarehouses })
      });
      if (res.ok) {
        setWarehouses(newWarehouses);
        showToast('لیست انبارها با موفقیت بروزرسانی شد');
      } else {
        showToast('خطا در ذخیره انبارها', true);
      }
    } catch (error) {
      showToast('خطای شبکه', true);
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = () => {
    if (!newId || !newName) {
      showToast('لطفاً هم کد و هم نام انبار را وارد کنید', true);
      return;
    }
    if (warehouses.some(w => w.id === newId)) {
      showToast('انباری با این کد قبلاً وجود دارد', true);
      return;
    }
    const updated = [...warehouses, { id: newId, name: newName }];
    saveWarehouses(updated);
    setNewId('');
    setNewName('');
  };

  const handleDelete = (id) => {
    if (confirm('آیا از حذف این انبار اطمینان دارید؟')) {
      const updated = warehouses.filter(w => w.id !== id);
      saveWarehouses(updated);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex flex-col">
        <Header title="مدیریت انبارها" showBack={true} />
        <div className="flex-1 flex justify-center items-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24 relative overflow-x-hidden">
      <Header title="مدیریت انبارها" showBack={true} />

      <div className="flex-1 p-4 md:p-6 flex flex-col gap-6 max-w-lg mx-auto w-full mt-2">
        
        {/* Add New Warehouse */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50/50 rounded-bl-full -z-0"></div>
          
          <h3 className="text-sm font-bold text-gray-800 relative z-10">افزودن انبار جدید</h3>
          
          <div className="flex flex-col gap-3 relative z-10">
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                dir="ltr"
                value={newId}
                onChange={e => setNewId(e.target.value)}
                placeholder="کد حسابفا..." 
                className="w-28 bg-gray-50 border border-gray-200 rounded-[16px] px-4 py-3 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-center placeholder:font-normal" 
              />
              <input 
                type="text" 
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="نام انبار..." 
                className="flex-1 bg-gray-50 border border-gray-200 rounded-[16px] px-4 py-3 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:font-normal" 
              />
            </div>
            
            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={handleAdd}
              disabled={saving}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-[16px] text-sm font-black shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus size={18} strokeWidth={3} />
              ثبت انبار در سیستم
            </motion.button>
          </div>
        </div>

        {/* List of Warehouses */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-black text-gray-400 px-2 mt-2 uppercase tracking-wider">لیست انبارهای فعال</h3>
          
          <AnimatePresence>
            {warehouses.map((wh) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={wh.id} 
                className="flex items-center justify-between p-4 rounded-[20px] border border-gray-200 bg-white shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex flex-col items-center justify-center border border-gray-100">
                    <span className="text-[10px] text-gray-400 font-bold mb-0.5">کد</span>
                    <span className="text-sm font-black text-indigo-600">{wh.id}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-800">{wh.name}</span>
                    <span className="text-[10px] text-gray-400 font-medium mt-1 flex items-center gap-1">
                      <Building2 size={10} /> متصل به حسابفا
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleDelete(wh.id)}
                  disabled={saving}
                  className="w-10 h-10 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl flex items-center justify-center transition-all disabled:opacity-50"
                >
                  <Trash2 size={16} strokeWidth={2.5} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {warehouses.length === 0 && (
            <div className="text-center py-10 bg-white rounded-[24px] border border-dashed border-gray-300">
              <Server className="mx-auto text-gray-300 mb-2" size={32} />
              <p className="text-sm font-bold text-gray-500">هیچ انباری تعریف نشده است.</p>
            </div>
          )}
        </div>

      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl shadow-xl backdrop-blur-3xl border text-xs font-bold whitespace-nowrap flex items-center justify-center gap-2 ${toast.isError ? 'bg-red-50/90 border-red-100 text-red-600' : 'bg-gray-900/90 border-gray-700 text-white'}`}
          >
            {toast.isError ? <XCircle size={14} /> : <Check size={14} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
