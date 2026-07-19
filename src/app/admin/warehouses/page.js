'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Server } from 'lucide-react';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
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
          <h3 className="text-xs font-black text-gray-400 px-2 mt-2 uppercase tracking-wider">لیست انبارهای فعال سیستم</h3>
          
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
    </div>
  );
}
