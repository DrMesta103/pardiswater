'use client';
import Header from '@/components/Header';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Layers, Users, BarChart3 } from 'lucide-react';

export default function AdminDashboard() {
  
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
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-20">
      <Header title="پنل مدیریت" showBack={true} />
      
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="p-5 flex flex-col gap-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <motion.div variants={item}>
            <Link href="/admin/discrepancies" className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 flex flex-col items-center justify-center aspect-square gap-3 hover:bg-white hover:scale-[1.02] active:scale-95 transition-all">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-1">
                <BarChart3 strokeWidth={1.5} size={24} />
              </div>
              <span className="font-extrabold text-xs text-center text-gray-700">داشبورد مغایرت‌ها</span>
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Link href="/admin/settings" className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 flex flex-col items-center justify-center aspect-square gap-3 hover:bg-white hover:scale-[1.02] active:scale-95 transition-all">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
              <span className="font-extrabold text-xs text-center text-gray-700">تنظیمات و انبارها</span>
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Link href="/admin/locations" className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 flex flex-col items-center justify-center aspect-square gap-3 hover:bg-white hover:scale-[1.02] active:scale-95 transition-all">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-1">
                <Layers strokeWidth={1.5} size={24} />
              </div>
              <span className="font-extrabold text-xs text-center text-gray-700">وضعیت قفسه‌ها</span>
            </Link>
          </motion.div>
          
          <motion.div variants={item}>
            <Link href="/admin/stats" className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 flex flex-col items-center justify-center aspect-square gap-3 hover:bg-white hover:scale-[1.02] active:scale-95 transition-all">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
              </div>
              <span className="font-extrabold text-xs text-center text-gray-700">آمار طبقات</span>
            </Link>
          </motion.div>
        </div>
        
        <motion.div variants={item}>
          <div className="opacity-60 bg-white/80 backdrop-blur-sm border border-gray-100 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-5 flex items-center justify-between transition-all cursor-not-allowed">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 text-gray-400 rounded-xl flex items-center justify-center">
                <Users strokeWidth={1.5} size={20} />
              </div>
              <span className="font-extrabold text-sm text-gray-500">مدیریت کاربران (به زودی)</span>
            </div>
            <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-300 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
