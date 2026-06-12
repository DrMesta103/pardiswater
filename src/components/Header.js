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

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-4 z-50 mx-4 mb-6 p-2 bg-white/80 backdrop-blur-xl border border-white rounded-[24px] flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
    >
      <div className="flex items-center gap-2">
        {showBack ? (
          <button 
            onClick={() => router.back()} 
            className="w-10 h-10 bg-gray-50 text-gray-700 rounded-[18px] hover:bg-gray-100 transition-all flex items-center justify-center"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        ) : (
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-[18px] flex items-center justify-center font-black text-sm">
            {getInitial(user?.name)}
          </div>
        )}
      </div>
      
      <div className="font-extrabold text-sm text-gray-800 absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
        {title}
      </div>
      
      <div className="flex items-center gap-1.5">
        {!showBack && user?.roles?.includes('ADMIN') && (
          <Link 
            href="/admin" 
            className="w-10 h-10 bg-gray-50 text-gray-600 rounded-[18px] hover:bg-gray-100 transition-colors flex items-center justify-center"
          >
            <Settings size={18} strokeWidth={2.5} />
          </Link>
        )}
        <button 
          onClick={handleLogout} 
          className="w-10 h-10 bg-red-50 text-red-500 rounded-[18px] hover:bg-red-100 transition-colors flex items-center justify-center"
        >
          <LogOut size={16} strokeWidth={2.5} />
        </button>
      </div>
    </motion.header>
  );
}
