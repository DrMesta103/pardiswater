'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { AlertTriangle, CheckCircle, PackageSearch, RefreshCw, Send, ListTree, ArrowDownRight, ArrowUpRight, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DiscrepancyDashboard() {
  const [warehouse, setWarehouse] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [data, setData] = useState({ discrepancies: [], accurate: [] });
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, surplus (مازاد), deficit (کسری)

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

  const filteredDiscrepancies = data.discrepancies.filter(item => {
    const matchesSearch = item.product_name?.includes(search) || item.product_id?.toString().includes(search);
    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'surplus' ? item.difference > 0 :
      filter === 'deficit' ? item.difference < 0 : true;
      
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24 overflow-x-hidden">
      <Header title="داشبورد مغایرت‌گیری" showBack={true} />

      <div className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full flex flex-col gap-6 mt-2">
        
        {/* Controls */}
        <div className="bg-white rounded-[24px] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border border-gray-100 relative z-20">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <ListTree size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">انتخاب انبار</h2>
              <p className="text-[10px] text-gray-400 font-medium">مبنای مقایسه موجودی حسابفا</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select 
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-indigo-500 flex-1 sm:w-48 transition-colors"
            >
              {warehouses.map(wh => (
                <option key={wh.id} value={wh.id}>{wh.name} (کد {wh.id})</option>
              ))}
            </select>
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={fetchData} 
              className="bg-gray-900 text-white p-3 rounded-xl hover:bg-gray-800 transition-colors shrink-0"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </motion.button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div className="bg-white border border-red-100 rounded-[24px] p-5 shadow-sm flex flex-col gap-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full flex items-start justify-end p-4 opacity-50 z-0">
              <AlertTriangle className="text-red-300" size={32} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">کالاهای دارای مغایرت</p>
              <p className="text-3xl font-black text-red-600">{loading ? '-' : data.discrepancies.length}</p>
            </div>
          </div>
          
          <div className="bg-white border border-green-100 rounded-[24px] p-5 shadow-sm flex flex-col gap-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-full flex items-start justify-end p-4 opacity-50 z-0">
              <CheckCircle className="text-green-300" size={32} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">کالاهای بدون مغایرت</p>
              <p className="text-3xl font-black text-green-600">{loading ? '-' : data.accurate.length}</p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="جستجوی کالا..." 
              className="w-full bg-gray-50 border border-gray-200 rounded-[16px] pr-11 pl-4 py-3 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all placeholder:font-normal"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            {['all', 'surplus', 'deficit'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-[16px] text-xs font-bold whitespace-nowrap transition-all border ${
                  filter === f 
                  ? 'bg-gray-900 text-white border-gray-900 shadow-md' 
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {f === 'all' ? 'همه موارد' : f === 'surplus' ? 'مازاد (اضافه)' : 'کسری'}
              </button>
            ))}
          </div>
        </div>

        {/* Discrepancies List (Card Based) */}
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex items-center gap-2 px-2">
            <PackageSearch className="text-red-500" size={20} strokeWidth={2.5} />
            <h3 className="font-black text-gray-800 text-sm">لیست کالا‌های نیازمند بررسی</h3>
            <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold mr-auto">
              {filteredDiscrepancies.length} مورد
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {filteredDiscrepancies.map((item, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={`${item.product_id}-${idx}`}
                  className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-5 flex flex-col gap-4"
                >
                  {/* Top: Product Info & Badge */}
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col pr-1">
                      <h4 className="font-bold text-gray-800 text-sm leading-snug">{item.product_name}</h4>
                      <p className="text-[10px] text-gray-400 mt-1 font-medium tracking-wider">کد حسابفا: {item.product_id}</p>
                    </div>
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-[10px] text-xs font-black shadow-sm shrink-0 mr-3 ${item.difference > 0 ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                      {item.difference > 0 ? <ArrowUpRight size={14} strokeWidth={3} /> : <ArrowDownRight size={14} strokeWidth={3} />}
                      {Math.abs(item.difference)}
                    </div>
                  </div>

                  {/* Middle: Stats */}
                  <div className="flex items-center bg-gray-50 rounded-[16px] p-3 border border-gray-100">
                    <div className="flex-1 flex flex-col items-center border-l border-gray-200">
                      <span className="text-[10px] font-bold text-gray-400 mb-0.5">موجودی سیستم</span>
                      <span className="text-lg font-black text-gray-600">{item.system_expected}</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center border-l border-gray-200">
                      <span className="text-[10px] font-bold text-gray-400 mb-0.5">شمارش شما</span>
                      <span className="text-lg font-black text-gray-900">{item.total_counted}</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <span className="text-[10px] font-bold text-gray-400 mb-0.5">قفسه‌ها</span>
                      <span className="text-xs font-bold text-indigo-600 mt-1.5 line-clamp-1 text-center px-1">
                        {item.locations.length > 0 ? item.locations.join('، ') : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom: Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-50 mt-1">
                    <button 
                      onClick={() => handleRecount(item.product_id, item.product_name)}
                      className="bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white px-4 py-2.5 rounded-[14px] text-xs font-bold transition-colors flex-1 text-center"
                    >
                      ارجاع بازشماری
                    </button>
                    <button className="bg-gray-900 text-white hover:bg-gray-800 px-4 py-2.5 rounded-[14px] text-xs font-bold transition-colors flex items-center justify-center gap-1.5 flex-1 shadow-md">
                      <Send size={14} />
                      ارسال تعدیل
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredDiscrepancies.length === 0 && !loading && (
              <div className="bg-white rounded-[24px] border border-dashed border-gray-300 flex flex-col items-center justify-center p-10 text-center gap-3">
                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle size={32} />
                </div>
                <p className="text-sm font-bold text-gray-500">موردی یافت نشد!</p>
                <p className="text-xs text-gray-400">یا مغایرتی وجود ندارد یا جستجوی شما نتیجه‌ای نداشت.</p>
              </div>
            )}
            
            {loading && (
              <div className="bg-white rounded-[24px] border border-gray-100 flex flex-col items-center justify-center p-10 text-center gap-3">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-bold text-gray-500">در حال بررسی و مقایسه اطلاعات...</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
