'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { History, ScanLine, ListChecks, AlertTriangle, Layers, MapPin } from 'lucide-react';

export default function Dashboard() {
  const [uncountedShelves, setUncountedShelves] = useState([]);
  const [settings, setSettings] = useState(null);
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const setRes = await fetch('/api/settings');
      let currentSettings = { uncounted_shelf_days: 10 };
      if (setRes.ok) {
        currentSettings = await setRes.json();
        setSettings(currentSettings);
      }

      const uncRes = await fetch(`/api/reports/uncounted?days=${currentSettings.uncounted_shelf_days || 10}`);
      if (uncRes.ok) {
        const uncData = await uncRes.json();
        setUncountedShelves(uncData.uncounted || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24 overflow-x-hidden">
      <Header title="داشبورد" />
      
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="p-4 md:p-6 flex flex-col gap-6 max-w-lg mx-auto w-full mt-2"
      >
        <div className="grid grid-cols-2 gap-4">
          <motion.div variants={item}>
            <Link href="/history" className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-3xl shadow-sm p-6 flex flex-col items-center justify-center aspect-square gap-3 hover:bg-white hover:scale-[1.02] active:scale-95 transition-all">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-1">
                <History strokeWidth={2} size={24} />
              </div>
              <span className="font-black text-xs text-gray-700">تاریخچه شمارش</span>
            </Link>
          </motion.div>
          
          <motion.div variants={item}>
            <Link href="/scan" className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-3xl shadow-sm p-6 flex flex-col items-center justify-center aspect-square gap-3 hover:bg-white hover:scale-[1.02] active:scale-95 transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50/50 rounded-bl-full -z-0"></div>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-1 relative z-10">
                <ScanLine strokeWidth={2.5} size={24} />
              </div>
              <span className="font-black text-xs text-gray-800 relative z-10">شروع انبارگردانی</span>
            </Link>
          </motion.div>
        </div>
        
        <motion.div variants={item}>
          <Link href="/my-counts" className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-3xl shadow-sm p-5 flex items-center justify-between hover:bg-white hover:scale-[1.02] active:scale-95 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                <ListChecks strokeWidth={2} size={20} />
              </div>
              <span className="font-black text-sm text-gray-800">شمارش‌های من</span>
            </div>
            <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-400 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </div>
          </Link>
        </motion.div>

        {/* Suggested Shelves to count */}
        {uncountedShelves.length > 0 && (
          <motion.div variants={item} className="flex flex-col gap-3 mt-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                <AlertTriangle size={18} className="text-orange-500" />
                قفسه‌های پیشنهادی
              </h3>
              <span className="text-[10px] text-gray-400 font-bold bg-white px-2 py-1 rounded-md border border-gray-100">
                بدون بررسی بالای {settings?.uncounted_shelf_days || 10} روز
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {uncountedShelves.slice(0, 4).map((shelf, idx) => (
                <Link 
                  key={idx} 
                  href={`/counting/shelf?code=${shelf.code}&warehouse=${shelf.warehouse}`}
                  className="bg-orange-50/50 border border-orange-100 rounded-[20px] p-4 flex flex-col gap-2 hover:bg-orange-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 bg-white rounded-[10px] flex items-center justify-center text-orange-400 shadow-sm">
                      <Layers size={14} />
                    </div>
                    <span className="text-xs font-black text-orange-600 uppercase tracking-widest">{shelf.code}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500 font-bold">
                    <MapPin size={10} />
                    طبقه {shelf.floor}، انبار {shelf.warehouse}
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

      </motion.div>
    </div>
  );
}
