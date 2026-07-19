'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCcw } from 'lucide-react';

export default function NetworkStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);

      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      setIsOffline(false);
      window.location.reload();
    }
  };

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-md flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
          >
            {/* Background design elements */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-100 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-100 rounded-full blur-3xl opacity-50"></div>
            
            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-inner relative z-10">
              <WifiOff size={40} strokeWidth={2.5} />
            </div>
            
            <h2 className="text-xl font-black text-gray-800 mb-2 relative z-10">ارتباط قطع شد!</h2>
            
            <p className="text-sm font-bold text-gray-500 leading-relaxed mb-8 relative z-10">
              به نظر می‌رسد اتصال شما به اینترنت قطع شده است. برای ادامه استفاده از سیستم، لطفا اتصال خود را بررسی کنید.
            </p>
            
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={handleRetry}
              className="w-full bg-gray-900 text-white py-4 rounded-[16px] text-sm font-black flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-lg relative z-10"
            >
              <RefreshCcw size={18} />
              تلاش مجدد
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
