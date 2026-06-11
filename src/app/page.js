'use client';
import { useState, useEffect } from 'react';
import { Fingerprint, Download, Share } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function EntryPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showInstall, setShowInstall] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    setIsIOS(isIOSDevice);

    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

      if (!isStandalone && process.env.NODE_ENV !== 'development') {
        setShowSplash(false);
        setShowInstall(true);
      } else {
        if (token) {
          router.push('/dashboard');
        } else {
          setShowSplash(false);
          setShowInstall(false);
        }
      }
    };
    checkAuth();

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
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
    <div className="fixed inset-0 w-full h-[100dvh] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden flex flex-col justify-between items-center">
      
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-purple-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>

      <AnimatePresence mode="wait">
        {showSplash ? (
          <motion.div 
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-50/50 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <motion.div 
                className="w-24 h-24 rounded-3xl shadow-sm border border-gray-100 mb-6 overflow-hidden flex items-center justify-center bg-white"
              >
                <img src="/icons/icon-512x512.png" alt="پردیس رایانه" className="w-full h-full object-cover" />
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="text-2xl font-black text-gray-800 tracking-tight"
              >
                انبارگردانی هوشمند
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="text-sm text-gray-500 mt-2 font-medium"
              >
                مدیریت حرفه‌ای انبار و قفسه‌ها
              </motion.p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
              className="absolute bottom-12 flex flex-col items-center"
            >
              <div className="flex flex-col items-center justify-center opacity-40 hover:opacity-100 transition-opacity gap-1">
                <span className="text-[11px] text-gray-800 font-black tracking-[0.3em] uppercase font-sans">
                  H U K A
                </span>
                <span className="text-[9px] text-gray-500 font-medium tracking-widest">طراحی توسط هوکا</span>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "120px" }}
              transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
              className="absolute bottom-6 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
            />
          </motion.div>
        ) : showInstall ? (
          <motion.div 
            key="install"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
            className="w-full h-full flex flex-col justify-center items-center px-8 z-10 relative max-w-md mx-auto"
          >
            <div className="w-28 h-28 rounded-3xl shadow-sm border border-gray-100 mb-8 overflow-hidden flex items-center justify-center bg-white p-2">
              <img src="/icons/icon-512x512.png" alt="پردیس رایانه" className="w-full h-full object-cover" />
            </div>
            
            <h2 className="text-2xl font-black text-gray-800 tracking-tight mb-3 text-center">
              تجربه بهتر در اپلیکیشن
            </h2>
            
            <p className="text-sm text-gray-500 font-medium text-center leading-relaxed mb-10">
              برای تجربه سریع‌تر، دسترسی آفلاین و استفاده از <b className="text-gray-700">ورود امن با اثر انگشت</b>، پیشنهاد می‌کنیم اپلیکیشن انبارگردانی را روی دستگاه خود نصب کنید.
            </p>
            
            <div className="w-full flex flex-col gap-3">
              {isIOS ? (
                <div className="bg-gray-100/50 border border-gray-200 rounded-[24px] p-5 mb-2">
                  <p className="text-xs font-bold text-gray-700 text-center mb-3">راهنمای نصب در آیفون (iOS):</p>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium justify-center">
                    <span>۱. لمس <Share className="inline w-4 h-4 mx-0.5 text-blue-500"/></span>
                    <span>۲. انتخاب <b className="text-gray-800 border bg-white px-1.5 py-0.5 rounded-md shadow-sm">Add to Home Screen</b></span>
                  </div>
                </div>
              ) : (
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    if (deferredPrompt) {
                      deferredPrompt.prompt();
                      const { outcome } = await deferredPrompt.userChoice;
                      if (outcome === 'accepted') {
                        setDeferredPrompt(null);
                      }
                    } else {
                      alert('مرورگر شما از نصب مستقیم پشتیبانی نمی‌کند. از منوی مرورگر Add to Home screen را انتخاب کنید.');
                    }
                  }}
                  className="w-full py-4 bg-gray-900 text-white text-sm font-extrabold rounded-[20px] transition-all flex items-center justify-center shadow-sm gap-2"
                >
                  <Download size={18} strokeWidth={2.5} />
                  نصب مستقیم اپلیکیشن
                </motion.button>
              )}
              
              <button 
                onClick={() => {
                  setShowInstall(false);
                  if (localStorage.getItem('token')) router.push('/dashboard');
                }}
                className="w-full py-4 text-gray-400 hover:text-gray-600 text-xs font-bold transition-colors"
              >
                فعلاً نه، ادامه در مرورگر
              </button>
            </div>
            
            <div className="absolute bottom-12 flex flex-col items-center justify-center opacity-40">
              <span className="text-[11px] text-gray-800 font-black tracking-[0.3em] uppercase font-sans">
                H U K A
              </span>
              <span className="text-[9px] text-gray-500 font-medium tracking-widest">طراحی توسط هوکا</span>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="w-full h-full flex flex-col justify-between z-10 relative max-w-md mx-auto"
          >
            {/* Top Area: Logo & Welcome (Shrinks when focused to make room for keyboard) */}
            <motion.div 
              animate={{ 
                height: isFocused ? "10%" : "auto", 
                opacity: isFocused ? 0 : 1,
                y: isFocused ? -50 : 0
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="flex flex-col items-center justify-center flex-1 pt-10"
            >
              <div className="w-20 h-20 rounded-3xl shadow-sm border border-gray-100 mb-6 overflow-hidden flex items-center justify-center bg-white">
                <img src="/icons/icon-512x512.png" alt="پردیس رایانه" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight mb-2">
                خوش آمدید
              </h2>
              <p className="text-sm text-gray-500 font-medium">
                لطفاً برای ادامه وارد حساب خود شوید
              </p>
            </motion.div>
            
            {/* Bottom Area: Bottom Sheet Form */}
            <motion.div 
              animate={{ 
                y: isFocused ? -20 : 0, 
                paddingBottom: isFocused ? "40px" : "40px" 
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full bg-white/95 backdrop-blur-3xl rounded-t-[40px] p-8 shadow-sm border-t border-gray-100 flex flex-col"
            >
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 bg-red-50 text-red-600 text-xs rounded-2xl text-center font-bold">
                  {error}
                </motion.div>
              )}
              
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div className="flex flex-col">
                  <label className="text-[11px] font-extrabold text-gray-400 mb-1.5 ml-2 uppercase tracking-widest">شماره موبایل</label>
                  <input 
                    type="tel"
                    dir="ltr"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="px-5 py-4 bg-gray-50/80 rounded-[20px] focus:outline-none focus:bg-gray-100 transition-colors text-base font-bold text-gray-800 placeholder-gray-400"
                    placeholder="09xxxxxxxxx"
                    required
                  />
                </div>
                
                <div className="flex flex-col">
                  <label className="text-[11px] font-extrabold text-gray-400 mb-1.5 ml-2 uppercase tracking-widest">رمز عبور</label>
                  <input 
                    type="password" 
                    dir="ltr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="px-5 py-4 bg-gray-50/80 rounded-[20px] focus:outline-none focus:bg-gray-100 transition-colors text-base font-bold text-gray-800 placeholder-gray-400"
                    placeholder="••••••••"
                  />
                </div>
                
                <div className="flex gap-2 mt-2">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    type="button" 
                    onClick={async () => {
                      if (!username) {
                        setError('ابتدا شماره موبایل را وارد کنید');
                        setTimeout(() => setError(''), 3000);
                        return;
                      }
                      try {
                        const { startAuthentication } = await import('@simplewebauthn/browser');
                        const res = await fetch('/api/auth/webauthn/login/generate-options', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ username })
                        });
                        const options = await res.json();
                        if (options.error) throw new Error(options.error);
                        
                        const asseResp = await startAuthentication(options);
                        
                        const verifyRes = await fetch('/api/auth/webauthn/login/verify', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ username, response: asseResp })
                        });
                        
                        const verification = await verifyRes.json();
                        if (verification.verified) {
                          localStorage.setItem('token', verification.token);
                          localStorage.setItem('user', JSON.stringify(verification.user));
                          router.push('/dashboard');
                        } else {
                          throw new Error('احراز هویت ناموفق بود');
                        }
                      } catch (err) {
                        setError(err.message || 'خطا در احراز هویت با اثر انگشت');
                        setTimeout(() => setError(''), 3000);
                      }
                    }}
                    className="w-14 h-14 bg-gray-50 rounded-[20px] flex items-center justify-center text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors shrink-0"
                  >
                    <Fingerprint size={24} strokeWidth={2} />
                  </motion.button>

                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    disabled={loading}
                    className="flex-1 py-4 bg-gray-900 text-white text-sm font-extrabold rounded-[20px] transition-all disabled:opacity-70 flex items-center justify-center shadow-sm"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : 'ورود'}
                  </motion.button>
                </div>
              </form>
              
              <div className="mt-8 mb-2 flex justify-center">
                <div className="flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-gray-500 font-medium tracking-widest">طراحی توسط هوکا</span>
                  <span className="mx-2 text-gray-300">|</span>
                  <span className="text-[9px] text-gray-600 font-black tracking-[0.2em] uppercase font-sans mt-0.5">DESIGNED BY HUKA</span>
                </div>
              </div>
              
              {/* iOS style bottom home indicator placeholder */}
              <div className="mt-4 flex items-center justify-center">
                <div className="w-12 h-1 bg-gray-200 rounded-full"></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
