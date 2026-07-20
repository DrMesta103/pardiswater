'use client';
import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { ScanLine, Search, Check, Box, Layers, AlertCircle, X, History } from 'lucide-react';
import { hasRole } from '@/lib/auth';
import { saveCountOffline, syncOfflineCounts } from '@/lib/offlineSync';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';

const Scanner = dynamic(() => import('@yudiel/react-qr-scanner').then(mod => mod.Scanner), { ssr: false });

function ItemCountingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const product_id = searchParams.get('product_id');
  const warehouse = searchParams.get('warehouse');

  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  // We fetch product details based on product_id from query
  const [productName, setProductName] = useState('');
  const [oldCount, setOldCount] = useState(null);
  const [newCount, setNewCount] = useState('');
  const [shelfCode, setShelfCode] = useState('');
  
  const [submitLoading, setSubmitLoading] = useState(false);
  const [history, setHistory] = useState([]);
  
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [camError, setCamError] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const inputRef = useRef(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    fetchSettings();
    fetchInitialItemData();

    window.addEventListener('online', syncOfflineCounts);
    return () => window.removeEventListener('online', syncOfflineCounts);
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) setSettings(await res.json());
    } catch (e) {}
  };

  const fetchInitialItemData = async () => {
    if (!product_id) {
      router.push('/dashboard');
      return;
    }
    
    try {
      const nameRes = await fetch('/api/hesabfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: product_id, type: 'name' })
      });
      const nameData = await nameRes.json();
      
      if (!nameData?.Result?.Name || nameData?.Result?.Name === 'نامشخص') {
        setErrorMsg('کالا یافت نشد.');
      } else {
        setProductName(nameData.Result.Name);
      }

      const qRes = await fetch('/api/hesabfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: product_id, type: 'quantity' })
      });
      const qData = await qRes.json();
      const productInfo = qData?.Result?.[0];
      
      let foundStock = 0;
      if (productInfo) {
         if (productInfo.StockByWarehouse && Array.isArray(productInfo.StockByWarehouse)) {
            const wInfo = productInfo.StockByWarehouse.find(w => w.WarehouseCode === Number(warehouse) || w.Code === Number(warehouse));
            if (wInfo) foundStock = wInfo.Stock || wInfo.Quantity || 0;
            else foundStock = productInfo.Stock || productInfo.Quantity || 0;
         } else if (productInfo.Warehouse && Array.isArray(productInfo.Warehouse)) {
            const wInfo = productInfo.Warehouse.find(w => w.Code === Number(warehouse));
            foundStock = wInfo?.Quantity ?? productInfo.Stock ?? productInfo.Quantity ?? 0;
         } else {
            foundStock = productInfo.Stock ?? productInfo.Quantity ?? 0;
         }
      }
      setOldCount(foundStock);
    } catch (error) {
      setErrorMsg('خطا در دریافت اطلاعات کالا از سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const scannedValue = detectedCodes[0].rawValue;
      // We do not close the camera!
      setShelfCode(scannedValue);
      setCamError('');
      if (inputRef.current) setTimeout(() => inputRef.current.focus(), 100);
    }
  };

  const handleError = (error) => {
    const msg = error?.message || error?.name || '';
    if (msg.includes('Requested device not found')) setCamError('دوربینی یافت نشد.');
    else setCamError('خطا در دسترسی به دوربین.');
  };

  const handleSubmitShelf = async () => {
    if (!shelfCode) {
      setErrorMsg('کد قفسه را وارد یا اسکن کنید');
      return;
    }
    if (newCount === '' || newCount === null) {
      setErrorMsg('تعداد را وارد کنید');
      return;
    }
    
    setSubmitLoading(true);
    setErrorMsg('');
    
    const payload = {
      product_id: String(product_id),
      product_name: productName,
      warehouse: Number(warehouse),
      shelfCode: shelfCode.toUpperCase(),
      old_count: oldCount || 0,
      new_count: Number(newCount),
      user_id: user?.id,
      mode: 'ITEM'
    };

    try {
      const res = await fetch('/api/counting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setHistory([{ shelf: shelfCode.toUpperCase(), count: newCount }, ...history]);
        setShelfCode('');
        setNewCount('');
        setErrorMsg('');
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'خطا در ثبت اطلاعات در سرور');
      }
    } catch (err) {
      await saveCountOffline(payload);
      alert('ارتباط با سرور قطع است. اطلاعات ذخیره شد.');
      setHistory([{ shelf: shelfCode.toUpperCase(), count: newCount, offline: true }, ...history]);
      setShelfCode('');
      setNewCount('');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancelItem = async () => {
    const reason = window.prompt('لطفاً دلیل لغو انبارگردانی این کالا را وارد کنید:');
    if (!reason) return;
    
    try {
      await fetch('/api/counting/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id, warehouse, userId: user?.id, reason, mode: 'ITEM' })
      });
      router.push('/dashboard');
    } catch (error) {
      alert('خطا در ارتباط با سرور');
    }
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
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24 relative">
      <Header title="انبارگردانی کالا" showBack={true} />
      
      {/* Top Fixed Info Bar */}
      <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-[14px] flex items-center justify-center font-black">
            <Box size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold tracking-wider line-clamp-1 w-32">{productName}</span>
            <span className="text-xs font-black text-gray-800">آماده ثبت قفسه</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleCancelItem}
            className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-[14px] transition-colors"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-black py-2.5 px-4 rounded-[14px] transition-colors flex items-center gap-2"
          >
            <Check size={14} strokeWidth={3} />
            پایان کالا
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-5 max-w-md mx-auto w-full mt-2">
        
        {!isBlind && oldCount !== null && (
          <div className="bg-white rounded-[20px] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-500">موجودی کل در سیستم:</span>
            <span className="text-xl font-black text-teal-600">{oldCount}</span>
          </div>
        )}

        {/* Continuous Scanner Area for Shelf */}
        <div className="bg-white rounded-[24px] p-2 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
          <div className="w-full aspect-video relative flex items-center justify-center bg-gray-900 rounded-[20px] overflow-hidden">
            {camError ? (
              <div className="text-red-400 text-xs p-4 text-center font-medium">{camError}</div>
            ) : cameraEnabled ? (
              <>
                <div className="w-full h-full opacity-80 [&>div]:!object-cover [&>div>video]:!object-cover">
                  <Scanner onScan={handleScan} onError={handleError} />
                </div>
                {/* Scanner Overlay UI */}
                <div className="absolute inset-0 pointer-events-none border-[3px] border-teal-500/30 m-4 rounded-[16px]">
                  <div className="absolute top-1/2 left-0 w-full h-[2px] bg-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                </div>
              </>
            ) : (
              <button onClick={() => setCameraEnabled(true)} className="flex flex-col items-center gap-2 text-gray-400">
                <ScanLine size={32} />
                <span className="text-xs font-bold">فعال‌سازی مجدد دوربین</span>
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-3 px-2 pb-2">
            <input 
              type="text" 
              dir="ltr"
              value={shelfCode}
              onChange={(e) => { setShelfCode(e.target.value); setErrorMsg(''); }}
              placeholder="کد قفسه..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-[14px] px-4 py-3 text-sm font-bold text-gray-800 uppercase focus:outline-none focus:border-teal-500 text-center placeholder:font-normal placeholder:normal-case"
            />
          </div>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-[16px] text-xs font-bold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Count Input Box */}
        <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-teal-50 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-bl-full -z-0"></div>
          
          <div className="flex flex-col gap-1 relative z-10">
            <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
              <Layers size={18} className="text-teal-600" />
              ثبت موجودی در قفسه {shelfCode ? `«${shelfCode.toUpperCase()}»` : ''}
            </h3>
          </div>

          <div className="flex flex-col gap-3 relative z-10 mt-2">
            <input 
              ref={inputRef}
              type="number" 
              dir="ltr"
              value={newCount}
              onChange={(e) => { setNewCount(e.target.value); setErrorMsg(''); }}
              placeholder="0"
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-[16px] p-4 text-center text-3xl font-black text-gray-900 focus:outline-none focus:border-teal-500 focus:bg-white transition-all placeholder:text-gray-300"
            />
            <button 
              onClick={handleSubmitShelf}
              disabled={submitLoading || !newCount || !shelfCode}
              className="w-full bg-teal-600 text-white py-4 rounded-[16px] shadow-md hover:bg-teal-700 transition-all disabled:opacity-50 text-sm font-black flex items-center justify-center gap-2"
            >
              {submitLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>ثبت شمارش</>
              )}
            </button>
          </div>
        </div>

        {/* History of this session */}
        {history.length > 0 && (
          <div className="flex flex-col gap-3 mt-4">
            <h3 className="text-xs font-black text-gray-400 flex items-center gap-2 px-2">
              <History size={14} />
              قفسه‌های شمارش شده برای این کالا
            </h3>
            <div className="flex flex-col gap-2">
              {history.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-[16px] border border-gray-100 relative overflow-hidden">
                  {item.offline && <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400"></div>}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-50 rounded-[10px] flex items-center justify-center text-green-500 shrink-0">
                      <Check size={16} strokeWidth={3} />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-xs font-bold text-gray-800 tracking-widest uppercase">{item.shelf}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                    <span className="text-sm font-black text-gray-800">{item.count}</span>
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

export default function ItemCountingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">در حال بارگذاری...</div>}>
      <ItemCountingContent />
    </Suspense>
  );
}
