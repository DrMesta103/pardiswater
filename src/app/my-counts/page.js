'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';

export default function MyCountsPage() {
  const [counts, setCounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyCounts = async () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        try {
          const res = await fetch(`/api/counting?user_id=${user.id}`);
          if (res.ok) setCounts(await res.json());
        } catch (e) {
          console.error(e);
        }
      }
      setLoading(false);
    };
    fetchMyCounts();
  }, []);

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-20">
      <Header title="شمارش های من" showBack={true} />
      
      <div className="p-4 flex flex-col gap-4">
        {loading ? (
          <div className="text-center p-10">در حال دریافت...</div>
        ) : counts.length === 0 ? (
          <div className="text-center text-gray-500 p-10">هنوز شمارشی ثبت نکرده‌اید.</div>
        ) : (
          counts.map(count => (
            <div key={count.id} className="bg-white p-4 rounded shadow border border-gray-200">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="font-bold text-sm">{count.product_name}</span>
                  <span className="text-xs text-gray-500 mt-1">کد: {count.product_id} | انبار: {count.warehouse}</span>
                  <span className="text-xs text-gray-500 mt-1">قفسه: {count.shelf || 'ثبت نشده'}</span>
                </div>
                <div className="flex flex-col items-center bg-gray-100 p-2 rounded">
                  <span className="font-bold">{count.new_count}</span>
                  <span className="text-[10px]">شمارش شما</span>
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
