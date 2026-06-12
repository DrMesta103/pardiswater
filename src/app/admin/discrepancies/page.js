'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { AlertTriangle, CheckCircle, PackageSearch, RefreshCw, Send, ListTree, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function DiscrepancyDashboard() {
  const [warehouse, setWarehouse] = useState('11');
  const [warehouses, setWarehouses] = useState([]);
  const [data, setData] = useState({ discrepancies: [], accurate: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.warehouses) {
          setWarehouses(data.warehouses);
          if (data.warehouses.length > 0) {
            setWarehouse(data.warehouses[0].id);
          }
        }
      });
  }, []);

  useEffect(() => {
    if (warehouse) {
      fetchData();
    }
  }, [warehouse]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/discrepancies?warehouse=${warehouse}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRecount = async (productId, productName) => {
    // In a full system, this would call /api/tasks to assign a recount task
    alert(`تسک بازشماری برای کالا "${productName}" (کد: ${productId}) صادر شد.`);
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24">
      <Header title="داشبورد مغایرت‌گیری" showBack={true} />

      <div className="flex-1 px-4 md:px-8 pt-6 max-w-5xl mx-auto w-full flex flex-col gap-6">
        
        {/* Controls */}
        <div className="bg-white rounded-[24px] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <ListTree size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">انتخاب انبار</h2>
              <p className="text-xs text-gray-400">انبار مورد نظر برای بررسی مغایرت</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select 
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-indigo-500 flex-1 sm:w-48"
            >
              {warehouses.map(wh => (
                <option key={wh.id} value={wh.id}>{wh.name} ({wh.id})</option>
              ))}
            </select>
            <button onClick={fetchData} className="bg-gray-900 text-white p-3 rounded-xl hover:bg-gray-800 transition-colors">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-red-100 rounded-[24px] p-5 shadow-sm flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-[40px] flex items-center justify-center -mr-2 -mt-2">
              <AlertTriangle className="text-red-500" size={20} />
            </div>
            <p className="text-xs font-bold text-gray-500">کالاهای دارای مغایرت</p>
            <p className="text-3xl font-black text-red-600">{loading ? '-' : data.discrepancies.length}</p>
          </div>
          
          <div className="bg-white border border-green-100 rounded-[24px] p-5 shadow-sm flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-bl-[40px] flex items-center justify-center -mr-2 -mt-2">
              <CheckCircle className="text-green-500" size={20} />
            </div>
            <p className="text-xs font-bold text-gray-500">کالاهای بدون مغایرت</p>
            <p className="text-3xl font-black text-green-600">{loading ? '-' : data.accurate.length}</p>
          </div>
        </div>

        {/* Discrepancies List */}
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 flex items-center gap-2">
            <PackageSearch className="text-red-500" size={20} />
            <h3 className="font-bold text-gray-800">لیست کالا‌های مغایرت‌دار</h3>
          </div>

          <div className="p-0 overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-bold">
                <tr>
                  <th className="px-6 py-4">کالا</th>
                  <th className="px-6 py-4">موجودی سیستم</th>
                  <th className="px-6 py-4">شمارش شده</th>
                  <th className="px-6 py-4">مغایرت</th>
                  <th className="px-6 py-4">قفسه‌ها</th>
                  <th className="px-6 py-4 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.discrepancies.map((item, idx) => (
                  <tr key={idx} className="hover:bg-red-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-800">{item.product_name}</p>
                      <p className="text-[10px] text-gray-400">کد: {item.product_id}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-600">{item.system_expected}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">{item.total_counted}</td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black ${item.difference > 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                        {item.difference > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {Math.abs(item.difference)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-500">
                      {item.locations.length > 0 ? item.locations.join('، ') : 'پیدا نشد'}
                    </td>
                    <td className="px-6 py-4 text-left">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleRecount(item.product_id, item.product_name)}
                          className="bg-orange-50 text-orange-600 hover:bg-orange-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          درخواست بازشماری
                        </button>
                        <button className="bg-gray-900 text-white hover:bg-gray-800 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1">
                          <Send size={12} />
                          ارسال تعدیل
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.discrepancies.length === 0 && !loading && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400 font-bold">
                      هیچ مغایرتی یافت نشد. همه چیز مرتب است! 🎉
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-indigo-500 font-bold animate-pulse">
                      در حال پردازش و مقایسه اطلاعات...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
