'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { Lock, Unlock, ScanLine, Search, Check, Box, Layers, AlertCircle, X } from 'lucide-react';
import { hasRole } from '@/lib/auth';
import { saveCountOffline, syncOfflineCounts } from '@/lib/offlineSync';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';

const Scanner = dynamic(() => import('@yudiel/react-qr-scanner').then(mod => mod.Scanner), { ssr: false });

function ShelfCountingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shelfCode = searchParams.get('code');
  const warehouse = searchParams.get('warehouse');

  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  // Item scanning state
  const [productCode, setProductCode] = useState('');
  const [productName, setProductName] = useState('');
  const [oldCount, setOldCount] = useState(null);
  const [newCount, setNewCount] = useState('');
  
  const [itemLoading, setItemLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [camError, setCamError] = useState('');

  // History of scanned items in this session
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    fetchSettings();

    window.addEventListener('online', syncOfflineCounts);
    return () => window.removeEventListener('online', syncOfflineCounts);
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishShelf = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/locations/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ shelfCode, action: 'UNLOCK' })
      });
      router.push('/dashboard');
    } catch (error) {
      router.push('/dashboard');
    }
  };

  const fetchItemData = async (codeToFetch) => {
    const code = codeToFetch || productCode;
    if (!code) {
      setErrorMsg('کد کالا را وارد کنید');
      return;
    }
    
    setErrorMsg('');
    setItemLoading(true);
    setProductName('');
    setOldCount(null);
    setNewCount('');
    
    try {
      const nameRes = await fetch('/api/hesabfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, type: 'name' })
      });
      const nameData = await nameRes.json();
      
      if (!nameData?.Result?.Name || nameData?.Result?.Name === 'نامشخص' || nameData.error) {
        setErrorMsg('کالایی با این کد در حسابفا یافت نشد.');
        setItemLoading(false);
        return;
      }
      
      setProductName(nameData.Result.Name);

      const qRes = await fetch('/api/hesabfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, type: 'quantity' })
      });
      const qData = await qRes.json();
      const productInfo = qData?.Result?.[0];
      const wInfo = productInfo?.Warehouse?.find(w => w.Code === Number(warehouse));
      setOldCount(wInfo?.Quantity ?? 0);
    } catch (error) {
      console.error(error);
      setErrorMsg('خطا در ارتباط با حسابفا');
    } finally {
      setItemLoading(false);
    }
  };

  const handleProductCodeChange = (e) => {
    setProductCode(e.target.value);
    setErrorMsg('');
    setProductName('');
  };

  const handleProductCodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      fetchItemData();
    }
  };

  const handleScan = (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const scannedValue = detectedCodes[0].rawValue;
      setProductCode(scannedValue);
      setCameraEnabled(false);
      setCamError('');
      fetchItemData(scannedValue);
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

  const handleSubmitItem = async () => {
    if (!productName || errorMsg) {
      setErrorMsg('ابتدا از صحت کالا اطمینان حاصل کنید');
      return;
    }
    if (newCount === '' || newCount === null) {
      setErrorMsg('لطفاً تعداد را وارد کنید');
      return;
    }
    
    setSubmitLoading(true);
    
    const payload = {
      product_id: productCode,
      product_name: productName,
      warehouse,
      shelfCode: shelfCode.toUpperCase(),
      old_count: oldCount || 0,
      new_count: Number(newCount),
      user_id: user?.id,
      mode: 'SHELF'
    };

    try {
      const res = await fetch('/api/counting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setHistory([{ code: productCode, name: productName, count: newCount }, ...history]);
        setProductCode('');
        setProductName('');
        setOldCount(null);
        setNewCount('');
        setErrorMsg('');
      } else {
        setErrorMsg('خطا در ثبت شمارش کالا در سرور');
      }
    } catch (err) {
      // Network error (offline or server down)
      await saveCountOffline(payload);
      alert('ارتباط با سرور قطع است. اطلاعات در گوشی شما ذخیره شد و به محض اتصال ارسال می‌شود.');
      setHistory([{ code: productCode, name: productName, count: newCount, offline: true }, ...history]);
      setProductCode('');
      setProductName('');
      setOldCount(null);
      setNewCount('');
      setErrorMsg('');
    } finally {
      setSubmitLoading(false);
    }
  };

  const isBlind = settings?.blind_counting && !hasRole(user?.roles, ['ADMIN', 'SUPERVISOR']);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex flex-col">
        <Header title="انبارگردانی قفسه" showBack={true} />
        <div className="flex-1 flex justify-center items-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24 relative overflow-x-hidden">
      <Header title="انبارگردانی قفسه" showBack={true} />
      
      {/* Top Banner */}
      <div className="bg-indigo-600 text-white px-5 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <Layers size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-indigo-200 font-bold mb-0.5 tracking-wider">در حال شمارش قفسه</span>
            <span className="text-xl font-black tracking-widest uppercase">{shelfCode}</span>
          </div>
        </div>
        
        <button 
          onClick={handleFinishShelf}
          className="bg-white/20 hover:bg-white/30 text-white text-xs font-black py-2.5 px-4 rounded-[14px] transition-colors flex items-center gap-2 backdrop-blur-sm shadow-sm"
        >
          <Unlock size={14} strokeWidth={3} />
          پایان قفسه
        </button>
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-md mx-auto w-full flex flex-col gap-6 mt-2">
        
        {/* Scanner Form */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-16 h-16 bg-blue-50/50 rounded-br-full -z-0"></div>
          
          <h3 className="text-sm font-bold text-gray-800 relative z-10 flex items-center gap-2">
            <ScanLine className="text-indigo-600" size={18} />
            اسکن کالای جدید در این قفسه
          </h3>

          {errorMsg && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 relative z-10">
              <AlertCircle size={14} className="shrink-0" />
              {errorMsg}
            </div>
          )}
          
          <div className="flex flex-col gap-3 relative z-10">
            <div className="flex gap-2">
              <input 
                type="number" 
                dir="ltr"
                value={productCode}
                onChange={handleProductCodeChange}
                onKeyDown={handleProductCodeKeyDown}
                placeholder="بارکد یا کد کالا..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-[16px] px-4 py-3.5 text-lg font-bold text-gray-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-center placeholder:text-sm placeholder:font-normal placeholder:text-gray-400"
              />
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchItemData()}
                disabled={itemLoading || !productCode}
                className="w-14 bg-indigo-50 text-indigo-600 rounded-[16px] flex items-center justify-center shrink-0 hover:bg-indigo-100 transition-colors border border-indigo-100 disabled:opacity-50"
              >
                {itemLoading ? <div className="w-5 h-5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div> : <Search size={20} strokeWidth={2.5} />}
              </motion.button>
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => setCameraEnabled(true)}
                className="w-14 bg-gray-900 text-white rounded-[16px] flex items-center justify-center shrink-0 shadow-md transition-colors"
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

            {/* Product Details & Count input (only shown if valid product found) */}
            <AnimatePresence>
              {productName && !itemLoading && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 pt-4 border-t border-gray-100 flex flex-col gap-4"
                >
                  <div className="flex justify-between items-start bg-indigo-50/50 p-3 rounded-[16px] border border-indigo-50">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-indigo-500 shadow-sm shrink-0">
                        <Box size={16} />
                      </div>
                      <div className="flex flex-col">
                        <h3 className="font-bold text-gray-800 text-sm leading-tight">{productName}</h3>
                        <p className="text-[10px] text-gray-500 mt-1 font-medium">کد حسابفا: {productCode}</p>
                      </div>
                    </div>
                    {!isBlind && oldCount !== null && (
                      <div className="bg-white border border-gray-100 text-indigo-600 px-3 py-1.5 rounded-xl flex flex-col items-center shadow-sm shrink-0 ml-1">
                        <span className="text-sm font-black">{oldCount}</span>
                        <span className="text-[9px] font-bold text-gray-400">موجودی سیستم</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <input 
                      type="number" 
                      dir="ltr"
                      value={newCount}
                      onChange={(e) => { setNewCount(e.target.value); setErrorMsg(''); }}
                      placeholder="تعداد شمارش شده را وارد کنید..."
                      className="w-full border-2 border-gray-200 bg-white rounded-[16px] p-4 text-center text-2xl font-black text-gray-800 focus:outline-none focus:border-indigo-500 transition-all placeholder:text-sm placeholder:font-medium placeholder:text-gray-300"
                    />
                    <button 
                      onClick={handleSubmitItem}
                      disabled={submitLoading || !newCount}
                      className="w-full bg-indigo-600 text-white py-4 rounded-[16px] shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all disabled:opacity-50 text-sm font-black flex items-center justify-center gap-2"
                    >
                      {submitLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>ثبت شمارش</>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* History of this session */}
        {history.length > 0 && (
          <div className="flex flex-col gap-3 mt-2">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider px-2">کالاهای ثبت شده تا الان</h3>
            <div className="flex flex-col gap-3">
              {history.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 relative overflow-hidden">
                  {item.offline && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400"></div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                      <Box size={18} className="text-gray-400" />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-xs font-bold text-gray-800 line-clamp-1">{item.name}</p>
                      <p className="text-[10px] font-medium text-gray-400 mt-0.5">کد: {item.code}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0 pl-1">
                    <span className="text-[10px] font-bold text-gray-400 mb-0.5">شمارش شما</span>
                    <span className="text-lg font-black text-indigo-600">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function ShelfCountingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">در حال بارگذاری...</div>}>
      <ShelfCountingContent />
    </Suspense>
  );
}
