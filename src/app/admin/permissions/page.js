'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Check, XCircle, Save, Key, AlertCircle, ChevronDown } from 'lucide-react';

export default function AdminPermissionsPage() {
  const [settings, setSettings] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', isError: false });
  const [openAccordion, setOpenAccordion] = useState(null);

  const adminSections = [
    { id: 'settings', label: 'تنظیمات مدیریت' },
    { id: 'warehouses', label: 'مدیریت انبارها' },
    { id: 'locations', label: 'مدیریت قفسه‌ها' },
    { id: 'products', label: 'لیست کالاها' },
    { id: 'discrepancies', label: 'داشبورد مغایرت‌ها' },
    { id: 'stats', label: 'آمار طبقات' },
    { id: 'users', label: 'مدیریت کاربران' },
    { id: 'logs', label: 'لاگ عملیات' },
    { id: 'tasks', label: 'مدیریت تسک‌ها' },
    { id: 'permissions', label: 'سطح دسترسی' },
    { id: 'danger-zone', label: 'منطقه خطر' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resSet, resRoles] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/roles') // Assuming we have an API for roles or we can mock it
      ]);
      
      let currentSettings = { admin_permissions: {} };
      if (resSet.ok) {
        const data = await resSet.json();
        currentSettings = { ...currentSettings, ...data };
        if (!currentSettings.admin_permissions) {
          currentSettings.admin_permissions = {};
        }
      }
      setSettings(currentSettings);

      // Define the explicit roles based on user request:
      setRoles([
        { id: 'SUPERVISOR', label: 'سرپرست انبارگردانی' },
        { id: 'COUNTER', label: 'انبار گردان' },
        { id: 'ACCOUNTANT', label: 'حسابدار' },
      ]);

    } catch (e) {
      console.error(e);
      showToast('خطای شبکه', true);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
  };

  const handleTogglePermission = (roleId, sectionId) => {
    setSettings(prev => {
      const perms = { ...prev.admin_permissions };
      if (!perms[roleId]) perms[roleId] = [];
      
      if (perms[roleId].includes(sectionId)) {
        perms[roleId] = perms[roleId].filter(id => id !== sectionId);
      } else {
        perms[roleId] = [...perms[roleId], sectionId];
      }
      
      return { ...prev, admin_permissions: perms };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_permissions: settings.admin_permissions })
      });
      if (res.ok) {
        showToast('سطوح دسترسی با موفقیت ذخیره شد');
      } else {
        showToast('خطا در ذخیره اطلاعات', true);
      }
    } catch (e) {
      showToast('خطای شبکه', true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex flex-col">
        <Header title="سطح دسترسی" showBack={true} />
        <div className="flex-1 flex justify-center items-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24 relative">
      <Header title="سطح دسترسی" showBack={true} />

      <div className="flex-1 p-4 md:p-6 w-full max-w-2xl mx-auto flex flex-col gap-6">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={20} />
          <div className="text-xs text-blue-800 font-bold leading-relaxed">
            کاربرانی که نقش <strong>مدیر کل (Admin)</strong> دارند، همواره به تمامی بخش‌ها دسترسی دارند. در این صفحه می‌توانید مشخص کنید که نقش‌های دیگر (مثل انبارگردان) در صورت ورود به پنل مدیریت، امکان دیدن چه بخش‌هایی را داشته باشند.
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {roles.map(role => {
            const isOpen = openAccordion === role.id;
            return (
              <div key={role.id} className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm flex flex-col transition-all">
                <button 
                  onClick={() => setOpenAccordion(isOpen ? null : role.id)}
                  className="flex items-center justify-between p-5 w-full hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isOpen ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-50 text-indigo-600'}`}>
                      <Key size={20} />
                    </div>
                    <h3 className="font-black text-gray-800 text-base">دسترسی‌های نقش: <span className={isOpen ? 'text-indigo-600' : 'text-gray-600'}>{role.label}</span></h3>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${isOpen ? 'rotate-180 bg-indigo-100 text-indigo-600' : 'bg-gray-50 text-gray-400'}`}>
                    <ChevronDown size={18} />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 pt-0 border-t border-gray-50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                          {adminSections.map(section => {
                            const isChecked = settings.admin_permissions?.[role.id]?.includes(section.id) || false;
                            return (
                              <button
                                key={section.id}
                                onClick={() => handleTogglePermission(role.id, section.id)}
                                className={`flex items-center justify-between p-3.5 rounded-[16px] border text-xs font-bold transition-all ${
                                  isChecked 
                                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm' 
                                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100'
                                }`}
                              >
                                {section.label}
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${isChecked ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-transparent'}`}>
                                  <Check size={12} strokeWidth={3} />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-2 flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-4 rounded-[16px] text-sm font-extrabold shadow-md hover:bg-gray-800 transition-colors disabled:opacity-70"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <Save size={18} strokeWidth={2.5} />
              ذخیره سطوح دسترسی
            </>
          )}
        </motion.button>
      </div>

      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }}
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
