'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Building2, AlertCircle, XCircle, Check } from 'lucide-react';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [newCode, setNewCode] = useState('');
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
      showToast('خطا در دریافت لیست انبارها', true);
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
        showToast('انبارها با موفقیت ذخیره شدند');
      } else {
        showToast('خطا در ذخیره انبار', true);
      }
    } catch (error) {
      console.error(error);
      showToast('خطای شبکه', true);
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = () => {
    if (!newCode || !newName) {
      showToast('لطفاً کد و نام انبار را وارد کنید', true);
      return;
    }
    
    // Convert to number strictly if Hesabfa requires int, but string is safer and compatible
    const codeId = parseInt(newCode);
    if(isNaN(codeId)) {
      showToast('کد انبار باید عدد باشد', true);
      return;
    }

    if (warehouses.find(w => parseInt(w.id) === codeId)) {
      showToast('انباری با این کد قبلاً ثبت شده است', true);
      return;
    }

    const updated = [...warehouses, { id: codeId.toString(), name: newName }];
    saveWarehouses(updated);
    setNewCode('');
    setNewName('');
  };

  const handleDelete = (id) => {
    if (!confirm('آیا از حذف این انبار اطمینان دارید؟')) return;
    const updated = warehouses.filter(w => w.id !== id);
    saveWarehouses(updated);
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex flex-col">
        <Header title="مدیریت انبارها" showBack={true} />
        <div className="flex-1 flex justify-center items-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24 relative overflow-x-hidden">
      <Header title="مدیریت انبارها" showBack={true} />

      <div className="flex-1 p-5 flex flex-col gap-6 max-w-lg mx-auto w-full mt-2">
        <div className="flex flex-col">
          <h2 className="text-xl font-black text-gray-800 tracking-tight">انبارهای حسابفا</h2>
          <p className="text-xs text-gray-400 font-medium mt-1">مدیریت لیست انبارهایی که سیستم استعلام موجودی می‌گیرد</p>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col gap-6">
          
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <div className="w-6 h-6 rounded-[10px] bg-orange-50 text-orange-600 flex items-center justify-center">
                <Building2 size={14} />
              </div>
              ثبت انبار جدید
            </h3>
            
            <div className="flex flex-col gap-3 bg-gray-50 p-4 rounded-[16px] border border-gray-100">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 pr-1">کد انبار (در حسابفا)</label>
                <input 
                  type="number" 
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="مثال: 11" 
                  className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors" 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 pr-1">نام انبار</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: انبار مرکزی" 
                  className="w-full bg-white border border-gray-200 rounded-[12px] px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors" 
                />
              </div>
              <motion.button 
                whileTap={{ scale: 0.97 }}
                onClick={handleAdd}
                disabled={saving}
                className="w-full bg-gray-900 text-white px-4 py-3 rounded-[12px] text-sm font-bold hover:bg-gray-800 transition-colors mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Plus size={16} strokeWidth={3} />}
                افزودن به لیست
              </motion.button>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-gray-800">لیست انبارهای فعال</h3>
            
            {warehouses.length === 0 ? (
              <div className="py-8 text-center bg-gray-50 rounded-[16px] border border-gray-100 border-dashed">
                <p className="text-xs text-gray-400 font-medium">هیچ انباری ثبت نشده است.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <AnimatePresence>
                  {warehouses.map((wh) => (
                    <motion.div 
                      key={wh.id} 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between p-3.5 rounded-[16px] border border-gray-200 bg-white shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-[10px] text-xs font-black tracking-wider">
                          {wh.id}
                        </div>
                        <span className="text-sm font-bold text-gray-800">{wh.name}</span>
                      </div>
                      <button
                        onClick={() => handleDelete(wh.id)}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

        </div>
      </div>

      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl shadow-xl backdrop-blur-3xl border text-xs font-bold whitespace-nowrap flex items-center justify-center gap-2 ${toast.isError ? 'bg-red-50/90 border-red-100 text-red-600' : 'bg-white/90 border-gray-100 text-gray-800'}`}
          >
            {toast.isError ? <XCircle size={14} /> : <Check size={14} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
