'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Users, Check, XCircle, Search, ShieldAlert, BarChart2, Plus, UserPlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(null); // id of user being saved
  const [toast, setToast] = useState({ show: false, message: '', isError: false });
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', username: '', mobile: '', password: '' });

  const availableRoles = [
    { id: 'ADMIN', label: 'مدیر' },
    { id: 'SUPERVISOR', label: 'سرپرست' },
    { id: 'ACCOUNTANT', label: 'حسابدار' },
    { id: 'COUNTER', label: 'انبارگردان' }
  ];

  const showToast = (message, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      showToast('خطا در دریافت لیست کاربران', true);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (userId, roleId, currentRoles) => {
    setSaving(userId);
    let newRoles = [...currentRoles];
    if (newRoles.includes(roleId)) {
      newRoles = newRoles.filter(r => r !== roleId);
    } else {
      newRoles.push(roleId);
    }

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, roles: newRoles })
      });
      
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, roles: newRoles } : u));
        showToast('نقش‌ها با موفقیت ذخیره شد');
      } else {
        showToast('خطا در بروزرسانی نقش', true);
      }
    } catch (e) {
      showToast('خطای شبکه', true);
    } finally {
      setSaving(null);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) {
      showToast('نام کاربری و رمز عبور الزامی است', true);
      return;
    }
    
    setIsAdding(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      
      const data = await res.json();
      if (res.ok) {
        setUsers([data, ...users]);
        showToast('کاربر جدید با موفقیت اضافه شد');
        setIsAddModalOpen(false);
        setNewUser({ name: '', username: '', mobile: '', password: '' });
      } else {
        showToast(data.error || 'خطا در ایجاد کاربر', true);
      }
    } catch (e) {
      showToast('خطای شبکه', true);
    } finally {
      setIsAdding(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.includes(search) || u.username?.includes(search) || u.mobile?.includes(search)
  );

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex flex-col">
        <Header title="مدیریت کاربران" showBack={true} />
        <div className="flex-1 flex justify-center items-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24 relative">
      <Header title="مدیریت کاربران" showBack={true} />

      <div className="flex-1 p-4 md:p-6 flex flex-col gap-6 max-w-2xl mx-auto w-full mt-2">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2">
              <Users className="text-indigo-600" size={24} strokeWidth={2.5} />
              لیست کاربران سیستم
            </h2>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              تعیین نقش‌های کاربران و مشاهده آمار انبارگردانی آن‌ها
            </p>
          </div>
          
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20 hover:bg-indigo-700 hover:scale-105 transition-all"
          >
            <UserPlus size={20} strokeWidth={2.5} />
          </button>
        </div>

        <Link 
          href="/admin/reports"
          className="bg-indigo-600 text-white p-4 rounded-[20px] shadow-md hover:bg-indigo-700 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <BarChart2 size={20} />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm">گزارشات و رتبه‌بندی پرسنل</span>
              <span className="text-[10px] text-indigo-200 mt-0.5">کارمندان برتر، بیشترین خطا و...</span>
            </div>
          </div>
          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center group-hover:-translate-x-1 transition-transform">
            <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </div>
        </Link>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="جستجو بر اساس نام، نام کاربری یا موبایل..." 
            className="w-full bg-white border border-gray-200 rounded-[20px] pr-12 pl-4 py-4 text-sm font-bold focus:outline-none focus:border-indigo-500 shadow-sm transition-all"
          />
        </div>

        {/* Users List */}
        <div className="flex flex-col gap-4">
          {filteredUsers.map(user => (
            <div key={user.id} className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-lg">
                    {user.name ? user.name.charAt(0) : '?'}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800">{user.name || 'کاربر بدون نام'}</span>
                    <span className="text-xs text-gray-400 font-medium dir-ltr text-right">{user.mobile || user.username}</span>
                  </div>
                </div>
                
                <Link 
                  href={`/admin/users/${user.id}`}
                  className="bg-gray-50 text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-[12px] text-xs font-bold transition-colors flex items-center gap-1 border border-gray-200"
                >
                  <BarChart2 size={14} />
                  کارنامه
                </Link>
              </div>

              <div className="border-t border-gray-50 pt-4">
                <p className="text-[10px] font-black text-gray-400 mb-2 flex items-center gap-1">
                  <ShieldAlert size={12} /> تعیین نقش‌های مجاز:
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableRoles.map(role => {
                    const isSelected = user.roles?.includes(role.id);
                    const isSaving = saving === user.id;
                    
                    return (
                      <button
                        key={role.id}
                        onClick={() => handleToggleRole(user.id, role.id, user.roles || [])}
                        disabled={isSaving}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          isSelected 
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {role.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-[12px] p-3 flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500 font-medium">تعداد اقلام شمارش شده:</span>
                <span className="text-sm font-black text-gray-800">{user._count?.countings || 0} مورد</span>
              </div>
            </div>
          ))}
          
          {filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-[32px] border border-dashed border-gray-200 shadow-sm mt-4">
              <div className="w-20 h-20 bg-indigo-50 rounded-[24px] flex items-center justify-center mb-4 rotate-3 transition-transform hover:rotate-0">
                <Users className="text-indigo-400" size={36} strokeWidth={2} />
              </div>
              <h3 className="text-base font-black text-gray-800 mb-1">هیچ کاربری یافت نشد!</h3>
              <p className="text-sm font-medium text-gray-400 text-center">با این مشخصات هیچ کاربری در سیستم ثبت نشده است.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl shadow-xl backdrop-blur-3xl border text-xs font-bold whitespace-nowrap flex items-center justify-center gap-2 ${toast.isError ? 'bg-red-50/90 border-red-100 text-red-600' : 'bg-gray-900/90 border-gray-700 text-white'}`}
          >
            {toast.isError ? <XCircle size={14} /> : <Check size={14} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsAddModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl flex flex-col gap-4"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-black text-gray-800 text-lg flex items-center gap-2">
                  <UserPlus size={20} className="text-indigo-600" />
                  افزودن کاربر جدید
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} className="bg-gray-100 text-gray-500 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200">
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 px-1">نام و نام خانوادگی</label>
                <input 
                  type="text" 
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="محمد محمدی"
                  className="w-full bg-gray-50 border border-gray-200 rounded-[14px] px-4 py-3 text-sm font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 px-1">شماره موبایل</label>
                <input 
                  type="tel" 
                  dir="ltr"
                  value={newUser.mobile}
                  onChange={(e) => setNewUser({...newUser, mobile: e.target.value})}
                  placeholder="0912..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-[14px] px-4 py-3 text-sm font-bold text-left focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 px-1">نام کاربری <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  dir="ltr"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  placeholder="user123"
                  className="w-full bg-gray-50 border border-gray-200 rounded-[14px] px-4 py-3 text-sm font-bold text-left focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 px-1">رمز عبور <span className="text-red-500">*</span></label>
                <input 
                  type="password" 
                  dir="ltr"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="******"
                  className="w-full bg-gray-50 border border-gray-200 rounded-[14px] px-4 py-3 text-sm font-bold text-left focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button 
                onClick={handleAddUser}
                disabled={isAdding || !newUser.username || !newUser.password}
                className="w-full mt-2 bg-indigo-600 text-white py-3.5 rounded-[16px] text-sm font-black hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20"
              >
                {isAdding ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'ایجاد کاربر'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
