'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Save, EyeOff, ShieldCheck, Check, AlertCircle, XCircle, Layers, Trash2, Plus, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    blind_counting: false,
    correction_roles: ['ADMIN', 'SUPERVISOR'],
    uncounted_shelf_days: 10,
    shelf_assignment_rotation_cycles: 2,
    location_levels: [
      { name: 'طبقه', format: 'UPPERCASE' },
      { name: 'اتاق', format: 'NUMBER' },
      { name: 'قفسه', format: 'UPPERCASE' },
      { name: 'ردیف', format: 'NUMBER' }
    ]
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
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
        
        // Normalize location_levels
        if (data.location_levels) {
          data.location_levels = data.location_levels.map(level => {
            if (typeof level === 'string') return { name: level, format: 'ANY' };
            return level;
          });
        }
        
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

  const handleLevelChange = (index, field, value) => {
    setSettings(prev => {
      const levels = [...(prev.location_levels || [])];
      levels[index] = { ...levels[index], [field]: value };
      return { ...prev, location_levels: levels };
    });
  };

  const addLevel = () => {
    setSettings(prev => ({
      ...prev,
      location_levels: [...(prev.location_levels || []), { name: 'سطح جدید', format: 'ANY' }]
    }));
  };

  const removeLevel = (index) => {
    setSettings(prev => {
      const levels = [...(prev.location_levels || [])];
      levels.splice(index, 1);
      return { ...prev, location_levels: levels };
    });
  };

  const handleResetData = async () => {
    setResetting(true);
    try {
      const res = await fetch('/api/admin/reset-data', { method: 'POST' });
      if (res.ok) {
        showToast('داده‌ها با موفقیت پاک شدند');
        setIsResetModalOpen(false);
      } else {
        showToast('خطا در پاک کردن داده‌ها', true);
      }
    } catch (e) {
      showToast('خطای شبکه', true);
    } finally {
      setResetting(false);
    }
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
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24 relative">
      <Header title="تنظیمات سیستم" showBack={true} />

      <div className="flex-1 p-5 flex flex-col gap-6 max-w-lg mx-auto w-full mt-2">
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

          {/* Enable Counting Modes */}
          <div className="border-t border-gray-50 pt-8 flex flex-col gap-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-[12px] bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Check size={16} strokeWidth={2.5} />
              </div>
              <h2 className="text-sm font-bold text-gray-800">حالت‌های انبارگردانی</h2>
            </div>
            
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-gray-500 leading-relaxed font-bold">انبارگردانی قفسه‌ای</p>
              <button 
                onClick={() => setSettings(s => ({ ...s, enable_shelf_counting: s.enable_shelf_counting === undefined ? true : !s.enable_shelf_counting }))}
                className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 focus:outline-none ${(settings.enable_shelf_counting ?? true) ? 'bg-blue-600' : 'bg-gray-200'}`}
              >
                <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-300 ${(settings.enable_shelf_counting ?? true) ? '-translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-gray-500 leading-relaxed font-bold">انبارگردانی کالایی</p>
              <button 
                onClick={() => setSettings(s => ({ ...s, enable_item_counting: s.enable_item_counting === undefined ? true : !s.enable_item_counting }))}
                className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 focus:outline-none ${(settings.enable_item_counting ?? true) ? 'bg-blue-600' : 'bg-gray-200'}`}
              >
                <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-300 ${(settings.enable_item_counting ?? true) ? '-translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Task Mode Settings */}
          <div className="border-t border-gray-50 pt-8 flex flex-col gap-5 relative">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-[12px] bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Layers size={16} strokeWidth={2.5} />
              </div>
              <h2 className="text-sm font-bold text-gray-800">انبارگردانی تسک‌محور (سیستمی)</h2>
            </div>
            
            {(settings.task_mode_location || settings.task_mode_item) && (
              <div className="bg-amber-50 text-amber-700 text-[11px] p-3 rounded-[12px] border border-amber-200 flex items-start gap-2 mb-2 font-bold leading-relaxed">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>
                  توجه: با فعال شدن این حالت، کاربران در داشبورد خود موظف به انجام تسک‌های سیستم هستند. در این صورت پیشنهادهای خودکار و همچنین امکان شمارش آزاد (اگر خاموش کنید) تحت تاثیر قرار می‌گیرد و اولویت با تسک محول شده است.
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-xs text-gray-800 leading-relaxed font-bold">تسک‌محور برای قفسه</p>
                <p className="text-[10px] text-gray-400">ارجاع هوشمند قفسه‌ها به کاربران بدون تداخل</p>
              </div>
              <button 
                onClick={() => setSettings(s => ({ ...s, task_mode_location: !s.task_mode_location }))}
                className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 focus:outline-none ${settings.task_mode_location ? 'bg-purple-600' : 'bg-gray-200'}`}
              >
                <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-300 ${settings.task_mode_location ? '-translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-xs text-gray-800 leading-relaxed font-bold">تسک‌محور برای کالا</p>
                <p className="text-[10px] text-gray-400">ارجاع هوشمند کالاها به کاربران</p>
              </div>
              <button 
                onClick={() => setSettings(s => ({ ...s, task_mode_item: !s.task_mode_item }))}
                className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 focus:outline-none ${settings.task_mode_item ? 'bg-purple-600' : 'bg-gray-200'}`}
              >
                <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-300 ${settings.task_mode_item ? '-translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Rotation Cycles Setting */}
          <div className="border-t border-gray-50 pt-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-[12px] bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                <RotateCcw size={16} strokeWidth={2.5} />
              </div>
              <h2 className="text-sm font-bold text-gray-800">چرخش انبارگردان قفسه‌ها (عدم تخصیص تکراری به یک فرد)</h2>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              تعداد دوره‌هایی که یک قفسه نباید دوباره به انبارگردان قبلی‌اش محول شود تا سیستم تسک آن را به فرد دیگری ارجاع دهد.
            </p>
            
            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-[16px] border border-gray-100">
              <input 
                type="number" 
                min="0"
                max="10"
                value={settings.shelf_assignment_rotation_cycles ?? 2}
                onChange={e => setSettings(s => ({ ...s, shelf_assignment_rotation_cycles: Math.max(0, Number(e.target.value)) }))}
                className="w-20 bg-white border border-gray-200 rounded-[12px] px-3 py-2 text-center font-black text-gray-800 focus:outline-none focus:border-teal-500 transition-colors"
              />
              <span className="text-sm font-bold text-gray-600">دوره عدم تخصیص مجدد به یک نفر</span>
            </div>
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

          {/* Location Levels Setting */}
          <div className="border-t border-gray-50 pt-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-[12px] bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Layers size={16} strokeWidth={2.5} />
              </div>
              <h2 className="text-sm font-bold text-gray-800">تعریف سطوح انبار (ساختار درختی)</h2>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              عناوین سطوح به ترتیب از بزرگترین سطح (مانند طبقه) به کوچکترین (مانند ردیف) را مشخص کنید. این عناوین در صفحه مدیریت قفسه‌ها به صورت خودکار استفاده می‌شوند.
            </p>
            
            <div className="flex flex-col gap-3">
              {(settings.location_levels || []).map((level, index) => (
                <div key={index} className="flex flex-row items-center gap-2 bg-gray-50 p-2 rounded-[16px] border border-gray-100">
                  <div className="w-8 h-8 bg-white rounded-[10px] flex items-center justify-center text-xs font-bold text-gray-400 shrink-0 shadow-sm">
                    {index + 1}
                  </div>
                  <input 
                    type="text" 
                    value={level.name || ''}
                    onChange={e => handleLevelChange(index, 'name', e.target.value)}
                    placeholder="عنوان"
                    className="flex-1 w-full bg-white border border-gray-200 rounded-[12px] px-3 py-2 text-sm font-bold text-gray-800 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <select 
                    value={level.format || 'ANY'}
                    onChange={e => handleLevelChange(index, 'format', e.target.value)}
                    dir="ltr"
                    className="w-20 shrink-0 bg-white border border-gray-200 rounded-[12px] px-2 py-2 text-sm font-bold text-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="ANY">*</option>
                    <option value="UPPERCASE">ABC</option>
                    <option value="LOWERCASE">abc</option>
                    <option value="NUMBER">123</option>
                    <option value="SYMBOL">+/-</option>
                  </select>
                  <button 
                    onClick={() => removeLevel(index)}
                    className="w-10 h-10 bg-white text-red-500 border border-gray-200 rounded-[12px] flex items-center justify-center shrink-0 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                  >
                    <Trash2 size={16} strokeWidth={2.5} />
                  </button>
                </div>
              ))}
              
              <button 
                onClick={addLevel}
                className="w-full mt-2 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 py-3 rounded-[12px] text-sm font-bold hover:bg-indigo-100 transition-colors"
              >
                <Plus size={16} strokeWidth={3} />
                افزودن سطح جدید
              </button>
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
