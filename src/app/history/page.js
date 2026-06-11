'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';

export default function HistoryPage() {
  const [counts, setCounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/counting`);
        if (res.ok) setCounts(await res.json());
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-20">
      <Header title="تاریخچه کل شمارش‌ها" showBack={true} />
      
      <div className="p-4 flex flex-col gap-4">
        {loading ? (
          <div className="text-center p-10">در حال دریافت...</div>
        ) : counts.length === 0 ? (
          <div className="text-center text-gray-500 p-10">تاریخچه خالی است.</div>
        ) : (
          counts.map(count => (
            <div key={count.id} className="bg-white p-4 rounded shadow border border-gray-200">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="font-bold text-sm">{count.product_name}</span>
                  <span className="text-xs text-gray-500 mt-1">شمارنده: {count.user?.name} | انبار: {count.warehouse}</span>
                  <span className="text-xs text-gray-500 mt-1">قفسه: {count.shelf || 'ثبت نشده'}</span>
                </div>
                <div className="flex flex-col items-center bg-green-50 p-2 rounded border border-green-200">
                  <span className="font-bold text-green-700">{count.new_count}</span>
                  <span className="text-[10px] text-green-600">موجودی ثبت شده</span>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-gray-400 text-left">
                {new Date(count.createdAt).toLocaleString('fa-IR')}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
