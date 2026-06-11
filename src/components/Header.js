'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LogOut, ChevronRight, Wifi, WifiOff } from 'lucide-react';

export default function Header({ title = 'داشبورد', showBack = false }) {
  const [user, setUser] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push('/');
    }

    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <motion.header 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 w-full h-16 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between px-4 text-gray-800"
    >
      <div className="flex items-center gap-2">
        {showBack ? (
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        ) : (
          <button onClick={handleLogout} className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors flex items-center justify-center">
            <LogOut size={18} />
          </button>
        )}
      </div>
      
      <div className="font-extrabold text-sm tracking-tight text-gray-800">
        {title}
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end">
          <span className="text-xs font-bold text-gray-700">{user?.name || 'کاربر'}</span>
          {user?.role === 'ADMIN' && <Link href="/admin/locations" className="text-[10px] text-purple-600 font-bold hover:underline">مدیریت قفسه‌ها</Link>}
        </div>
        <div className="flex items-center gap-1 bg-gray-50/50 p-1.5 rounded-full border border-gray-100">
          {isOnline ? (
            <Wifi size={14} className="text-green-500" />
          ) : (
            <WifiOff size={14} className="text-red-500" />
          )}
        </div>
      </div>
    </motion.header>
  );
}
