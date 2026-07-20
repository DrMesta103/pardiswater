'use client';
import Header from '@/components/Header';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Layers, Users, BarChart3, Settings, AlertTriangle, UserCog, Activity, Box, Map, LayoutGrid, AlertCircle, Info, Shield } from 'lucide-react';

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

  const SectionTitle = ({ title, icon: Icon, colorClass }) => (
    <div className="flex items-center gap-2 px-2 mt-4 mb-2">
      <div className={`p-1.5 rounded-lg ${colorClass}`}>
        <Icon size={16} strokeWidth={2.5} />
      </div>
      <h2 className="text-sm font-black text-gray-800">{title}</h2>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-20 overflow-x-hidden">
      <Header title="پنل مدیریت" showBack={true} />
      
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="p-4 md:p-6 flex flex-col gap-4 max-w-2xl mx-auto w-full"
      >
        {/* Category 1: System Settings */}
        <motion.div variants={item} className="flex flex-col gap-3">
          <SectionTitle title="تنظیمات سیستم" icon={Settings} colorClass="bg-gray-200 text-gray-700" />
          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/settings" className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-col items-center justify-center gap-3 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all active:scale-95">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center">
                <Settings strokeWidth={2} size={24} />
              </div>
              <span className="font-extrabold text-xs text-center text-gray-700">تنظیمات مدیریت</span>
            </Link>
            
            <Link href="/admin/warehouses" className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-col items-center justify-center gap-3 shadow-sm hover:border-orange-200 hover:shadow-md transition-all active:scale-95">
              <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
                <Map strokeWidth={2} size={24} />
              </div>
              <span className="font-extrabold text-xs text-center text-gray-700">مدیریت انبارها</span>
            </Link>

            <Link href="/admin/locations" className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-col items-center justify-center gap-3 shadow-sm hover:border-purple-200 hover:shadow-md transition-all active:scale-95">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                <Layers strokeWidth={2} size={24} />
              </div>
              <span className="font-extrabold text-xs text-center text-gray-700">مدیریت قفسه‌ها</span>
            </Link>
            
            <Link href="/admin/products" className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-col items-center justify-center gap-3 shadow-sm hover:border-teal-200 hover:shadow-md transition-all active:scale-95">
              <div className="w-12 h-12 bg-teal-50 text-teal-500 rounded-2xl flex items-center justify-center">
                <Box strokeWidth={2} size={24} />
              </div>
              <span className="font-extrabold text-xs text-center text-gray-700">لیست کالاها</span>
            </Link>
          </div>
        </motion.div>

        {/* Category 2: Reports */}
        <motion.div variants={item} className="flex flex-col gap-3">
          <SectionTitle title="گزارشات" icon={BarChart3} colorClass="bg-blue-100 text-blue-600" />
          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/discrepancies" className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-col items-center justify-center gap-3 shadow-sm hover:border-red-200 hover:shadow-md transition-all active:scale-95">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                <AlertTriangle strokeWidth={2} size={24} />
              </div>
              <span className="font-extrabold text-xs text-center text-gray-700">داشبورد مغایرت‌ها</span>
            </Link>
            
            <Link href="/admin/stats" className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-col items-center justify-center gap-3 shadow-sm hover:border-blue-200 hover:shadow-md transition-all active:scale-95">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                <LayoutGrid strokeWidth={2} size={24} />
              </div>
              <span className="font-extrabold text-xs text-center text-gray-700">آمار طبقات</span>
            </Link>
          </div>
        </motion.div>

        {/* Category 3: Management */}
        <motion.div variants={item} className="flex flex-col gap-3">
          <SectionTitle title="مدیریت" icon={UserCog} colorClass="bg-emerald-100 text-emerald-600" />
          <div className="flex flex-col gap-3">
            <Link href="/admin/users" className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex items-center justify-between hover:border-indigo-200 hover:shadow-md transition-all active:scale-95">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-[12px] flex items-center justify-center">
                  <Users strokeWidth={2} size={20} />
                </div>
                <span className="font-extrabold text-sm text-gray-800">کاربران</span>
              </div>
              <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-400 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </div>
            </Link>

            <Link href="/admin/tasks" className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex items-center justify-between hover:border-blue-200 hover:shadow-md transition-all active:scale-95">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-[12px] flex items-center justify-center">
                  <Activity strokeWidth={2} size={20} />
                </div>
                <span className="font-extrabold text-sm text-gray-800">مدیریت تسک‌ها</span>
              </div>
              <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-400 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </div>
            </Link>

            <Link href="/admin/logs" className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex items-center justify-between hover:border-gray-300 hover:shadow-md transition-all active:scale-95">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-[12px] flex items-center justify-center">
                  <Activity strokeWidth={2} size={20} />
                </div>
                <span className="font-extrabold text-sm text-gray-800">لاگ عملیات و فعالیت‌ها</span>
              </div>
              <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-400 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </div>
            </Link>
            
            <Link href="/admin/permissions" className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex items-center justify-between hover:border-emerald-200 hover:shadow-md transition-all active:scale-95">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-[12px] flex items-center justify-center">
                  <Shield strokeWidth={2} size={20} />
                </div>
                <span className="font-extrabold text-sm text-gray-800">سطح دسترسی</span>
              </div>
              <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-400 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </div>
            </Link>

            <Link href="/admin/danger-zone" className="bg-white border border-red-100 rounded-2xl shadow-sm p-4 flex items-center justify-between hover:bg-red-50 hover:border-red-200 transition-all active:scale-95">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-red-100 text-red-500 rounded-[12px] flex items-center justify-center">
                  <AlertCircle strokeWidth={2.5} size={20} />
                </div>
                <span className="font-extrabold text-sm text-red-600">منطقه خطر (Danger Zone)</span>
              </div>
              <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-red-400 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </div>
            </Link>

            <Link href="/admin/about" className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex items-center justify-between hover:border-indigo-200 hover:shadow-md transition-all active:scale-95">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-sky-50 text-sky-500 rounded-[12px] flex items-center justify-center">
                  <Info strokeWidth={2} size={20} />
                </div>
                <span className="font-extrabold text-sm text-gray-800">درباره توسعه‌دهنده</span>
              </div>
              <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-400 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </div>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
