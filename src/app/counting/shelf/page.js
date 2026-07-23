'use client';
import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { ScanLine, Search, Check, Box, Layers, AlertCircle, X, History, Trash2, Edit, Plus, Minus, MoreVertical } from 'lucide-react';
import { hasRole } from '@/lib/auth';
import { saveCountOffline, syncOfflineCounts } from '@/lib/offlineSync';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';

import ZoomableScanner from '@/components/ZoomableScanner';

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

  // New states
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  
  const [isCountModalOpen, setIsCountModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  
  const [activeActionId, setActiveActionId] = useState(null);
  const [tooltipId, setTooltipId] = useState(null);

  const inputRef = useRef(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      if (shelfCode && warehouse) {
        fetchHistory(parsedUser.id);
      }
    }
    fetchSettings();

    window.addEventListener('online', syncOfflineCounts);
    return () => window.removeEventListener('online', syncOfflineCounts);
  }, [shelfCode, warehouse]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) setSettings(await res.json());
    } catch (e) {} finally { setLoading(false); }
  };

  const fetchHistory = async (userId) => {
    try {
      const res = await fetch(`/api/counting/history?shelfCode=${shelfCode}&warehouse=${warehouse}&userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch(e) {}
  };

  const handleFinishShelf = async () => {
    try {
      const res = await fetch('/api/counting/end-shelf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shelfCode, warehouse, userId: user?.id })
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (data.punished) {
          alert('🚫 اخطار سیستم:\n\n' + data.error);
          router.push('/dashboard');
          return;
        }
        alert(data.error || 'خطا در پایان قفسه');
        return;
      }
      
      router.push('/dashboard?success=shelf');
    } catch (error) {
      alert('خطای شبکه در ارتباط با سرور');
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancelReason) {
      alert('لطفاً دلیل لغو را وارد کنید');
      return;
    }
    try {
      await fetch('/api/counting/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shelfCode, warehouse, userId: user?.id, reason: cancelReason, mode: 'SHELF' })
      });
      router.push('/dashboard');
    } catch (error) {
      alert('خطا در لغو انبارگردانی');
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
    setProductCode(code);
    
    try {
      const nameRes = await fetch('/api/hesabfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, type: 'name' })
      });
      const nameData = await nameRes.json();
      
      if (!nameData?.Result?.Name || nameData?.Result?.Name === 'نامشخص' || nameData.error) {
        setErrorMsg(`کالایی با کد ${code} یافت نشد.`);
        setItemLoading(false);
        return;
      }
      
      const foundName = nameData.Result.Name;
      setProductName(foundName);

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

      // Check history for existing count
      // Need to use state updater to ensure latest history
      setHistory(prevHistory => {
        const existing = prevHistory.find(h => h.code === code);
        if (existing) {
          setNewCount((Number(existing.count) + 1).toString());
          setEditingItemId(existing.id);
        } else {
          setNewCount('');
          setEditingItemId(null);
        }
        return prevHistory;
      });

      setIsCountModalOpen(true);
      
    } catch (error) {
      console.error(error);
      setErrorMsg('خطا در ارتباط با سرور.');
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
      setCamError('');
      if (scannedValue !== productCode || !isCountModalOpen) {
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
    if (newCount === '' || newCount === null) {
      alert('لطفاً تعداد را وارد کنید');
      return;
    }
    
    setSubmitLoading(true);
    
    if (editingItemId) {
      // It's an update
      try {
        const res = await fetch('/api/counting', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingItemId, new_count: Number(newCount) })
        });
        if (res.ok) {
          setHistory(prev => prev.map(h => h.id === editingItemId ? { ...h, count: newCount } : h));
          setIsCountModalOpen(false);
          setProductCode('');
          setProductName('');
        } else {
          alert('خطا در ویرایش شمارش');
        }
      } catch(e) {
        alert('خطای شبکه');
      } finally {
        setSubmitLoading(false);
      }
      return;
    }

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
        const data = await res.json();
        setHistory([{ id: data.count.id, code: productCode, name: productName, count: newCount }, ...history]);
        setIsCountModalOpen(false);
        setProductCode('');
        setProductName('');
      } else {
        alert('خطا در ثبت شمارش');
      }
    } catch (err) {
      await saveCountOffline(payload);
      setHistory([{ code: productCode, name: productName, count: newCount, offline: true }, ...history]);
      setIsCountModalOpen(false);
      setProductCode('');
      setProductName('');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteHistory = async (item) => {
    if (!confirm(`آیا از حذف کالا ${item.name} اطمینان دارید؟`)) return;
    
    if (item.id) {
      try {
        const res = await fetch(`/api/counting?id=${item.id}`, { method: 'DELETE' });
        if (res.ok) {
          setHistory(prev => prev.filter(h => h.id !== item.id));
        } else {
          alert('خطا در حذف');
        }
      } catch(e) { alert('خطای شبکه'); }
    } else {
      // offline item
      setHistory(prev => prev.filter(h => h.code !== item.code));
    }
  };

  const handleEditHistory = (item) => {
    setProductCode(item.code);
    setProductName(item.name);
    setNewCount(item.count.toString());
    setEditingItemId(item.id || null);
    setIsCountModalOpen(true);
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
        const data = await res.json();
        setHistory([{ id: data.count.id, code: generatedCode, name: `ناشناس: ${unknownDesc}`, count: unknownQty }, ...history]);
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

  // Touch handlers for count input
  const lastTouchY = useRef(0);
  const accumulatedDelta = useRef(0);

  const handleTouchStart = (e) => { 
    lastTouchY.current = e.touches[0].clientY; 
    accumulatedDelta.current = 0;
  };
  
  const handleTouchMove = (e) => {
    const currentY = e.touches[0].clientY;
    const delta = lastTouchY.current - currentY; // positive = swipe up
    lastTouchY.current = currentY;
    
    accumulatedDelta.current += delta;
    
    if (accumulatedDelta.current > 35) { // Threshold 35px
      setNewCount(prev => String(Number(prev || 0) + 1));
      accumulatedDelta.current -= 35; 
    } else if (accumulatedDelta.current < -35) {
      setNewCount(prev => String(Math.max(0, Number(prev || 0) - 1)));
      accumulatedDelta.current += 35;
    }
  };

  const isBlind = settings?.blind_counting === 'true' && !hasRole(user?.roles, ['ADMIN', 'SUPERVISOR']);

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
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-[14px] flex items-center justify-center font-black uppercase text-sm">
            {shelfCode.substring(0, 2)}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold tracking-wider">قفسه فعال در انبار {warehouse}</span>
            <span className="text-sm font-black text-gray-800 uppercase tracking-widest">{shelfCode}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsCancelModalOpen(true)}
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
          <div className="w-full aspect-square relative flex items-center justify-center bg-gray-900 rounded-[20px] overflow-hidden">
            {camError ? (
              <div className="text-red-400 text-xs p-4 text-center font-medium">{camError}</div>
            ) : cameraEnabled ? (
              <>
                <div className="w-full h-full opacity-80 [&>div]:!object-cover [&>div>video]:!object-cover">
                  {(!isCountModalOpen && !isSearchModalOpen && !isUnknownModalOpen && !isCancelModalOpen) ? (
                    <ZoomableScanner onScan={handleScan} onError={handleError} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900 flex-col gap-2">
                      <ScanLine size={32} className="text-gray-700" />
                      <span className="text-xs font-bold text-gray-500">دوربین موقتاً متوقف شد</span>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 pointer-events-none border-[3px] border-indigo-500/30 m-6 rounded-[24px]">
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
          
          <div className="flex items-center gap-2 mt-3 px-2">
            <input 
              type="text" 
              dir="ltr"
              value={productCode}
              onChange={(e) => { setProductCode(e.target.value); setErrorMsg(''); }}
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

        {/* History of this session */}
        {history.length > 0 && (
          <div className="flex flex-col gap-3 mt-2">
            <h3 className="text-xs font-black text-gray-400 flex items-center gap-2 px-2">
              <History size={14} />
              تاریخچه شمارش در این قفسه
            </h3>
            <div className="flex flex-col gap-2">
              {history.map((item, idx) => {
                const uniqueId = item.id || item.code;
                return (
                  <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-[16px] border border-gray-100 relative overflow-hidden shadow-sm">
                    {item.offline && <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400"></div>}
                    
                    <div 
                      className="flex-1 flex flex-col overflow-hidden relative cursor-pointer"
                      onClick={() => setTooltipId(tooltipId === uniqueId ? null : uniqueId)}
                    >
                      <p className={`text-xs font-bold text-gray-800 ${tooltipId === uniqueId ? '' : 'line-clamp-1'}`}>{item.name}</p>
                      <p className="text-[9px] font-bold text-gray-400 mt-0.5">کد: {item.code}</p>
                      {tooltipId === uniqueId && (
                        <div className="absolute inset-0 bg-gray-900/95 text-white text-[10px] p-2 rounded-lg z-10 overflow-y-auto font-medium">
                          {item.name}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0 pr-2 pl-1 relative">
                      <span className="text-sm font-black text-gray-800 min-w-[24px] text-left">{item.count}</span>
                      
                      <button 
                        onClick={() => setActiveActionId(activeActionId === uniqueId ? null : uniqueId)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 bg-gray-50 rounded-[10px] hover:bg-gray-100 transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>

                      <AnimatePresence>
                        {activeActionId === uniqueId && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9, x: 10 }} 
                            animate={{ opacity: 1, scale: 1, x: 0 }} 
                            exit={{ opacity: 0, scale: 0.9, x: 10 }}
                            className="absolute left-10 top-0 bottom-0 bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.1)] rounded-[12px] flex items-center gap-1.5 px-2 border border-gray-100 z-20"
                          >
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleEditHistory(item); setActiveActionId(null); }} 
                              className="w-7 h-7 flex items-center justify-center text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit size={14} />
                            </button>
                            <div className="w-[1px] h-4 bg-gray-200"></div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteHistory(item); setActiveActionId(null); }} 
                              className="w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Count Modal (Auto opens on scan) */}
      <AnimatePresence>
        {isCountModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-gray-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setIsCountModalOpen(false)}
          >
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-[32px] p-6 shadow-2xl flex flex-col gap-5"
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <h3 className="font-black text-gray-800 text-lg leading-tight">{productName}</h3>
                  <span className="text-xs text-gray-400 font-bold mt-1">کد: {productCode}</span>
                </div>
                <button onClick={() => setIsCountModalOpen(false)} className="w-8 h-8 shrink-0 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200">
                  <X size={20} />
                </button>
              </div>

              {!isBlind && oldCount !== null && (
                <div className="bg-teal-50/50 rounded-2xl p-3 border border-teal-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-800">موجودی ثبت شده سیستم:</span>
                  <span className="text-base font-black text-teal-600">{oldCount}</span>
                </div>
              )}
              
              <div className="flex flex-col items-center gap-4 py-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{editingItemId ? 'ویرایش موجودی' : 'ثبت موجودی جدید'}</span>
                
                <div className="flex items-center gap-4 w-full justify-center">
                  <button 
                    onClick={() => setNewCount(String(Math.max(0, Number(newCount || 0) - 1)))}
                    className="w-14 h-14 bg-red-50 text-red-500 rounded-[20px] flex items-center justify-center hover:bg-red-100 active:scale-95 transition-all"
                  >
                    <Minus size={24} strokeWidth={3} />
                  </button>
                  
                  <div 
                    className="flex-1 max-w-[150px] relative"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                  >
                    <input 
                      type="number" 
                      dir="ltr"
                      value={newCount}
                      onChange={(e) => setNewCount(e.target.value)}
                      placeholder="0"
                      className="w-full bg-gray-50 border-2 border-indigo-100 rounded-[24px] py-4 text-center text-4xl font-black text-gray-900 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                    />
                    <div className="absolute top-2 right-2 text-gray-300 pointer-events-none text-[10px] font-bold">بکشید</div>
                  </div>

                  <button 
                    onClick={() => setNewCount(String(Number(newCount || 0) + 1))}
                    className="w-14 h-14 bg-green-50 text-green-500 rounded-[20px] flex items-center justify-center hover:bg-green-100 active:scale-95 transition-all"
                  >
                    <Plus size={24} strokeWidth={3} />
                  </button>
                </div>
              </div>

              <button 
                onClick={handleSubmitItem}
                disabled={submitLoading || newCount === ''}
                className="w-full bg-indigo-600 text-white py-4 rounded-[20px] text-sm font-black shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (editingItemId ? 'بروزرسانی' : 'تایید و ثبت')}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Modal */}
      <AnimatePresence>
        {isCancelModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setIsCancelModalOpen(false)}
          >
            <motion.div 
              initial={{ y: '100%', scale: 0.9 }} animate={{ y: 0, scale: 1 }} exit={{ y: '100%', scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl flex flex-col gap-4"
            >
              <div className="flex items-center gap-3 text-red-500 border-b border-gray-100 pb-3">
                <AlertCircle size={24} strokeWidth={2.5} />
                <h3 className="font-black text-gray-800 text-lg">لغو انبارگردانی</h3>
              </div>
              
              <p className="text-xs font-bold text-gray-500 leading-relaxed">
                در صورت انصراف، تمامی شمارش‌های انجام شده در این قفسه برای امروز لغو شده و وضعیت قفسه باز می‌گردد. لطفاً دلیل خود را بنویسید:
              </p>
              
              <textarea 
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="مثال: پایان شیفت کاری"
                className="w-full bg-gray-50 border border-gray-200 rounded-[16px] p-4 text-sm font-bold focus:outline-none focus:border-red-500 min-h-[100px] resize-none"
              />

              <div className="flex gap-3 mt-2">
                <button 
                  onClick={() => setIsCancelModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-[16px] text-xs font-black hover:bg-gray-200 transition-colors"
                >
                  بازگشت
                </button>
                <button 
                  onClick={handleCancelSubmit}
                  className="flex-1 bg-red-500 text-white py-3.5 rounded-[16px] text-xs font-black hover:bg-red-600 transition-colors shadow-md shadow-red-500/20"
                >
                  تایید لغو و خروج
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
