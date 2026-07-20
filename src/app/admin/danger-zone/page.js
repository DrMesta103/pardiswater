'use client';
import { useState } from 'react';
import Header from '@/components/Header';
import { AlertCircle, Trash2, Check, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DangerZonePage() {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', isError: false });

  const showToast = (message, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
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

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24 relative overflow-x-hidden">
      <Header title="منطقه خطر (Danger Zone)" showBack={true} />

      <div className="flex-1 p-4 md:p-6 max-w-xl mx-auto w-full mt-2">
        <div className="bg-white rounded-[24px] p-6 sm:p-8 shadow-sm border border-red-100 flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-[100px] flex items-start justify-end p-6 opacity-50 z-0">
            <AlertCircle className="text-red-200" size={48} strokeWidth={1.5} />
          </div>
          
          <div className="relative z-10 flex flex-col gap-2">
            <h3 className="text-xl font-black text-red-600 flex items-center gap-2">
              <AlertCircle size={24} strokeWidth={2.5} />
              منطقه خطر
            </h3>
            <p className="text-sm text-gray-600 font-medium leading-relaxed">
              شما می‌توانید تمام اطلاعات مربوط به انبارگردانی (کالاهای شمارش‌شده)، ساختار قفسه‌بندی (سطوح انبار) و تسک‌های فعال و قبلی را پاک کنید. اطلاعات کالاها، انبارها و کاربران در این فرآیند دست نخورده باقی می‌ماند.
            </p>
          </div>
          
          <button 
            onClick={() => setIsResetModalOpen(true)}
            className="w-full relative z-10 bg-red-50 text-red-600 border border-red-100 py-4 rounded-[16px] text-sm font-black flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm"
          >
            <Trash2 size={20} />
            پاک کردن دیتا شمارش، تسک‌ها و قفسه‌ها
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isResetModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-5"
            onClick={() => setIsResetModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl flex flex-col gap-5"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <AlertCircle size={32} strokeWidth={2} />
              </div>
              <h3 className="font-black text-gray-800 text-lg text-center">آیا مطمئن هستید؟</h3>
              <p className="text-xs text-gray-500 font-bold text-center leading-relaxed">
                این عملیات غیرقابل بازگشت است. تمام قفسه‌ها، تسک‌ها، سطوح، و داده‌های شمارش‌شده به طور کامل از سیستم حذف خواهند شد.
              </p>
              
              <div className="flex gap-3 mt-2">
                <button 
                  onClick={() => setIsResetModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-[16px] text-sm font-black hover:bg-gray-200 transition-colors"
                >
                  انصراف
                </button>
                <button 
                  onClick={handleResetData}
                  disabled={resetting}
                  className="flex-1 bg-red-500 text-white py-3.5 rounded-[16px] text-sm font-black flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {resetting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'بله، پاک کن'}
                </button>
              </div>
            </motion.div>
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
