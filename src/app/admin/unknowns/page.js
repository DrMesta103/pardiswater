'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Box, MapPin, Search, AlertCircle, Loader2 } from 'lucide-react';

export default function UnknownsReportPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUnknowns();
  }, []);

  const fetchUnknowns = async () => {
    try {
      const res = await fetch('/api/reports/unknowns');
      if (res.ok) {
        const json = await res.json();
        setData(json.unknowns || []);
      } else {
        setError('خطا در دریافت اطلاعات');
      }
    } catch (e) {
      setError('خطای شبکه');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(item => 
    item.product_name.includes(searchQuery) || 
    item.shelfCode.includes(searchQuery.toUpperCase())
  );

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-20">
      <Header title="کالاهای ناشناس (فاقد بارکد)" showBack={true} />
      
      <div className="p-4 md:p-6 flex flex-col gap-5 max-w-4xl mx-auto w-full mt-2">
        
        {/* Top Info Banner */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-amber-100 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
            <AlertCircle size={24} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-black text-gray-800">گزارش اقلام ناشناس</h2>
            <p className="text-xs text-gray-500 font-bold leading-relaxed">
              لیست زیر شامل کالاهایی است که توسط انبارگردان در قفسه‌ها رویت شده اما فاقد بارکد بوده‌اند. 
              لطفاً جهت اصلاح و الصاق بارکد بررسی‌های لازم را انجام دهید.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
            <Search size={18} strokeWidth={2.5} />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در مشخصات یا نام قفسه..."
            className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pr-11 pl-4 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
            <span className="text-sm font-bold">در حال بارگذاری اطلاعات...</span>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500 font-bold text-sm bg-red-50 rounded-2xl">
            {error}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-bold text-sm flex flex-col items-center gap-3 bg-white rounded-3xl border border-dashed border-gray-200">
            <Box size={48} className="opacity-20" />
            هیچ کالای ناشناسی یافت نشد!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredData.map(item => (
              <div key={item.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col gap-3 relative overflow-hidden group hover:border-indigo-100 transition-colors">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
                
                <div className="flex justify-between items-start pl-2 pr-1">
                  <div className="flex flex-col pr-1 gap-1">
                    <span className="text-[10px] text-gray-400 font-black tracking-wider bg-gray-50 px-2 py-0.5 rounded-md w-max">
                      تاریخ: {new Date(item.created_at).toLocaleDateString('fa-IR')}
                    </span>
                    <h3 className="text-sm font-bold text-gray-800 leading-snug">
                      {item.product_name.replace('ناشناس:', '')}
                    </h3>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl text-center shrink-0">
                    <span className="block text-[10px] text-gray-400 font-bold mb-0.5">تعداد</span>
                    <span className="block text-sm font-black text-gray-800">{item.new_count}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-gray-50/50 p-3 rounded-xl border border-gray-50 mt-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                    <MapPin size={14} className="text-indigo-400" />
                    <span>قفسه: <strong className="text-gray-900 tracking-wider ml-1">{item.shelfCode}</strong> (انبار {item.warehouse_id})</span>
                  </div>
                  <div className="w-[1px] h-3 bg-gray-200"></div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
                    <span>ثبت‌کننده:</span>
                    <strong className="text-gray-800">{item.user?.name || item.user?.username || 'نامشخص'}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
