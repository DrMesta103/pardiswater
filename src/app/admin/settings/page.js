'use client';
import { useState, useEffect } from 'react';
import { Save, EyeOff, ShieldCheck, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    blind_counting: false,
    correction_roles: ['ADMIN', 'SUPERVISOR']
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const availableRoles = [
    { id: 'ADMIN', label: 'مدیر کل' },
    { id: 'SUPERVISOR', label: 'سرپرست انبار' },
    { id: 'ACCOUNTANT', label: 'حسابدار' },
    { id: 'COUNTER', label: 'انبارگردان' }
  ];

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
    setSaved(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error(error);
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

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">تنظیمات سیستم</h1>
        <p className="text-sm text-gray-500 font-medium mt-1">مدیریت قوانین انبارگردانی و دسترسی‌ها</p>
      </div>

      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 space-y-8">
        
        {/* Blind Counting Setting */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-50 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <EyeOff size={18} />
              </div>
              <h2 className="text-base font-bold text-gray-800">شمارش کور (Blind Counting)</h2>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
              در صورت فعال بودن، انبارگردان‌ها موجودی فعلی سیستم را نمی‌بینند و مجبورند به جای تایید کورکورانه، کالاها را به صورت واقعی بشمارند.
            </p>
          </div>
          <button 
            onClick={() => setSettings(s => ({ ...s, blind_counting: !s.blind_counting }))}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${settings.blind_counting ? 'bg-indigo-600' : 'bg-gray-200'}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${settings.blind_counting ? '-translate-x-1.5' : '-translate-x-8'}`} />
          </button>
        </div>

        {/* Correction Roles Setting */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <h2 className="text-base font-bold text-gray-800">دسترسی ثبت اصلاحیه</h2>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            وقتی انبارگردانی یک قفسه بسته می‌شود، چه نقش‌هایی اجازه دارند درخواست اصلاحیه ثبت کنند؟ (حالت چندانتخابی)
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {availableRoles.map(role => {
              const isSelected = settings.correction_roles?.includes(role.id);
              return (
                <button
                  key={role.id}
                  onClick={() => toggleRole(role.id)}
                  className={`flex items-center justify-between p-4 rounded-[16px] border text-xs font-bold transition-all ${
                    isSelected 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {role.label}
                  {isSelected && <Check size={14} />}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      <div className="flex justify-end">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-[20px] text-sm font-bold shadow-md hover:bg-gray-800 transition-colors disabled:opacity-70"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : saved ? (
            <>
              <Check size={18} />
              ذخیره شد
            </>
          ) : (
            <>
              <Save size={18} />
              ذخیره تغییرات
            </>
          )}
        </motion.button>
      </div>

    </div>
  );
}
