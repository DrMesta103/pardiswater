'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { Box, Layers, CheckCircle2, ScanLine, X, AlertCircle } from 'lucide-react';
import { hasRole } from '@/lib/auth';
import { saveCountOffline, syncOfflineCounts } from '@/lib/offlineSync';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';

const Scanner = dynamic(() => import('@yudiel/react-qr-scanner').then(mod => mod.Scanner), { ssr: false });

function ItemCountingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const warehouse = searchParams.get('warehouse');

  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  const [productName, setProductName] = useState('');
  const [oldCount, setOldCount] = useState(null);
  
  const [shelfCode, setShelfCode] = useState('');
  const [newCount, setNewCount] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [history, setHistory] = useState([]);
  
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [camError, setCamError] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    fetchSettingsAndData();

    window.addEventListener('online', syncOfflineCounts);
    return () => window.removeEventListener('online', syncOfflineCounts);
  }, [code, warehouse]);

  const fetchSettingsAndData = async () => {
    try {
      const setRes = await fetch('/api/settings');
      if (setRes.ok) {
        const data = await setRes.json();
        setSettings(data);
      }

      if (code) {
        const nameRes = await fetch('/api/hesabfa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, type: 'name' })
        });
        const nameData = await nameRes.json();
        setProductName(nameData?.Result?.Name || 'نامشخص');

        const qRes = await fetch('/api/hesabfa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, type: 'quantity' })
        });
        const qData = await qRes.json();
        const productInfo = qData?.Result?.[0];
        const wInfo = productInfo?.Warehouse?.find(w => w.Code === Number(warehouse));
        setOldCount(wInfo?.Quantity ?? 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const scannedValue = detectedCodes[0].rawValue;
      setShelfCode(scannedValue.toUpperCase());
      setCameraEnabled(false);
      setErrorMsg('');
    }
  };

  const handleError = (error) => {
    const msg = error?.message || error?.name || '';
    if (msg.includes('Requested device not found')) {
      setCamError('دوربینی یافت نشد.');
    } else {
      setCamError('خطا در دسترسی به دوربین.');
    }
  };

  const validateShelfAndSubmit = async () => {
    setErrorMsg('');
    if (!shelfCode) {
      setErrorMsg('لطفاً کد قفسه را وارد یا اسکن کنید');
      return;
    }
    if (newCount === '' || newCount === null) {
      setErrorMsg('لطفاً تعداد را وارد کنید');
      return;
    }
    
    setSubmitLoading(true);

    try {
      // 1. Validate shelf
      const valRes = await fetch('/api/locations/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: shelfCode.toUpperCase(), warehouse })
      });
      const valData = await valRes.json();
      
      if (!valRes.ok) {
        setErrorMsg(valData.error || 'قفسه نامعتبر است');
        setSubmitLoading(false);
        return;
      }

      // 2. Submit count
      const payload = {
        product_id: code,
        product_name: productName,
        warehouse,
        shelfCode: shelfCode.toUpperCase(),
        old_count: oldCount || 0,
        new_count: Number(newCount),
        user_id: user?.id,
        mode: 'ITEM'
      };

      const res = await fetch('/api/counting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setHistory([{ shelf: shelfCode.toUpperCase(), count: newCount }, ...history]);
        setShelfCode('');
        setNewCount('');
      } else {
        setErrorMsg('خطا در ثبت شمارش در سرور');
      }
    } catch (err) {
      // 3. Fallback offline
      const payload = {
        product_id: code,
        product_name: productName,
        warehouse,
        shelfCode: shelfCode.toUpperCase(),
        old_count: oldCount || 0,
        new_count: Number(newCount),
        user_id: user?.id,
        mode: 'ITEM'
      };
      await saveCountOffline(payload);
      alert('ارتباط با سرور قطع است. اطلاعات موقتاً در گوشی شما ذخیره شد.');
      setHistory([{ shelf: shelfCode.toUpperCase(), count: newCount, offline: true }, ...history]);
      setShelfCode('');
      setNewCount('');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleFinish = () => {
    router.push('/dashboard');
  };

  const isBlind = settings?.blind_counting && !hasRole(user?.roles, ['ADMIN', 'SUPERVISOR']);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex flex-col">
        <Header title="انبارگردانی کالا" showBack={true} />
        <div className="flex-1 flex justify-center items-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24 relative overflow-x-hidden">
      <Header title="انبارگردانی کالا" showBack={true} />
      
      {/* Top Banner */}
      <div className="bg-gray-900 text-white px-5 py-4 shadow-md flex items-center gap-4">
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
          <Box size={24} />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold leading-snug">{productName}</h2>
          <p className="text-xs text-gray-400 mt-1 font-medium tracking-wider dir-ltr text-right">کد: {code}</p>
        </div>
        {!isBlind && oldCount !== null && (
          <div className="bg-white/10 px-3 py-2 rounded-xl flex flex-col items-center shrink-0 border border-white/5">
            <span className="text-sm font-black text-indigo-300">{oldCount}</span>
            <span className="text-[10px] text-gray-300 font-bold">موجودی سیستم</span>
          </div>
        )}
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-md mx-auto w-full flex flex-col gap-6 mt-2">
        
        {/* Input Form */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50/50 rounded-bl-full -z-0"></div>
          
          <h3 className="text-sm font-bold text-gray-800 relative z-10 flex items-center gap-2">
            <CheckCircle2 className="text-indigo-600" size={18} />
            ثبت شمارش در قفسه
          </h3>
          
          {errorMsg && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertCircle size={14} />
              {errorMsg}
            </div>
          )}
          
          <div className="flex flex-col gap-3 relative z-10">
            <div className="flex gap-2">
              <input 
                type="text" 
                dir="ltr"
                value={shelfCode}
                onChange={(e) => { setShelfCode(e.target.value); setErrorMsg(''); }}
                placeholder="مثال: C-1"
                className="flex-1 py-3.5 bg-gray-50 border border-gray-200 rounded-[16px] text-center text-lg font-black text-gray-800 uppercase focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-sm placeholder:font-normal placeholder:text-gray-400"
              />
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => setCameraEnabled(true)}
                className="w-14 bg-indigo-50 text-indigo-600 rounded-[16px] flex items-center justify-center shrink-0 hover:bg-indigo-100 transition-colors border border-indigo-100"
              >
                <ScanLine size={20} strokeWidth={2.5} />
              </motion.button>
            </div>
            
            <AnimatePresence>
              {cameraEnabled && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="w-full aspect-video relative flex flex-col items-center justify-center bg-black overflow-hidden rounded-[16px]"
                >
                  {camError ? (
                    <div className="text-red-400 text-xs p-4 text-center font-medium">{camError}</div>
                  ) : (
                    <div className="w-full h-full [&>div]:!object-cover [&>div>video]:!object-cover">
                      <Scanner onScan={handleScan} onError={handleError} />
                    </div>
                  )}
                  <button 
                    onClick={() => { setCameraEnabled(false); setCamError(''); }}
                    className="absolute top-2 right-2 bg-white/20 backdrop-blur-md p-1.5 rounded-full text-white pointer-events-auto"
                  >
                    <X size={16} strokeWidth={3} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <input 
              type="number" 
              dir="ltr"
              value={newCount}
              onChange={(e) => { setNewCount(e.target.value); setErrorMsg(''); }}
              placeholder="تعداد یافت شده در این قفسه..."
              className="w-full border-2 border-gray-200 bg-white rounded-[16px] p-4 text-center text-2xl font-black text-gray-800 focus:outline-none focus:border-indigo-500 transition-all placeholder:text-sm placeholder:font-medium placeholder:text-gray-300"
            />
            
            <button 
              onClick={validateShelfAndSubmit}
              disabled={submitLoading || !newCount || !shelfCode}
              className="w-full bg-indigo-600 text-white p-4 rounded-[16px] shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all disabled:opacity-50 text-sm font-black flex items-center justify-center gap-2 mt-1"
            >
              {submitLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>ثبت قفسه و تعداد</>
              )}
            </button>
          </div>
        </div>

        {/* History of this item in different shelves */}
        {history.length > 0 && (
          <div className="flex flex-col gap-3 mt-2">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider px-2">مکان‌های ثبت شده شما</h3>
            <div className="flex flex-col gap-3">
              {history.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-[20px] shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                      <Layers size={18} className="text-gray-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-800 uppercase tracking-widest">{item.shelf}</span>
                      {item.offline && <span className="text-[10px] text-yellow-600 font-bold mt-0.5">ثبت آفلاین</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-gray-400 mb-0.5">شمارش شده</span>
                    <span className="text-lg font-black text-indigo-600">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <button 
          onClick={handleFinish}
          className="w-full py-4 bg-white border border-gray-200 text-gray-600 text-sm font-extrabold rounded-[20px] transition-all hover:bg-gray-50 hover:text-gray-900 mt-2 shadow-sm"
        >
          پایان کار با این کالا
        </button>

      </div>
    </div>
  );
}

export default function ItemCountingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">در حال بارگذاری...</div>}>
      <ItemCountingContent />
    </Suspense>
  );
}
