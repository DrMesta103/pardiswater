'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Edit2, Check, Shield, User as UserIcon, X } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const availableRoles = [
    { id: 'ADMIN', label: 'مدیر کل' },
    { id: 'SUPERVISOR', label: 'سرپرست انبار' },
    { id: 'ACCOUNTANT', label: 'حسابدار' },
    { id: 'COUNTER', label: 'انبارگردان' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoles = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles: editingUser.roles })
      });
      if (res.ok) {
        fetchUsers();
        setEditingUser(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const toggleRole = (roleId) => {
    setEditingUser(prev => {
      const roles = prev.roles || [];
      if (roles.includes(roleId)) {
        return { ...prev, roles: roles.filter(r => r !== roleId) };
      } else {
        return { ...prev, roles: [...roles, roleId] };
      }
    });
  };

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
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24 relative overflow-x-hidden">
      <Header title="مدیریت کاربران" showBack={true} />

      <div className="flex-1 p-5 flex flex-col gap-6 max-w-2xl mx-auto w-full mt-2">
        <div className="flex flex-col">
          <h2 className="text-xl font-black text-gray-800 tracking-tight">لیست کاربران سیستم</h2>
          <p className="text-xs text-gray-400 font-medium mt-1">مدیریت دسترسی‌ها و بررسی فعالیت کارکنان</p>
        </div>

        <div className="flex flex-col gap-3">
          {users.map(user => {
            const userRoles = user.roles || [];
            return (
              <motion.div 
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-[14px] flex items-center justify-center shrink-0">
                      <UserIcon size={18} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-800 text-sm">{user.name || user.username}</span>
                      <span className="text-[10px] text-gray-400 font-medium mt-0.5" dir="ltr">{user.username}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setEditingUser(user)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    <Edit2 size={14} strokeWidth={2.5} />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <div className="flex gap-1 flex-wrap">
                    {userRoles.map(r => {
                      const label = availableRoles.find(ar => ar.id === r)?.label || r;
                      return <span key={r} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold">{label}</span>;
                    })}
                    {userRoles.length === 0 && <span className="text-[10px] text-gray-400">بدون نقش</span>}
                  </div>
                  <div className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                    {user._count?.countings || 0} شمارش
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setEditingUser(null)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-sm bg-white rounded-[24px] shadow-2xl relative z-10 flex flex-col overflow-hidden"
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-indigo-600" />
                  <span className="font-bold text-gray-800 text-sm">ویرایش دسترسی‌ها</span>
                </div>
                <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-5 flex flex-col gap-4">
                <div className="text-sm font-bold text-gray-700 text-center mb-2">
                  {editingUser.name || editingUser.username}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {availableRoles.map(role => {
                    const isSelected = editingUser.roles?.includes(role.id);
                    return (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        key={role.id}
                        onClick={() => toggleRole(role.id)}
                        className={`flex items-center justify-between p-3 rounded-[16px] border text-xs font-bold transition-all ${
                          isSelected 
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                          : 'border-gray-200 bg-white text-gray-600'
                        }`}
                      >
                        {role.label}
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-transparent'}`}>
                          <Check size={10} strokeWidth={3} />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveRoles}
                  disabled={saving}
                  className="w-full mt-2 flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-3.5 rounded-[16px] text-sm font-bold shadow-md disabled:opacity-70 transition-colors hover:bg-gray-800"
                >
                  {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'ذخیره دسترسی‌ها'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
