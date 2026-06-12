'use client';
import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Lock, User, Save, Camera } from 'lucide-react';
import { startRegistration } from '@simplewebauthn/browser';

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [avatarBase64, setAvatarBase64] = useState(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setName(parsedUser.name || '');
    }
    const bio = localStorage.getItem('biometric_enabled');
    if (bio === 'true') setBiometricEnabled(true);
  }, []);

  const showToast = (msg, error = false) => {
    setMessage(msg);
    setIsError(error);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleBiometricToggle = async () => {
    if (biometricEnabled) {
      setBiometricEnabled(false);
      localStorage.setItem('biometric_enabled', 'false');
      showToast('ورود با اثر انگشت غیرفعال شد');
      return;
    }

    try {
      showToast('در حال آماده‌سازی سنسور...', false);
      const res = await fetch('/api/auth/webauthn/register/generate-options', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const options = await res.json();
      
      if (options.error) throw new Error(options.error);

      // Trigger native biometric prompt
      const attResp = await startRegistration(options);
      
      const verificationRes = await fetch('/api/auth/webauthn/register/verify', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(attResp),
      });

      const verification = await verificationRes.json();
      if (verification.verified) {
        setBiometricEnabled(true);
        localStorage.setItem('biometric_enabled', 'true');
        showToast('اثر انگشت با موفقیت فعال شد');
      } else {
        throw new Error('Verification failed');
      }
    } catch (error) {
      console.error(error);
      showToast('خطا در فعال‌سازی یا لغو توسط کاربر', true);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarBase64(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          name, 
          password: password ? password : undefined,
          avatarUrl: avatarBase64 ? avatarBase64 : undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setPassword('');
        showToast('تغییرات شما با موفقیت ذخیره شد.');
      } else {
        showToast(data.error || 'خطا در ذخیره تغییرات', true);
      }
    } catch (err) {
      showToast('خطا در ارتباط با سرور', true);
    } finally {
      setLoading(false);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] flex flex-col pb-20 relative">
      <Header title="تنظیمات حساب" showBack={true} />
      
      {/* Global Toast Notification */}
      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-full shadow-[0_10px_40px_rgb(0,0,0,0.1)] backdrop-blur-xl border text-[11px] font-extrabold whitespace-nowrap flex items-center justify-center ${isError ? 'bg-red-500/95 border-red-400 text-white shadow-red-500/30' : 'bg-gray-800/95 border-gray-700 text-white shadow-gray-900/30'}`}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={container} initial="hidden" animate="show" className="px-6 pt-2 flex flex-col gap-8">
        
        <motion.section variants={item} className="flex flex-col gap-5 items-center">
          <div className="relative group mt-2">
            <div className="w-28 h-28 rounded-full shadow-[0_10px_40px_rgb(0,0,0,0.08)] overflow-hidden border-[4px] border-white bg-gradient-to-tr from-indigo-50 to-purple-50">
              <img src={avatarBase64 || user?.avatarUrl || "/images/default_avatar.png"} alt="avatar" className="w-full h-full object-cover" />
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-10 h-10 bg-white border border-gray-100 text-indigo-500 rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            >
              <Camera size={18} strokeWidth={2.5} />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          </div>
          
          <div className="text-center">
            <h3 className="text-lg font-black text-gray-800">{user?.name || 'کاربر'}</h3>
            <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-wider">{user?.roles?.includes('ADMIN') ? 'مدیریت کل' : 'کاربر عادی'}</p>
          </div>
        </motion.section>

        <motion.section variants={item} className="flex flex-col gap-4">
          <h2 className="text-[11px] font-extrabold text-gray-400 mr-2 uppercase tracking-widest">مشخصات کاربری</h2>
          
          <div className="bg-white/90 backdrop-blur-3xl border border-gray-100/50 rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-2">
            <div className="flex flex-col gap-2">
              
              <div className="flex items-center gap-4 bg-gray-50/50 hover:bg-gray-50 p-4 rounded-[20px] transition-colors">
                <div className="w-10 h-10 bg-white text-indigo-500 rounded-[14px] flex items-center justify-center shadow-sm">
                  <User size={18} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col flex-1">
                  <label className="text-[10px] font-bold text-gray-400 mb-0.5">نام و نام خانوادگی</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="bg-transparent border-none text-sm font-bold text-gray-800 outline-none w-full"
                    placeholder="نام شما"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 bg-gray-50/50 hover:bg-gray-50 p-4 rounded-[20px] transition-colors">
                <div className="w-10 h-10 bg-white text-rose-500 rounded-[14px] flex items-center justify-center shadow-sm">
                  <Lock size={18} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col flex-1">
                  <label className="text-[10px] font-bold text-gray-400 mb-0.5">رمز عبور جدید (اختیاری)</label>
                  <input 
                    type="password" 
                    dir="ltr"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="bg-transparent border-none text-sm font-bold text-gray-800 outline-none w-full placeholder-gray-300"
                    placeholder="••••••••"
                  />
                </div>
              </div>

            </div>
          </div>
        </motion.section>

        <motion.section variants={item} className="flex flex-col gap-4">
          <h2 className="text-[11px] font-extrabold text-gray-400 mr-2 uppercase tracking-widest">امنیت</h2>
          <div className="bg-white/90 backdrop-blur-3xl border border-gray-100/50 rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-2">
            
            <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-[20px] transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center transition-colors shadow-sm ${biometricEnabled ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-gray-100 text-gray-400'}`}>
                  <Fingerprint size={18} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-800">ورود با اثر انگشت</span>
                  <span className="text-[10px] text-gray-400 font-medium mt-0.5">Face ID / Touch ID</span>
                </div>
              </div>
              
              <button 
                onClick={handleBiometricToggle}
                className={`relative flex items-center w-12 h-6 rounded-full px-1 transition-colors duration-300 ease-in-out shrink-0 ${biometricEnabled ? 'bg-green-500' : 'bg-gray-200'}`}
              >
                <motion.div 
                  className="w-4 h-4 bg-white rounded-full shadow-sm"
                  animate={{ x: biometricEnabled ? -24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
            
          </div>
        </motion.section>

        <motion.div variants={item} className="mt-4">
           <button 
             onClick={handleSave} 
             disabled={loading} 
             className="w-full py-4 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-black hover:to-gray-900 text-white text-sm font-extrabold rounded-[20px] transition-all shadow-xl shadow-gray-900/20 disabled:opacity-70 flex items-center justify-center gap-2"
           >
             {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
             ) : (
                <>
                  <Save size={18} strokeWidth={2.5} />
                  ذخیره اطلاعات
                </>
             )}
           </button>
        </motion.div>

      </motion.div>
    </div>
  );
}
