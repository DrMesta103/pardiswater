'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Save, EyeOff, ShieldCheck, Check, AlertCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    blind_counting: false,
    correction_roles: ['ADMIN', 'SUPERVISOR'],
    uncounted_shelf_days: 10
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', isError: false });

  const availableRoles = [
    { id: 'ADMIN', label: 'مدیر کل' },
    { id: 'SUPERVISOR', label: 'سرپرست انبار' },
    { id: 'ACCOUNTANT', label: 'حسابدار' },
    { id: 'COUNTER', label: 'انبارگردان' }
  ];

  const showToast = (message, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        showToast('تنظیمات با موفقیت ذخیره شد');
      } else {
        showToast('خطا در ذخیره تنظیمات', true);
      }
    } catch (error) {
      console.error(error);
      showToast('خطای شبکه', true);
    } finally {
      setSaving(false);
    }
  };

  const toggleRole = (roleId) => {
    setSettings(prev => {
      const roles = prev.correction_roles || [];
      if (roles.includes(roleId)) {
        return { ...prev, correction_roles: roles.filter(r => r !== roleId) };
      } else {
        return { ...prev, correction_roles: [...roles, roleId] };
      }
    });
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex flex-col">
        <Header title="تنظیمات سیستم" showBack={true} />
        <div className="flex-1 flex justify-center items-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24 relative overflow-x-hidden">
      <Header title="تنظیمات سیستم" showBack={true} />

      <div className="flex-1 p-5 flex flex-col gap-6 max-w-lg mx-auto w-full mt-2">
        <div className="flex flex-col">
          <h2 className="text-xl font-black text-gray-800 tracking-tight">تنظیمات اصلی</h2>
          <p className="text-xs text-gray-400 font-medium mt-1">مدیریت قوانین انبارگردانی و دسترسی‌ها</p>
        </div>

        <div className="w-full bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col gap-8">
          
          {/* Blind Counting Setting */}
          <div className="flex items-start justify-between gap-4 border-b border-gray-50 pb-8">
            <div className="flex-1 pr-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-[12px] bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <EyeOff size={16} strokeWidth={2.5} />
                </div>
                <h2 className="text-sm font-bold text-gray-800">شمارش کور (Blind Counting)</h2>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                در صورت فعال بودن، انبارگردان‌ها موجودی فعلی سیستم را نمی‌بینند و مجبورند به جای تایید کورکورانه، کالاها را به صورت واقعی بشمارند.
              </p>
            </div>
            
            {/* Elegant Switch Button */}
            <button 
              onClick={() => setSettings(s => ({ ...s, blind_counting: !s.blind_counting }))}
              className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${settings.blind_counting ? 'bg-indigo-600' : 'bg-gray-200'}`}
              role="switch"
              aria-checked={settings.blind_counting}
            >
              <span 
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-300 ${settings.blind_counting ? '-translate-x-6' : 'translate-x-0'}`} 
              />
            </button>
          </div>

          {/* Correction Roles Setting */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-[12px] bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <ShieldCheck size={16} strokeWidth={2.5} />
              </div>
              <h2 className="text-sm font-bold text-gray-800">دسترسی ثبت اصلاحیه</h2>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-5">
              وقتی انبارگردانی یک قفسه بسته می‌شود، چه نقش‌هایی اجازه دارند درخواست اصلاحیه ثبت کنند؟
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              {availableRoles.map(role => {
                const isSelected = settings.correction_roles?.includes(role.id);
                return (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    key={role.id}
                    onClick={() => toggleRole(role.id)}
                    className={`flex items-center justify-between p-3.5 rounded-[16px] border text-xs font-bold transition-all ${
                      isSelected 
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm' 
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {role.label}
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-transparent'}`}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Uncounted Shelves Warning Days */}
          <div className="border-t border-gray-50 pt-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-[12px] bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <AlertCircle size={16} strokeWidth={2.5} />
              </div>
              <h2 className="text-sm font-bold text-gray-800">هشدار قفسه‌های شمارش‌نشده</h2>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              قفسه‌هایی که بیشتر از این تعداد روز از آخرین انبارگردانی‌شان گذشته باشد، در صفحه اصلی برای شمارش مجدد پیشنهاد می‌شوند.
            </p>
            
            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-[16px] border border-gray-100">
              <input 
                type="number" 
                min="1"
                max="365"
                value={settings.uncounted_shelf_days || 10}
                onChange={e => setSettings(s => ({ ...s, uncounted_shelf_days: Number(e.target.value) }))}
                className="w-20 bg-white border border-gray-200 rounded-[12px] px-3 py-2 text-center font-black text-gray-800 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <span className="text-sm font-bold text-gray-600">روز</span>
            </div>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-4 flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-4 rounded-[16px] text-sm font-extrabold shadow-md hover:bg-gray-800 transition-colors disabled:opacity-70"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <Save size={18} strokeWidth={2.5} />
              ذخیره تغییرات
            </>
          )}
        </motion.button>
      </div>

      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl shadow-xl backdrop-blur-3xl border text-xs font-bold whitespace-nowrap flex items-center justify-center gap-2 ${toast.isError ? 'bg-red-50/90 border-red-100 text-red-600' : 'bg-white/90 border-gray-100 text-gray-800'}`}
          >
            {toast.isError ? <XCircle size={14} /> : <Check size={14} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
