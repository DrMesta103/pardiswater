'use client';
import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { Lock, Unlock, ScanLine, Search, PlusCircle, Check, Box } from 'lucide-react';
import { hasRole } from '@/lib/auth';
import { saveCountOffline, syncOfflineCounts } from '@/lib/offlineSync';

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

  // History of scanned items in this session
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    fetchSettings();

    // Attempt to sync offline counts when page loads and we're online
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

  const fetchItemData = async (code) => {
    if (!code) return;
    setItemLoading(true);
    setProductName('');
    setOldCount(null);
    try {
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
    } catch (error) {
      console.error(error);
      setProductName('خطا در دریافت اطلاعات');
    } finally {
      setItemLoading(false);
    }
  };

  const handleProductCodeChange = (e) => {
    const code = e.target.value;
    setProductCode(code);
  };

  const handleProductCodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      fetchItemData(productCode);
    }
  };

  const handleSubmitItem = async () => {
    if (newCount === '' || newCount === null) {
      alert('لطفاً تعداد را وارد کنید');
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
      } else {
        alert('خطا در ثبت کالا');
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
    } finally {
      setSubmitLoading(false);
    }
  };

  const isBlind = settings?.blind_counting && !hasRole(user?.roles, ['ADMIN', 'SUPERVISOR']);

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24">
      <Header title="انبارگردانی قفسه" showBack={true} />
      
      {/* Top Banner */}
      <div className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div>
          <p className="text-xs text-indigo-200 font-medium mb-1">شما در حال شمارش هستید</p>
          <div className="flex items-center gap-2">
            <Lock size={18} />
            <h2 className="text-xl font-black">قفسه {shelfCode}</h2>
          </div>
        </div>
        <button 
          onClick={handleFinishShelf}
          className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold py-2 px-4 rounded-xl transition-colors flex items-center gap-2 backdrop-blur-sm"
        >
          <Unlock size={14} />
          خروج و پایان
        </button>
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-md mx-auto w-full flex flex-col gap-6">
        
        {/* Scanner Input */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex flex-col gap-4 relative z-10">
          <div className="flex items-center gap-2 mb-2 text-indigo-600">
            <ScanLine size={18} />
            <span className="text-sm font-bold text-gray-800">اسکن کالای جدید در این قفسه</span>
          </div>
          
          <div className="flex gap-2">
            <input 
              type="number" 
              dir="ltr"
              value={productCode}
              onChange={handleProductCodeChange}
              onKeyDown={handleProductCodeKeyDown}
              placeholder="بارکد کالا..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-[16px] px-4 py-3 text-lg font-bold text-gray-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-center"
            />
            <button 
              onClick={() => fetchItemData(productCode)}
              className="bg-indigo-50 text-indigo-600 p-3 rounded-[16px] flex items-center justify-center hover:bg-indigo-100 transition-colors"
            >
              <Search size={20} strokeWidth={2.5} />
            </button>
          </div>

          {itemLoading && (
            <div className="text-center py-4 text-xs font-bold text-indigo-500 animate-pulse">
              در حال استعلام از حسابفا...
            </div>
          )}

          {productName && !itemLoading && (
            <div className="mt-2 pt-4 border-t border-gray-100 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">{productName}</h3>
                  <p className="text-xs text-gray-400 mt-1">کد: {productCode}</p>
                </div>
                {!isBlind && oldCount !== null && (
                  <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg flex flex-col items-center">
                    <span className="text-sm font-black">{oldCount}</span>
                    <span className="text-[10px] font-bold">سیستم</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  dir="ltr"
                  value={newCount}
                  onChange={(e) => setNewCount(e.target.value)}
                  placeholder="تعداد شمارش شده..."
                  className="flex-1 border-2 border-gray-200 bg-white rounded-[16px] p-3 text-center text-xl font-black text-gray-800 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-sm placeholder:font-medium placeholder:text-gray-300"
                />
                <button 
                  onClick={handleSubmitItem}
                  disabled={submitLoading || !newCount}
                  className="bg-gray-900 text-white p-4 rounded-[16px] shadow-md hover:bg-gray-800 transition-all disabled:opacity-50"
                >
                  {submitLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Check size={24} />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* History of this session */}
        {history.length > 0 && (
          <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 mb-4 px-2">کالاهای ثبت شده در این قفسه</h3>
            <div className="flex flex-col gap-3">
              {history.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-[16px] border border-gray-100 relative overflow-hidden">
                  {item.offline && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400"></div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-gray-400 border border-gray-200">
                      <Box size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800 line-clamp-1">{item.name}</p>
                      <p className="text-[10px] font-medium text-gray-400">{item.code} {item.offline && <span className="text-yellow-600 ml-1">(آفلاین)</span>}</p>
                    </div>
                  </div>
                  <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-sm font-black shadow-sm">
                    {item.count}
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
