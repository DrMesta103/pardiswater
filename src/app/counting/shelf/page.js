'use client';
import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { Lock, Unlock, ScanLine, Search, Check, Box, Layers, AlertCircle, X, History } from 'lucide-react';
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

  const [productCode, setProductCode] = useState('');
  const [productName, setProductName] = useState('');
  const [oldCount, setOldCount] = useState(null);
  const [newCount, setNewCount] = useState('');
  
  const [itemLoading, setItemLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [camError, setCamError] = useState('');

  const [history, setHistory] = useState([]);
  
  const inputRef = useRef(null);

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
    } catch (e) {} finally { setLoading(false); }
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
      setErrorMsg('لطفاً کد کالا را وارد کنید');
      return;
    }
    
    setErrorMsg('');
    setItemLoading(true);
    setProductName('');
    setOldCount(null);
    setNewCount('');
    setProductCode(code);
    
    try {
      const nameRes = await fetch('/api/hesabfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, type: 'name' })
      });
      const nameData = await nameRes.json();
      
      if (!nameData?.Result?.Name || nameData?.Result?.Name === 'نامشخص' || nameData.error) {
        setErrorMsg(`کالایی با کد ${code} در حسابفا یافت نشد.`);
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
      
      if (inputRef.current) {
        setTimeout(() => inputRef.current.focus(), 100);
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('خطا در ارتباط با حسابفا. لطفاً دوباره تلاش کنید.');
    } finally {
      setItemLoading(false);
    }
  };

  const handleProductCodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      fetchItemData();
    }
  };

  const handleScan = (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const scannedValue = detectedCodes[0].rawValue;
      // We DO NOT turn off the camera. Just fetch!
      setCamError('');
      if (scannedValue !== productCode) {
        fetchItemData(scannedValue);
      }
    }
  };

  const handleError = (error) => {
    const msg = error?.message || error?.name || '';
    if (msg.includes('Requested device not found')) setCamError('دوربینی یافت نشد.');
    else setCamError('خطا در دسترسی به دوربین.');
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
      product_id: String(productCode),
      product_name: productName,
      warehouse: Number(warehouse),
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
        setErrorMsg('خطا در ثبت شمارش در سرور');
      }
    } catch (err) {
      await saveCountOffline(payload);
      alert('ارتباط با سرور قطع است. شمارش ذخیره شد و پس از اتصال ارسال می‌شود.');
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

  const handleCancelShelf = async () => {
    const reason = window.prompt('لطفاً دلیل لغو انبارگردانی این قفسه را وارد کنید:');
    if (!reason) return;
    
    try {
      await fetch('/api/counting/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shelfCode, warehouse, userId: user?.id, reason, mode: 'SHELF' })
      });
      router.push('/dashboard');
    } catch (error) {
      alert('خطا در لغو انبارگردانی');
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
      
      {/* Top Fixed Info Bar */}
      <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-[14px] flex items-center justify-center font-black">
            {shelfCode}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold tracking-wider">قفسه جاری</span>
            <span className="text-xs font-black text-gray-800">آماده اسکن کالای بعدی</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleCancelShelf}
            className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-[14px] transition-colors"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
          <button 
            onClick={handleFinishShelf}
            className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-black py-2.5 px-4 rounded-[14px] transition-colors flex items-center gap-2"
          >
            <Check size={14} strokeWidth={3} />
            پایان قفسه
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-5 max-w-md mx-auto w-full mt-2">
        
        {/* Continuous Scanner Area */}
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
                <div className="absolute inset-0 pointer-events-none border-[3px] border-indigo-500/30 m-4 rounded-[16px]">
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
              value={productCode}
              onChange={(e) => { setProductCode(e.target.value); setErrorMsg(''); setProductName(''); }}
              onKeyDown={handleProductCodeKeyDown}
              placeholder="یا بارکد را اینجا تایپ کنید..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-[14px] px-4 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:border-indigo-500 text-center placeholder:font-normal"
            />
            <button 
              onClick={() => fetchItemData()}
              disabled={itemLoading || !productCode}
              className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-[14px] flex items-center justify-center shrink-0 hover:bg-indigo-100 transition-colors border border-indigo-100 disabled:opacity-50"
            >
              {itemLoading ? <div className="w-4 h-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div> : <Search size={18} strokeWidth={2.5} />}
            </button>
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

        {/* Product Details & Count input (only shown if valid product found) */}
        <AnimatePresence>
          {productName && !itemLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-indigo-50 flex flex-col gap-4 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full -z-0"></div>
              
              <div className="flex justify-between items-start relative z-10">
                <div className="flex flex-col gap-1">
                  <h3 className="font-black text-gray-800 text-lg leading-tight">{productName}</h3>
                  <p className="text-xs text-gray-400 font-bold tracking-wider">کد حسابفا: {productCode}</p>
                </div>
                {!isBlind && oldCount !== null && (
                  <div className="bg-indigo-50 text-indigo-600 px-3 py-2 rounded-xl flex flex-col items-center shadow-sm shrink-0 ml-1 border border-indigo-100">
                    <span className="text-sm font-black">{oldCount}</span>
                    <span className="text-[9px] font-bold opacity-70">موجودی سیستم</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 relative z-10 mt-2">
                <input 
                  ref={inputRef}
                  type="number" 
                  dir="ltr"
                  value={newCount}
                  onChange={(e) => { setNewCount(e.target.value); setErrorMsg(''); }}
                  placeholder="0"
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-[16px] p-4 text-center text-3xl font-black text-gray-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-gray-300"
                />
                <button 
                  onClick={handleSubmitItem}
                  disabled={submitLoading || !newCount}
                  className="w-full bg-indigo-600 text-white py-4 rounded-[16px] shadow-md hover:bg-indigo-700 transition-all disabled:opacity-50 text-sm font-black flex items-center justify-center gap-2"
                >
                  {submitLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>ثبت موجودی</>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History of this session */}
        {history.length > 0 && (
          <div className="flex flex-col gap-3 mt-4">
            <h3 className="text-xs font-black text-gray-400 flex items-center gap-2 px-2">
              <History size={14} />
              تاریخچه شمارش‌های شما در این قفسه
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
                      <p className="text-xs font-bold text-gray-800 line-clamp-1">{item.name}</p>
                      <p className="text-[9px] font-bold text-gray-400 mt-0.5">کد: {item.code}</p>
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

export default function ShelfCountingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">در حال بارگذاری...</div>}>
      <ShelfCountingContent />
    </Suspense>
  );
}
