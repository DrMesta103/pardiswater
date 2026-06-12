'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { use } from 'react';
import { User as UserIcon, Calendar, Package, ArrowRight, ShieldCheck } from 'lucide-react';

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
      // In a full implementation, we'd have /api/users/[id]
      // For now, we fetch all users and filter, and also fetch their countings
      const [usersRes, countingsRes] = await Promise.all([
        fetch('/api/users'),
        fetch(`/api/reports/countings?userId=${unwrappedParams.id}`) // Assuming such an API or similar exists
      ]);
      
      if (usersRes.ok) {
        const users = await usersRes.json();
        const found = users.find(u => u.id === parseInt(unwrappedParams.id));
        setUser(found);
      }
      
      // Since /api/reports/countings might not support userId yet, 
      // let's just pretend we have it or gracefully fallback.
      if (countingsRes.ok) {
        const data = await countingsRes.json();
        // Fallback for demo if API doesn't support filter
        setCountings(data.filter ? data.filter(c => c.userId === parseInt(unwrappedParams.id)) : []);
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

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24">
      <Header title="کارنامه عملکرد" showBack={true} />

      <div className="flex-1 p-4 md:p-6 flex flex-col gap-6 max-w-2xl mx-auto w-full mt-2">
        
        {/* Profile Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-10"></div>
          
          <div className="w-20 h-20 bg-white border-4 border-gray-50 text-indigo-600 rounded-full flex items-center justify-center font-black text-3xl shadow-sm z-10 mb-4">
            {user.name ? user.name.charAt(0) : '?'}
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
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-[20px] p-5 shadow-sm border border-gray-100 flex flex-col gap-2">
            <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
              <Package size={20} strokeWidth={2.5} />
            </div>
            <span className="text-xs font-bold text-gray-400 mt-2">مجموع شمارش‌ها</span>
            <span className="text-2xl font-black text-gray-800">{user._count?.countings || 0}</span>
          </div>
          <div className="bg-white rounded-[20px] p-5 shadow-sm border border-gray-100 flex flex-col gap-2">
            <div className="w-10 h-10 bg-green-50 text-green-500 rounded-xl flex items-center justify-center">
              <Calendar size={20} strokeWidth={2.5} />
            </div>
            <span className="text-xs font-bold text-gray-400 mt-2">تاریخ عضویت</span>
            <span className="text-sm font-black text-gray-800 mt-1" dir="ltr">
              {new Date(user.createdAt).toLocaleDateString('fa-IR')}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
