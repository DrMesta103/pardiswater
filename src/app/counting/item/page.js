'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { Box, Layers, CheckCircle2 } from 'lucide-react';
import { hasRole } from '@/lib/auth';
import { saveCountOffline, syncOfflineCounts } from '@/lib/offlineSync';

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

  const handleSubmit = async () => {
    if (!shelfCode) return alert('کد قفسه را وارد کنید');
    if (newCount === '' || newCount === null) return alert('تعداد را وارد کنید');
    
    setSubmitLoading(true);
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
      } else {
        alert('خطا در ثبت شمارش');
      }
    } catch (err) {
      await saveCountOffline(payload);
      alert('ارتباط با سرور قطع است. اطلاعات در گوشی شما ذخیره شد و بعداً ارسال می‌شود.');
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
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-pulse font-bold text-gray-500">در حال دریافت اطلاعات...</div></div>;
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24">
      <Header title="انبارگردانی کالا" showBack={true} />
      
      {/* Top Banner */}
      <div className="bg-gray-900 text-white px-6 py-4 shadow-md flex items-center gap-3">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
          <Box size={20} />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold leading-tight">{productName}</h2>
          <p className="text-xs text-gray-400 mt-1 font-medium tracking-wider">کد: {code}</p>
        </div>
        {!isBlind && oldCount !== null && (
          <div className="bg-white/10 px-3 py-2 rounded-xl flex flex-col items-center">
            <span className="text-sm font-black">{oldCount}</span>
            <span className="text-[10px] text-gray-300">سیستم</span>
          </div>
        )}
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-md mx-auto w-full flex flex-col gap-6">
        
        {/* Input Form */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-gray-800 mb-2">ثبت شمارش در قفسه</h3>
          
          <div className="flex flex-col gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Layers size={16} className="text-gray-400" />
              </div>
              <input 
                type="text" 
                dir="ltr"
                value={shelfCode}
                onChange={(e) => setShelfCode(e.target.value)}
                placeholder="کد قفسه (مثال A-1)..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-[16px] text-center text-sm font-bold text-gray-800 uppercase focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100 transition-all"
              />
            </div>
            
            <input 
              type="number" 
              dir="ltr"
              value={newCount}
              onChange={(e) => setNewCount(e.target.value)}
              placeholder="تعداد یافت شده در این قفسه"
              className="w-full border-2 border-gray-200 bg-white rounded-[16px] p-4 text-center text-xl font-black text-gray-800 focus:outline-none focus:border-gray-900 focus:ring-4 focus:ring-gray-100 transition-all placeholder:text-sm placeholder:font-medium placeholder:text-gray-300"
            />
            
            <button 
              onClick={handleSubmit}
              disabled={submitLoading || !newCount || !shelfCode}
              className="w-full bg-gray-900 text-white p-4 rounded-[16px] shadow-md hover:bg-gray-800 transition-all disabled:opacity-50 text-sm font-bold flex items-center justify-center gap-2"
            >
              {submitLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  ثبت رکورد
                </>
              )}
            </button>
          </div>
        </div>

        {/* History of this item in different shelves */}
        {history.length > 0 && (
          <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 mb-4 px-2">مکان‌های یافت شده</h3>
            <div className="flex flex-col gap-3">
              {history.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-[16px] border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-gray-400" />
                    <span className="text-sm font-bold text-gray-800">قفسه {item.shelf}</span>
                  </div>
                  <div className="bg-gray-200 text-gray-800 px-3 py-1 rounded-lg text-sm font-black shadow-sm">
                    {item.count} عدد
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <button 
          onClick={handleFinish}
          className="w-full py-4 bg-white border-2 border-gray-200 text-gray-700 text-sm font-extrabold rounded-[20px] transition-all hover:bg-gray-50 mt-4"
        >
          پایان شمارش این کالا
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
