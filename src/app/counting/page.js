'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';

function CountingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const warehouse = searchParams.get('warehouse');

  const [productName, setProductName] = useState('');
  const [oldCount, setOldCount] = useState(null);
  const [newCount, setNewCount] = useState('');
  const [shelf, setShelf] = useState('');
  const [lastCount, setLastCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    if (code && warehouse) {
      fetchData();
    }
  }, [code, warehouse]);

  const fetchData = async () => {
    try {
      // Fetch Product Name
      const nameRes = await fetch('/api/hesabfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, type: 'name' })
      });
      const nameData = await nameRes.json();
      setProductName(nameData?.Result?.Name || 'نامشخص');

      // Fetch Product Quantity
      const qRes = await fetch('/api/hesabfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, type: 'quantity' })
      });
      const qData = await qRes.json();
      const productInfo = qData?.Result?.[0];
      const wInfo = productInfo?.Warehouse?.find(w => w.Code === Number(warehouse));
      setOldCount(wInfo?.Quantity ?? 0);

      // Fetch Last Count
      const lastRes = await fetch(`/api/counting?product_id=${code}&warehouse=${warehouse}`);
      const lastData = await lastRes.json();
      if (lastData.message !== -1) {
        setLastCount(lastData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (isConfirm) => {
    const finalCount = isConfirm ? oldCount : newCount;
    if (finalCount === '' || finalCount === null) {
      alert('لطفا تعداد را وارد کنید.');
      return;
    }

    try {
      const res = await fetch('/api/counting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: code,
          product_name: productName,
          warehouse,
          shelfCode: shelf.toUpperCase(),
          old_count: oldCount,
          new_count: finalCount,
          user_id: user?.id
        })
      });

      if (res.ok) {
        alert('شمارش با موفقیت ثبت شد!');
        router.push('/dashboard');
      } else {
        alert('خطا در ثبت شمارش');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col">
      <Header title="ثبت شمارش" showBack={true} />
      
      <div className="p-4 flex flex-col gap-4">
        {loading ? (
          <div className="text-center p-10 animate-pulse">در حال دریافت اطلاعات...</div>
        ) : (
          <>
            <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">کد: {code}</span>
                  <span className="font-bold">{productName}</span>
                </div>
                <div className="bg-gray-100 p-2 rounded flex flex-col items-center">
                  <span className="font-bold text-lg">{oldCount}</span>
                  <span className="text-xs text-gray-500">موجودی سیستم</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg shadow text-sm border border-gray-200">
              <span className="font-bold">آخرین شمارش: </span>
              {lastCount ? (
                <span>{lastCount.new_count} عدد (توسط کاربر {lastCount.user_id})</span>
              ) : (
                <span className="text-gray-500">ندارد</span>
              )}
            </div>

            <div className="flex flex-col bg-white p-4 rounded-lg shadow gap-3">
              <label className="text-sm font-bold">اطلاعات فیزیکی</label>
              
              <input 
                type="text" 
                dir="ltr"
                placeholder="قفسه (مثال: C2F2)" 
                value={shelf}
                onChange={(e) => setShelf(e.target.value)}
                className="w-full border rounded p-2 text-center uppercase"
              />
              
              <input 
                type="number" 
                dir="ltr"
                placeholder="تعداد شمارش شده" 
                value={newCount}
                onChange={(e) => setNewCount(e.target.value)}
                className="w-full border-2 border-purple-200 focus:border-purple-500 rounded p-4 text-center text-2xl font-bold"
              />
            </div>

            <div className="flex gap-2 mt-2">
              <button 
                onClick={() => handleSubmit(true)}
                className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded shadow"
              >
                تایید موجودی سیستم
              </button>
            </div>
            
            <button 
              onClick={() => handleSubmit(false)}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded shadow mt-2"
            >
              ثبت مغایرت / موجودی جدید
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function CountingPage() {
  return (
    <Suspense fallback={<div>در حال بارگذاری...</div>}>
      <CountingContent />
    </Suspense>
  );
}
