'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LogOut, ChevronRight, Settings } from 'lucide-react';

export default function Header({ title = 'داشبورد', showBack = false }) {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push('/');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const getInitial = (name) => {
    if (!name) return 'U';
    return name.charAt(0);
  };

  if (!showBack) {
    // Style 4: Modern Floating Island (Pill) Design
    return (
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="mx-4 mt-6 mb-4 p-2 bg-white/70 backdrop-blur-xl border border-white rounded-[28px] flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
      >
        <Link href="/settings" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-12 h-12 bg-gradient-to-tr from-purple-600 to-indigo-500 rounded-[20px] flex items-center justify-center text-white text-lg font-bold shadow-md shadow-purple-500/20 overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              getInitial(user?.name)
            )}
          </div>
          <div className="flex flex-col pr-1">
            <span className="text-[10px] text-gray-400 font-extrabold tracking-wider mb-0.5">پردیس رایانه</span>
            <span className="text-sm font-black text-gray-800 tracking-tight">
              {user?.name || 'کاربر'}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 pl-1">
          {user?.roles?.includes('ADMIN') && (
            <Link 
              href="/admin" 
              className="w-10 h-10 bg-gray-50 text-gray-600 rounded-[18px] hover:bg-gray-100 transition-colors flex items-center justify-center"
              title="پنل مدیریت"
            >
              <Settings size={18} strokeWidth={2.5} />
            </Link>
          )}
          <button 
            onClick={handleLogout} 
            className="w-10 h-10 bg-red-50 text-red-500 rounded-[18px] hover:bg-red-100 transition-colors flex items-center justify-center"
            title="خروج"
          >
            <LogOut size={18} strokeWidth={2.5} />
          </button>
        </div>
      </motion.header>
    );
  }

  // Inner pages (showBack = true)
  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-4 z-50 mx-4 mb-6 p-2 bg-white/80 backdrop-blur-xl border border-white rounded-[24px] flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
    >
      <button 
        onClick={() => router.back()} 
        className="w-10 h-10 bg-gray-50 text-gray-700 rounded-[18px] hover:bg-gray-100 transition-all flex items-center justify-center"
      >
        <ChevronRight size={20} strokeWidth={2.5} />
      </button>
      
      <div className="font-extrabold text-sm text-gray-800 absolute left-1/2 -translate-x-1/2">
        {title}
      </div>
      
      <div className="w-10 h-10 flex items-center justify-center">
        {/* Decorative dot for symmetry */}
        <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
      </div>
    </motion.header>
  );
}
