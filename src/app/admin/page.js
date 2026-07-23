'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Layers, Users, BarChart3, Settings, AlertTriangle, UserCog, Activity, Box, Map, LayoutGrid, AlertCircle, Info, Shield, Lock, Calendar } from 'lucide-react';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      // If user doesn't have ANY admin/staff roles, boot them
      if (!parsedUser.roles || parsedUser.roles.length === 0) {
        router.push('/dashboard');
      }
    } else {
      router.push('/');
    }

    fetch('/api/settings').then(res => res.json()).then(data => {
      setPermissions(data.admin_permissions || {});
    });
  }, [router]);

  const hasPermission = (sectionId) => {
    if (!user || !permissions) return false; // Loading
    if (user.roles?.includes('ADMIN')) return true;
    return user.roles?.some(role => permissions[role]?.includes(sectionId));
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

  const SectionTitle = ({ title, icon: Icon, colorClass }) => (
    <div className="flex items-center gap-2 px-2 mt-4 mb-2">
      <div className={`p-1.5 rounded-lg ${colorClass}`}>
        <Icon size={16} strokeWidth={2.5} />
      </div>
      <h2 className="text-sm font-black text-gray-800">{title}</h2>
    </div>
  );

  const AdminLink = ({ id, href, children, danger }) => {
    const isPermitted = hasPermission(id);
    
    if (!isPermitted) {
      return (
        <div className="bg-gray-100/50 border border-gray-100 rounded-3xl p-5 flex flex-col items-center justify-center gap-3 opacity-60 grayscale cursor-not-allowed relative">
          <div className="absolute top-2 right-2 text-gray-400"><Lock size={14} /></div>
          {children}
        </div>
      );
    }

    return (
      <Link href={href} className={`bg-white border ${danger ? 'border-red-100 hover:border-red-200 hover:bg-red-50' : 'border-gray-100 hover:border-indigo-200'} rounded-3xl p-5 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all active:scale-95`}>
        {children}
      </Link>
    );
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-20">
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
            <AdminLink id="settings" href="/admin/settings">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center">
                <Settings strokeWidth={2} size={24} />
              </div>
              <span className="font-extrabold text-xs text-center text-gray-700">تنظیمات مدیریت</span>
            </AdminLink>
            
            <AdminLink id="warehouses" href="/admin/warehouses">
              <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
                <Map strokeWidth={2} size={24} />
              </div>
              <span className="font-extrabold text-xs text-center text-gray-700">مدیریت انبارها</span>
            </AdminLink>

            <AdminLink id="locations" href="/admin/locations">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                <Layers strokeWidth={2} size={24} />
              </div>
              <span className="font-extrabold text-xs text-center text-gray-700">مدیریت قفسه‌ها</span>
            </AdminLink>
            
            <AdminLink id="products" href="/admin/products">
              <div className="w-12 h-12 bg-teal-50 text-teal-500 rounded-2xl flex items-center justify-center">
                <Box strokeWidth={2} size={24} />
              </div>
              <span className="font-extrabold text-xs text-center text-gray-700">لیست کالاها</span>
            </AdminLink>
          </div>
        </motion.div>

        {/* Category 2: Reports */}
        <motion.div variants={item} className="flex flex-col gap-3">
          <SectionTitle title="گزارشات" icon={BarChart3} colorClass="bg-blue-100 text-blue-600" />
          <div className="grid grid-cols-2 gap-3">
            <AdminLink id="discrepancies" href="/admin/discrepancies">
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                <AlertTriangle strokeWidth={2} size={24} />
              </div>
              <span className="font-extrabold text-xs text-center text-gray-700">داشبورد مغایرت‌ها</span>
            </AdminLink>
            
            <AdminLink id="stats" href="/admin/stats">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                <LayoutGrid strokeWidth={2} size={24} />
              </div>
              <span className="font-extrabold text-xs text-center text-gray-700">آمار طبقات</span>
            </AdminLink>
            
            <AdminLink id="unknowns" href="/admin/unknowns">
              <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                <AlertCircle strokeWidth={2} size={24} />
              </div>
              <span className="font-extrabold text-xs text-center text-gray-700">کالاهای ناشناس</span>
            </AdminLink>
          </div>
        </motion.div>

        {/* Category 3: Management */}
        <motion.div variants={item} className="flex flex-col gap-3">
          <SectionTitle title="مدیریت" icon={UserCog} colorClass="bg-emerald-100 text-emerald-600" />
          <div className="grid grid-cols-2 gap-3">
            <AdminLink id="users" href="/admin/users">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center">
                <Users strokeWidth={2} size={24} />
              </div>
              <span className="font-extrabold text-xs text-center text-gray-700">کاربران</span>
            </AdminLink>

            <AdminLink id="periods" href="/admin/periods">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                <Calendar strokeWidth={2} size={24} />
              </div>
              <span className="font-extrabold text-xs text-center text-gray-700">دوره‌های انبارگردانی</span>
            </AdminLink>

            <AdminLink id="tasks" href="/admin/tasks">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                <Activity strokeWidth={2} size={24} />
              </div>
              <span className="font-extrabold text-xs text-center text-gray-700">مدیریت تسک‌ها</span>
            </AdminLink>

            <AdminLink id="permissions" href="/admin/permissions">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                <Shield strokeWidth={2} size={24} />
              </div>
              <span className="font-extrabold text-xs text-center text-gray-700">سطح دسترسی</span>
            </AdminLink>

            <AdminLink id="logs" href="/admin/logs">
              <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-2xl flex items-center justify-center">
                <Activity strokeWidth={2} size={24} />
              </div>
              <span className="font-extrabold text-xs text-center text-gray-700">لاگ عملیات</span>
            </AdminLink>
            
            <AdminLink id="danger-zone" href="/admin/danger-zone" danger={true}>
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center">
                <AlertCircle strokeWidth={2.5} size={24} />
              </div>
              <span className="font-extrabold text-xs text-center text-red-600">منطقه خطر</span>
            </AdminLink>

            <Link href="/admin/about" className="bg-white border border-gray-100 hover:border-indigo-200 rounded-3xl p-5 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all active:scale-95">
              <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-2xl flex items-center justify-center">
                <Info strokeWidth={2} size={24} />
              </div>
              <span className="font-extrabold text-xs text-center text-gray-700">درباره توسعه‌دهنده</span>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
