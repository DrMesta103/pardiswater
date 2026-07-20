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
  
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [isUnknownModalOpen, setIsUnknownModalOpen] = useState(false);
  const [unknownDesc, setUnknownDesc] = useState('');
  const [unknownQty, setUnknownQty] = useState('');

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

  const [otherShelves, setOtherShelves] = useState([]);

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
    setOtherShelves([]);
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

      // Fetch other shelves where this product was counted
      fetch(`/api/counting/product-locations?product_id=${code}&warehouse=${warehouse}&current_shelf=${shelfCode}`)
        .then(res => res.json())
        .then(locData => {
          if (locData.shelves && locData.shelves.length > 0) {
            setOtherShelves(locData.shelves);
          }
        })
        .catch(() => {});
      
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

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const res = await fetch('/api/hesabfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'search', query: searchQuery })
      });
      const data = await res.json();
      setSearchResults(data.Result || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (item) => {
    setProductCode(item.Code.toString());
    setIsSearchModalOpen(false);
    fetchItemData(item.Code.toString());
  };

  const submitUnknown = async () => {
    if (!unknownDesc || !unknownQty) {
      alert('لطفاً مشخصات ظاهری و تعداد را وارد کنید');
      return;
    }
    setSubmitLoading(true);
    const generatedCode = `UNKNOWN_${Date.now()}`;
    const payload = {
      product_id: generatedCode,
      product_name: `ناشناس: ${unknownDesc}`,
      warehouse: Number(warehouse),
      shelfCode: shelfCode.toUpperCase(),
      old_count: 0,
      new_count: Number(unknownQty),
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
        setHistory([{ code: generatedCode, name: `ناشناس: ${unknownDesc}`, count: unknownQty }, ...history]);
        setIsUnknownModalOpen(false);
        setUnknownDesc('');
        setUnknownQty('');
      } else {
        alert('خطا در ثبت کالای ناشناس');
      }
    } catch (err) {
      await saveCountOffline(payload);
      setHistory([{ code: generatedCode, name: `ناشناس: ${unknownDesc}`, count: unknownQty, offline: true }, ...history]);
      setIsUnknownModalOpen(false);
      setUnknownDesc('');
      setUnknownQty('');
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
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24 relative">
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
          
          <div className="grid grid-cols-2 gap-2 mt-3 px-2 pb-2">
            <button 
              onClick={() => setIsSearchModalOpen(true)}
              className="bg-indigo-50 text-indigo-600 rounded-[14px] py-3 text-xs font-bold flex flex-col items-center justify-center gap-1 hover:bg-indigo-100 transition-colors border border-indigo-100"
            >
              <Search size={18} strokeWidth={2.5} />
              ورود دستی / جستجو
            </button>
            <button 
              onClick={() => setIsUnknownModalOpen(true)}
              className="bg-amber-50 text-amber-600 rounded-[14px] py-3 text-xs font-bold flex flex-col items-center justify-center gap-1 hover:bg-amber-100 transition-colors border border-amber-100"
            >
              <AlertCircle size={18} strokeWidth={2.5} />
              ثبت کالای ناشناخته
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

              {otherShelves.length > 0 && (
                <div className="bg-orange-50 border border-orange-100 rounded-[12px] p-3 text-xs font-bold text-orange-600 flex items-start gap-2 relative z-10">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>
                    توجه: این کالا قبلاً در قفسه‌های <strong className="bg-orange-200/50 px-1 rounded mx-1" dir="ltr">{otherShelves.join('، ')}</strong> نیز شمارش شده است.
                  </span>
                </div>
              )}

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

      {/* Search Modal */}
      <AnimatePresence>
        {isSearchModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setIsSearchModalOpen(false)}
          >
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-[32px] p-6 shadow-2xl flex flex-col gap-5 max-h-[85vh]"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-black text-gray-800 text-lg">جستجوی کالا</h3>
                <button onClick={() => setIsSearchModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="نام یا کد کالا را تایپ کنید..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-[16px] px-4 py-3 text-sm font-bold focus:outline-none focus:border-indigo-500"
                />
                <button 
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="w-12 h-12 bg-indigo-600 text-white rounded-[16px] flex items-center justify-center shrink-0"
                >
                  {isSearching ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Search size={20} />}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
                {searchResults.map(item => (
                  <div key={item.Code} onClick={() => selectSearchResult(item)} className="bg-gray-50 border border-gray-100 p-3 rounded-[16px] flex flex-col gap-1 cursor-pointer hover:bg-indigo-50 transition-colors">
                    <span className="font-bold text-gray-800 text-sm">{item.Name}</span>
                    <span className="text-[10px] text-gray-400 font-bold">کد: {item.Code} | موجودی کل: {item.Stock}</span>
                  </div>
                ))}
                {searchResults.length === 0 && !isSearching && searchQuery && (
                  <div className="text-center py-6 text-gray-400 text-sm font-bold">کالایی یافت نشد.</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unknown Item Modal */}
      <AnimatePresence>
        {isUnknownModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setIsUnknownModalOpen(false)}
          >
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-[32px] p-6 shadow-2xl flex flex-col gap-5"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle size={24} strokeWidth={2.5} />
                  <h3 className="font-black text-gray-800 text-lg">ثبت کالای ناشناس</h3>
                </div>
                <button onClick={() => setIsUnknownModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex flex-col gap-4">
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  اگر کالا بارکد ندارد و در جستجو هم یافت نشد، مشخصات ظاهری آن را اینجا بنویسید تا ادمین بعداً آن را بررسی کند.
                </p>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">مشخصات ظاهری (رنگ، جنس، شکل و...)</label>
                  <textarea 
                    value={unknownDesc}
                    onChange={(e) => setUnknownDesc(e.target.value)}
                    placeholder="مثال: قطعه فلزی استوانه‌ای آبی رنگ"
                    className="w-full bg-gray-50 border border-gray-200 rounded-[16px] px-4 py-3 text-sm font-bold focus:outline-none focus:border-amber-500 min-h-[100px]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">تعداد شمارش شده</label>
                  <input 
                    type="number" 
                    dir="ltr"
                    value={unknownQty}
                    onChange={(e) => setUnknownQty(e.target.value)}
                    placeholder="0"
                    className="w-full bg-gray-50 border border-gray-200 rounded-[16px] px-4 py-3 text-base text-center font-black focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button 
                onClick={submitUnknown}
                disabled={submitLoading || !unknownDesc || !unknownQty}
                className="w-full bg-amber-500 text-white py-4 rounded-[16px] text-sm font-black shadow-md hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'ثبت و ارسال به ادمین'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
