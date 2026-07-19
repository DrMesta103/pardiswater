'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Server } from 'lucide-react';

export default function WarehousesPage() {
  const [allWarehouses, setAllWarehouses] = useState([]);
  const [activeWarehouses, setActiveWarehouses] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', isError: false });

  const showToast = (message, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch settings (active warehouses)
      const settingsRes = await fetch('/api/settings');
      let activeIds = [];
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        const storedWarehouses = data.warehouses || [];
        activeIds = storedWarehouses.map(w => String(w.id));
      }

      // Fetch all warehouses from Hesabfa
      const hesabfaRes = await fetch('/api/hesabfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'warehouses' })
      });
      
      let fetchedWarehouses = [];
      if (hesabfaRes.ok) {
        const data = await hesabfaRes.json();
        if (data.Success && data.Result) {
          fetchedWarehouses = data.Result;
        }
      }

      setAllWarehouses(fetchedWarehouses);

      // Initialize active state map
      const initialActive = {};
      fetchedWarehouses.forEach(wh => {
        initialActive[wh.Id] = activeIds.includes(String(wh.Id)) || activeIds.includes(wh.Id);
      });
      setActiveWarehouses(initialActive);
    } catch (error) {
      console.error(error);
      showToast('خطا در دریافت اطلاعات انبارها', true);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (id) => {
    setActiveWarehouses(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare active warehouses list
      const activeList = allWarehouses
        .filter(wh => activeWarehouses[wh.Id])
        .map(wh => ({ id: String(wh.Id), name: wh.Name }));

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warehouses: activeList })
      });

      if (res.ok) {
        showToast('انبارهای فعال با موفقیت ذخیره شدند');
      } else {
        showToast('خطا در ذخیره انبارها', true);
      }
    } catch (error) {
      showToast('خطای شبکه', true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex flex-col">
        <Header title="مشاهده انبارها" showBack={true} />
        <div className="flex-1 flex justify-center items-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24 relative overflow-x-hidden">
      <Header title="مشاهده انبارها" showBack={true} />

      <div className="flex-1 p-4 md:p-6 flex flex-col gap-6 max-w-lg mx-auto w-full mt-2">
        
        {/* List of Warehouses */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-black text-gray-400 px-2 mt-2 uppercase tracking-wider">لیست انبارهای متصل به حسابفا</h3>
          
          <AnimatePresence>
            {allWarehouses.map((wh) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={wh.Id} 
                className={`flex items-center justify-between p-4 rounded-[20px] border transition-colors ${activeWarehouses[wh.Id] ? 'border-indigo-200 bg-white shadow-sm' : 'border-gray-200 bg-gray-50 opacity-70'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center border transition-colors ${activeWarehouses[wh.Id] ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-100 border-gray-200'}`}>
                    <span className="text-[10px] text-gray-400 font-bold mb-0.5">کد</span>
                    <span className={`text-sm font-black ${activeWarehouses[wh.Id] ? 'text-indigo-600' : 'text-gray-500'}`}>{wh.Id}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-800">{wh.Name}</span>
                    <span className="text-[10px] text-gray-400 font-medium mt-1 flex items-center gap-1">
                      <Building2 size={10} /> از حسابفا
                    </span>
                  </div>
                </div>
                
                {/* Toggle Switch */}
                <button 
                  onClick={() => handleToggle(wh.Id)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 ease-in-out shrink-0 focus:outline-none ${activeWarehouses[wh.Id] ? 'bg-indigo-500' : 'bg-gray-300'}`}
                >
                  <motion.div 
                    initial={false}
                    animate={{ x: activeWarehouses[wh.Id] ? -24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                  />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {allWarehouses.length === 0 && (
            <div className="text-center py-10 bg-white rounded-[24px] border border-dashed border-gray-300">
              <Server className="mx-auto text-gray-300 mb-2" size={32} />
              <p className="text-sm font-bold text-gray-500">انباری از حسابفا دریافت نشد.</p>
            </div>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-4 flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-4 rounded-[16px] text-sm font-extrabold shadow-md hover:bg-gray-800 transition-colors disabled:opacity-70"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            'ذخیره انبارها'
          )}
        </motion.button>

      </div>
      
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-20 left-0 right-0 mx-auto w-max z-50 pointer-events-none"
          >
            <div className={`flex items-center gap-2 px-4 py-3 rounded-[16px] shadow-xl backdrop-blur-md ${toast.isError ? 'bg-red-500/90 text-white' : 'bg-gray-900/90 text-white'}`}>
              <span className="text-sm font-bold">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
