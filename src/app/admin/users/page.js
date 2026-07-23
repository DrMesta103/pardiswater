'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { 
  Users, Check, XCircle, Search, ShieldAlert, BarChart2, UserPlus, X, 
  Edit3, Trash2, Key, Power, UserCheck, UserX, AlertTriangle, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(null); // id of user being updated
  const [toast, setToast] = useState({ show: false, message: '', isError: false });
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Active selected user for modals
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', username: '', mobile: '', password: '' });
  const [editFormData, setEditFormData] = useState({ name: '', username: '', mobile: '' });
  const [passwordFormData, setPasswordFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [showPasswordText, setShowPasswordText] = useState(false);

  const availableRoles = [
    { id: 'ADMIN', label: 'مدیر' },
    { id: 'SUPERVISOR', label: 'سرپرست' },
    { id: 'ACCOUNTANT', label: 'حسابدار' },
    { id: 'COUNTER', label: 'انبارگردان' }
  ];

  const showToast = (message, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast({ show: false, message: '', isError: false }), 4000);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        showToast('خطا در دریافت لیست کاربران', true);
      }
    } catch (e) {
      showToast('خطای شبکه در دریافت کاربران', true);
    } finally {
      setLoading(false);
    }
  };

  // Toggle User Active Status (فعال / غیرفعال کردن)
  const handleToggleActive = async (user) => {
    const targetStatus = !user.isActive;
    setSaving(user.id);
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, isActive: targetStatus })
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(users.map(u => u.id === user.id ? { ...u, isActive: targetStatus } : u));
        showToast(targetStatus ? `کاربر ${user.name || user.username} فعال شد` : `کاربر ${user.name || user.username} غیرفعال شد`);
      } else {
        showToast(data.error || 'خطا در تغییر وضعیت کاربر', true);
      }
    } catch (e) {
      showToast('خطای شبکه', true);
    } finally {
      setSaving(null);
    }
  };

  // Toggle User Roles
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

  // Add New User
  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) {
      showToast('نام کاربری و رمز عبور الزامی است', true);
      return;
    }
    
    setIsSubmitting(true);
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
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name || '',
      username: user.username || '',
      mobile: user.mobile || ''
    });
    setIsEditModalOpen(true);
  };

  // Save Edit User
  const handleSaveEdit = async () => {
    if (!editFormData.username) {
      showToast('نام کاربری الزامی است', true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          name: editFormData.name,
          username: editFormData.username,
          mobile: editFormData.mobile
        })
      });

      const data = await res.json();
      if (res.ok) {
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...data.user } : u));
        showToast('اطلاعات کاربر با موفقیت ویرایش شد');
        setIsEditModalOpen(false);
      } else {
        showToast(data.error || 'خطا در ویرایش کاربر', true);
      }
    } catch (e) {
      showToast('خطای شبکه', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Password Modal
  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setPasswordFormData({ newPassword: '', confirmPassword: '' });
    setIsPasswordModalOpen(true);
  };

  // Save Password Change
  const handleChangePassword = async () => {
    if (!passwordFormData.newPassword) {
      showToast('رمز عبور جدید را وارد کنید', true);
      return;
    }

    if (passwordFormData.newPassword.length < 4) {
      showToast('رمز عبور باید حداقل ۴ کاراکتر باشد', true);
      return;
    }

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      showToast('رمز عبور و تکرار آن یکسان نیستند', true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          password: passwordFormData.newPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast('رمز عبور کاربر با موفقیت تغییر کرد');
        setIsPasswordModalOpen(false);
      } else {
        showToast(data.error || 'خطا در تغییر رمز عبور', true);
      }
    } catch (e) {
      showToast('خطای شبکه', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Modal
  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete User
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/users?id=${selectedUser.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (res.ok) {
        setUsers(users.filter(u => u.id !== selectedUser.id));
        showToast('کاربر با موفقیت حذف شد');
        setIsDeleteModalOpen(false);
      } else {
        showToast(data.error || 'امکان حذف کاربر وجود ندارد', true);
      }
    } catch (e) {
      showToast('خطای شبکه در حذف کاربر', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.includes(search) || u.username?.includes(search) || u.mobile?.includes(search)
  );

  const getTotalRecords = (user) => {
    if (!user._count) return 0;
    return (user._count.countings || 0) + 
           (user._count.createdTasks || 0) + 
           (user._count.assignedTasks || 0) + 
           (user._count.actionLogs || 0);
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex flex-col">
        <Header title="مدیریت کاربران" showBack={true} />
        <div className="flex-1 flex flex-col justify-center items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-gray-500">در حال بارگذاری لیست کاربران...</span>
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
              مدیریت و لیست کاربران
            </h2>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              ویرایش، غیرفعال‌سازی، تغییر رمز و مدیریت دسترسی‌های کاربران سیستم
            </p>
          </div>
          
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all"
            title="افزودن کاربر جدید"
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
          {filteredUsers.map(user => {
            const totalRecords = getTotalRecords(user);
            const isUserActive = user.isActive !== false;
            
            return (
              <div 
                key={user.id} 
                className={`bg-white border rounded-[24px] p-5 shadow-sm flex flex-col gap-4 transition-all ${
                  !isUserActive ? 'border-amber-200 bg-amber-50/20 opacity-80' : 'border-gray-100'
                }`}
              >
                {/* User Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                      isUserActive ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {user.name ? user.name.charAt(0) : '?'}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-gray-800 text-base">{user.name || 'کاربر بدون نام'}</span>
                        {isUserActive ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            فعال
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            غیرفعال
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-medium dir-ltr text-right mt-0.5">
                        <span>@{user.username}</span>
                        {user.mobile && <span>• {user.mobile}</span>}
                      </div>
                    </div>
                  </div>
                  
                  <Link 
                    href={`/admin/users/${user.id}`}
                    className="bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 px-3 py-2 rounded-[12px] text-xs font-bold transition-colors flex items-center gap-1.5 border border-gray-200"
                    title="مشاهده کارنامه عملکرد"
                  >
                    <BarChart2 size={14} />
                    کارنامه
                  </Link>
                </div>

                {/* Quick Management Toolbar */}
                <div className="flex flex-wrap items-center gap-2 bg-gray-50/80 p-2 rounded-[16px] border border-gray-100">
                  {/* Edit User Button */}
                  <button
                    onClick={() => openEditModal(user)}
                    className="flex-1 py-2 px-3 bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    title="ویرایش مشخصات"
                  >
                    <Edit3 size={14} className="text-indigo-500" />
                    ویرایش
                  </button>

                  {/* Change Password Button */}
                  <button
                    onClick={() => openPasswordModal(user)}
                    className="flex-1 py-2 px-3 bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    title="تغییر رمز عبور"
                  >
                    <Key size={14} className="text-amber-500" />
                    تغییر رمز
                  </button>

                  {/* Active Toggle Button */}
                  <button
                    onClick={() => handleToggleActive(user)}
                    disabled={saving === user.id}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border shadow-xs ${
                      isUserActive
                        ? 'bg-white text-amber-700 hover:bg-amber-50 border-amber-200'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600'
                    } ${saving === user.id ? 'opacity-50 cursor-wait' : ''}`}
                    title={isUserActive ? 'غیرفعال کردن کاربر' : 'فعال کردن کاربر'}
                  >
                    {isUserActive ? (
                      <>
                        <UserX size={14} className="text-amber-600" />
                        غیرفعال‌سازی
                      </>
                    ) : (
                      <>
                        <UserCheck size={14} className="text-white" />
                        فعال‌سازی
                      </>
                    )}
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => openDeleteModal(user)}
                    className="py-2 px-3 bg-white text-red-600 hover:bg-red-50 border border-red-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    title="حذف کاربر"
                  >
                    <Trash2 size={14} />
                    حذف
                  </button>
                </div>

                {/* Roles Assignment */}
                <div className="border-t border-gray-50 pt-3">
                  <p className="text-[10px] font-black text-gray-400 mb-2 flex items-center gap-1">
                    <ShieldAlert size={12} /> تعیین نقش‌های مجاز:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableRoles.map(role => {
                      const isSelected = user.roles?.includes(role.id);
                      const isSavingThisUser = saving === user.id;
                      
                      return (
                        <button
                          key={role.id}
                          onClick={() => handleToggleRole(user.id, role.id, user.roles || [])}
                          disabled={isSavingThisUser}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            isSelected 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                          } ${isSavingThisUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {role.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Data Records Summary */}
                <div className="bg-gray-50 rounded-[14px] p-3 flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">مجموع داده‌ها و سوابق ثبت‌شده:</span>
                  <div className="flex items-center gap-2">
                    {totalRecords > 0 ? (
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-black text-xs border border-indigo-100">
                        {totalRecords} رکورد (دارای داده)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg font-bold text-xs">
                        بدون داده (قابل حذف)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
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

      {/* Toast Alert */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl shadow-xl backdrop-blur-3xl border text-xs font-bold whitespace-nowrap flex items-center justify-center gap-2 ${
              toast.isError ? 'bg-red-50/90 border-red-100 text-red-600' : 'bg-gray-900/90 border-gray-700 text-white'
            }`}
          >
            {toast.isError ? <XCircle size={14} /> : <Check size={14} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Add User Modal */}
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
                disabled={isSubmitting || !newUser.username || !newUser.password}
                className="w-full mt-2 bg-indigo-600 text-white py-3.5 rounded-[16px] text-sm font-black hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20"
              >
                {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'ایجاد کاربر'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Edit User Modal */}
      <AnimatePresence>
        {isEditModalOpen && selectedUser && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsEditModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl flex flex-col gap-4"
            >
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-black text-gray-800 text-lg flex items-center gap-2">
                  <Edit3 size={20} className="text-indigo-600" />
                  ویرایش اطلاعات کاربر
                </h3>
                <button onClick={() => setIsEditModalOpen(false)} className="bg-gray-100 text-gray-500 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200">
                  <X size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 px-1">نام و نام خانوادگی</label>
                <input 
                  type="text" 
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  placeholder="محمد محمدی"
                  className="w-full bg-gray-50 border border-gray-200 rounded-[14px] px-4 py-3 text-sm font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 px-1">نام کاربری <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  dir="ltr"
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-[14px] px-4 py-3 text-sm font-bold text-left focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 px-1">شماره موبایل</label>
                <input 
                  type="tel" 
                  dir="ltr"
                  value={editFormData.mobile}
                  onChange={(e) => setEditFormData({...editFormData, mobile: e.target.value})}
                  placeholder="0912..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-[14px] px-4 py-3 text-sm font-bold text-left focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button 
                onClick={handleSaveEdit}
                disabled={isSubmitting || !editFormData.username}
                className="w-full mt-2 bg-indigo-600 text-white py-3.5 rounded-[16px] text-sm font-black hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20"
              >
                {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'ذخیره تغییرات'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Change Password Modal */}
      <AnimatePresence>
        {isPasswordModalOpen && selectedUser && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsPasswordModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl flex flex-col gap-4"
            >
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-black text-gray-800 text-lg flex items-center gap-2">
                  <Key size={20} className="text-amber-500" />
                  تغییر رمز عبور کاربر
                </h3>
                <button onClick={() => setIsPasswordModalOpen(false)} className="bg-gray-100 text-gray-500 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200">
                  <X size={18} />
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-800 font-medium">
                تغییر رمز برای کاربر: <span className="font-extrabold">{selectedUser.name || selectedUser.username}</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 px-1">رمز عبور جدید</label>
                <div className="relative">
                  <input 
                    type={showPasswordText ? "text" : "password"} 
                    dir="ltr"
                    value={passwordFormData.newPassword}
                    onChange={(e) => setPasswordFormData({...passwordFormData, newPassword: e.target.value})}
                    placeholder="******"
                    className="w-full bg-gray-50 border border-gray-200 rounded-[14px] pl-10 pr-4 py-3 text-sm font-bold text-left focus:outline-none focus:border-amber-500"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswordText ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 px-1">تکرار رمز عبور جدید</label>
                <input 
                  type={showPasswordText ? "text" : "password"} 
                  dir="ltr"
                  value={passwordFormData.confirmPassword}
                  onChange={(e) => setPasswordFormData({...passwordFormData, confirmPassword: e.target.value})}
                  placeholder="******"
                  className="w-full bg-gray-50 border border-gray-200 rounded-[14px] px-4 py-3 text-sm font-bold text-left focus:outline-none focus:border-amber-500"
                />
              </div>

              <button 
                onClick={handleChangePassword}
                disabled={isSubmitting || !passwordFormData.newPassword || passwordFormData.newPassword !== passwordFormData.confirmPassword}
                className="w-full mt-2 bg-amber-500 text-white py-3.5 rounded-[16px] text-sm font-black hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-amber-500/20"
              >
                {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'ثبت رمز عبور جدید'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Delete User Modal (with Data check) */}
      <AnimatePresence>
        {isDeleteModalOpen && selectedUser && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl flex flex-col gap-4"
            >
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-black text-gray-800 text-lg flex items-center gap-2">
                  <Trash2 size={20} className="text-red-500" />
                  حذف کاربر
                </h3>
                <button onClick={() => setIsDeleteModalOpen(false)} className="bg-gray-100 text-gray-500 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200">
                  <X size={18} />
                </button>
              </div>

              {getTotalRecords(selectedUser) > 0 ? (
                /* User HAS Data -> Deletion Blocked */
                <div className="flex flex-col gap-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-[20px] p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-amber-800 font-extrabold text-sm">
                      <AlertTriangle size={18} className="shrink-0" />
                      امکان حذف این کاربر وجود ندارد!
                    </div>
                    <p className="text-xs text-amber-700 leading-relaxed font-medium">
                      کاربر <span className="font-extrabold">{selectedUser.name || selectedUser.username}</span> دارای <span className="font-black underline">{getTotalRecords(selectedUser)} رکورد</span> اطلاعات ثبت‌شده در سیستم است (انبارگردانی، تسک یا لوگ). برای حفظ یکپارچگی گزارشات سیستم، حذف کاربران دارای سابقه امکان‌پذیر نیست.
                    </p>
                  </div>

                  <p className="text-xs font-bold text-gray-600">
                    💡 پیشنهاد: می‌توانید دسترسی کاربر را غیرفعال کنید تا دیگر نتواند وارد سامانه شود.
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsDeleteModalOpen(false);
                        handleToggleActive(selectedUser);
                      }}
                      className="flex-1 bg-amber-500 text-white py-3 rounded-[16px] text-xs font-black hover:bg-amber-600 transition-colors shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5"
                    >
                      <UserX size={16} />
                      غیرفعال کردن کاربر
                    </button>
                    
                    <button
                      onClick={() => setIsDeleteModalOpen(false)}
                      className="bg-gray-100 text-gray-700 py-3 px-4 rounded-[16px] text-xs font-bold hover:bg-gray-200 transition-colors"
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              ) : (
                /* User Has NO Data -> Allowed to Delete */
                <div className="flex flex-col gap-4">
                  <p className="text-sm font-bold text-gray-700 leading-relaxed">
                    آیا از حذف کاربر <span className="font-black text-red-600">{selectedUser.name || selectedUser.username}</span> اطمینان دارید؟ این عملیات غیرقابل بازگشت است.
                  </p>

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={handleDeleteUser}
                      disabled={isSubmitting}
                      className="flex-1 bg-red-600 text-white py-3.5 rounded-[16px] text-sm font-black hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-red-600/20"
                    >
                      {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'بله، حذف شود'}
                    </button>
                    
                    <button
                      onClick={() => setIsDeleteModalOpen(false)}
                      className="bg-gray-100 text-gray-700 py-3.5 px-5 rounded-[16px] text-sm font-bold hover:bg-gray-200 transition-colors"
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
