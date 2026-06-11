'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('خطا در برقراری ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col justify-center items-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 relative overflow-hidden">
      
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-purple-400/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm p-8 bg-white/60 backdrop-blur-2xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-2xl shadow-lg shadow-purple-500/30 flex items-center justify-center mb-4 text-white font-extrabold text-2xl">
            P
          </div>
          <h1 className="text-xl font-extrabold text-gray-800 tracking-tight">پردیس رایانه</h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">اپلیکیشن مدیریت انبار</p>
        </div>
        
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 bg-red-50/80 border border-red-100 text-red-600 text-xs rounded-xl text-center">
            {error}
          </motion.div>
        )}
        
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-600 mb-1.5 ml-1">شماره موبایل</label>
            <input 
              type="text" 
              dir="ltr"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 focus:bg-white transition-all text-sm"
              placeholder="09xxxxxxxxx"
              required
            />
          </div>
          
          <div className="flex flex-col">
            <label className="text-xs font-bold text-gray-600 mb-1.5 ml-1">رمز عبور</label>
            <input 
              type="password" 
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 focus:bg-white transition-all text-sm"
              placeholder="••••••••"
              required
            />
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl transition-colors mt-2 shadow-lg shadow-gray-900/20 disabled:opacity-70"
          >
            {loading ? 'در حال ورود...' : 'ورود به سیستم'}
          </motion.button>
        </form>
        <p className="text-[10px] text-center text-gray-400 mt-6 font-medium">رمز عبور پیش‌فرض: 123456</p>
      </motion.div>
    </div>
  );
}
