'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { motion } from 'framer-motion';

export default function AdminStats() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStats(data);
        } else {
          setStats([]);
        }
        setLoading(false);
      });
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-20">
      <Header title="آمار طبقات" showBack={true} />
      
      <div className="p-5 flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : stats.length === 0 ? (
          <div className="text-center text-gray-400 p-10 text-sm font-medium bg-white/60 rounded-3xl border border-gray-100">
            هیچ آماری یافت نشد.
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-3">
            {stats.map((stat, index) => (
              <motion.div 
                key={index} 
                variants={item}
                className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm p-4 flex items-center justify-between hover:scale-[1.01] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 font-extrabold text-xl rounded-xl flex items-center justify-center">
                    {stat.floor}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-extrabold text-gray-800 text-sm">شمارش‌های ثبت شده</span>
                    <span className="text-xs text-gray-500 mt-0.5">در تمامی مناطق و قطاع‌ها</span>
                  </div>
                </div>
                
                <div className="text-2xl font-black text-gray-900">
                  {stat.totalCountings}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
