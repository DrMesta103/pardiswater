'use client';
import { useState, useEffect, use } from 'react';
import Header from '@/components/Header';
import { User as UserIcon, Calendar, Package, Layers, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UserProfilePage({ params }) {
  const unwrappedParams = use(params);
  const [user, setUser] = useState(null);
  const [countings, setCountings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, [unwrappedParams.id]);

  const fetchUserData = async () => {
    try {
      const [usersRes, countingsRes] = await Promise.all([
        fetch('/api/users'),
        fetch(`/api/counting?user_id=${unwrappedParams.id}`)
      ]);
      
      if (usersRes.ok) {
        const users = await usersRes.json();
        const found = users.find(u => u.id === parseInt(unwrappedParams.id));
        setUser(found);
      }
      
      if (countingsRes.ok) {
        const data = await countingsRes.json();
        setCountings(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex flex-col">
        <Header title="کارنامه کاربر" showBack={true} />
        <div className="flex-1 flex justify-center items-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex flex-col">
        <Header title="کارنامه کاربر" showBack={true} />
        <div className="flex-1 p-6 flex items-center justify-center text-gray-500 font-bold">
          کاربر یافت نشد
        </div>
      </div>
    );
  }

  // Split countings
  const shelfCountings = countings.filter(c => c.mode === 'SHELF').slice(0, 10);
  const itemCountings = countings.filter(c => c.mode === 'ITEM').slice(0, 10);

  // Calc accuracy
  const validCounts = countings.filter(c => c.status !== 'CANCELLED');
  const discrepancies = validCounts.filter(c => c.old_count !== c.new_count).length;
  const accuracy = validCounts.length > 0 ? (((validCounts.length - discrepancies) / validCounts.length) * 100).toFixed(1) : 0;

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24 relative">
      <Header title="کارنامه عملکرد" showBack={true} />

      <div className="flex-1 p-4 md:p-6 flex flex-col gap-6 max-w-2xl mx-auto w-full mt-2">
        
        {/* Profile Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-10"></div>
          
          <div className="w-20 h-20 bg-white border-4 border-gray-50 text-indigo-600 rounded-full flex items-center justify-center font-black text-3xl shadow-sm z-10 mb-4 overflow-hidden">
            {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" alt="" /> : (user.name ? user.name.charAt(0) : '?')}
          </div>
          
          <h2 className="text-xl font-black text-gray-800 z-10">{user.name || 'کاربر بدون نام'}</h2>
          <p className="text-sm text-gray-500 font-bold dir-ltr mt-1 z-10">{user.mobile || user.username}</p>
          
          <div className="flex gap-2 mt-4 z-10">
            {user.roles?.map(role => (
              <span key={role} className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black">
                {role}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-[20px] p-5 shadow-sm border border-gray-100 flex flex-col gap-2 items-center justify-center text-center">
            <Package size={24} className="text-indigo-500 mb-1" strokeWidth={2} />
            <span className="text-[10px] font-bold text-gray-400">مجموع شمارش</span>
            <span className="text-xl font-black text-gray-800">{countings.length}</span>
          </div>
          <div className="bg-white rounded-[20px] p-5 shadow-sm border border-gray-100 flex flex-col gap-2 items-center justify-center text-center">
            <CheckCircle2 size={24} className="text-green-500 mb-1" strokeWidth={2} />
            <span className="text-[10px] font-bold text-gray-400">دقت عملکرد</span>
            <span className="text-xl font-black text-green-600">{accuracy}%</span>
          </div>
          <div className="bg-white rounded-[20px] p-5 shadow-sm border border-gray-100 flex flex-col gap-2 items-center justify-center text-center">
            <AlertTriangle size={24} className="text-red-500 mb-1" strokeWidth={2} />
            <span className="text-[10px] font-bold text-gray-400">مغایرت‌ها</span>
            <span className="text-xl font-black text-red-600">{discrepancies}</span>
          </div>
          <div className="bg-white rounded-[20px] p-5 shadow-sm border border-gray-100 flex flex-col gap-2 items-center justify-center text-center">
            <Calendar size={24} className="text-blue-500 mb-1" strokeWidth={2} />
            <span className="text-[10px] font-bold text-gray-400">تاریخ عضویت</span>
            <span className="text-[10px] font-black text-gray-800 mt-1" dir="ltr">
              {new Date(user.createdAt).toLocaleDateString('fa-IR')}
            </span>
          </div>
        </div>

        {/* Recent Countings by SHELF */}
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Layers size={18} className="text-purple-500" />
              آخرین انبارگردانی قفسه‌ای
            </h3>
            <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-100">
              {shelfCountings.length} رکورد آخر
            </span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {shelfCountings.map(c => (
              <div key={c.id} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800">{c.product_name}</span>
                  <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-white text-gray-600 px-2 py-1 rounded-md border border-gray-200">
                      قفسه: {c.shelfCode}
                    </span>
                    {c.status === 'CANCELLED' && <span className="text-[10px] font-bold text-red-500">لغو شده</span>}
                  </div>
                  <div className="flex items-center gap-1 font-black text-sm">
                    <span className="text-gray-400 line-through text-[10px] ml-1">{c.old_count}</span>
                    <ArrowLeft size={12} className="text-gray-300" />
                    <span className={c.old_count === c.new_count ? 'text-green-600' : 'text-red-500'}>{c.new_count}</span>
                  </div>
                </div>
              </div>
            ))}
            {shelfCountings.length === 0 && (
              <div className="text-center text-xs text-gray-400 font-bold py-4">موردی یافت نشد</div>
            )}
          </div>
        </div>

        {/* Recent Countings by ITEM */}
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Package size={18} className="text-teal-500" />
              آخرین انبارگردانی کالایی
            </h3>
            <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-100">
              {itemCountings.length} رکورد آخر
            </span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {itemCountings.map(c => (
              <div key={c.id} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800">{c.product_name}</span>
                  <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-white text-gray-600 px-2 py-1 rounded-md border border-gray-200">
                      کد حسابفا: {c.product_id}
                    </span>
                    {c.status === 'CANCELLED' && <span className="text-[10px] font-bold text-red-500">لغو شده</span>}
                  </div>
                  <div className="flex items-center gap-1 font-black text-sm">
                    <span className="text-gray-400 line-through text-[10px] ml-1">{c.old_count}</span>
                    <ArrowLeft size={12} className="text-gray-300" />
                    <span className={c.old_count === c.new_count ? 'text-green-600' : 'text-red-500'}>{c.new_count}</span>
                  </div>
                </div>
              </div>
            ))}
            {itemCountings.length === 0 && (
              <div className="text-center text-xs text-gray-400 font-bold py-4">موردی یافت نشد</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
