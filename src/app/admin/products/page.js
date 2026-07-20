'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import { PackageSearch, Search, AlertCircle, Box, Layers, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'in-stock', 'out-of-stock'
  const [visibleCount, setVisibleCount] = useState(20);
  
  const observer = useRef();
  
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/hesabfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'all' })
      });
      if (res.ok) {
        const data = await res.json();
        const productList = data?.Result?.List || data?.List || (Array.isArray(data) ? data : []);
        setProducts(productList);
      } else {
        setProducts([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.Name?.includes(search) || p.Code?.toString().includes(search);
    const matchesFilter = 
      filter === 'all' ? true : 
      filter === 'in-stock' ? p.Stock > 0 : 
      p.Stock <= 0;
    
    return matchesSearch && matchesFilter;
  });

  const displayedProducts = filteredProducts.slice(0, visibleCount);

  const lastElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && visibleCount < filteredProducts.length) {
        setVisibleCount(prev => prev + 20);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, visibleCount, filteredProducts.length]);

  // Reset pagination on filter or search
  useEffect(() => {
    setVisibleCount(20);
  }, [search, filter]);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex flex-col">
        <Header title="لیست کالاها" showBack={true} />
        <div className="flex-1 flex flex-col justify-center items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-gray-500">در حال دریافت کالاها از حسابفا...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24 relative">
      <Header title="لیست محصولات" showBack={true} />

      <div className="flex-1 p-4 md:p-6 flex flex-col gap-6 max-w-4xl mx-auto w-full mt-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2">
            <PackageSearch className="text-indigo-600" size={24} strokeWidth={2.5} />
            پایگاه داده کالاها
          </h2>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            مشاهده لحظه‌ای موجودی و اطلاعات صدها کالا متصل به سیستم جامع حسابفا
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="جستجو بر اساس نام یا کد کالا..." 
              className="w-full bg-gray-50 border border-gray-200 rounded-[16px] pr-12 pl-4 py-3.5 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:font-normal"
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
            <div className="w-10 h-10 bg-gray-100 text-gray-400 rounded-[12px] flex items-center justify-center shrink-0">
              <Filter size={16} />
            </div>
            {['all', 'in-stock', 'out-of-stock'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-[12px] text-xs font-bold whitespace-nowrap transition-all border ${
                  filter === f 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20' 
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {f === 'all' ? 'همه کالاها' : f === 'in-stock' ? 'موجود' : 'ناموجود'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-[16px] p-4 border border-gray-100 flex flex-col gap-1 shadow-sm">
            <span className="text-[10px] text-gray-400 font-bold uppercase">تعداد کل یافت شده</span>
            <span className="text-lg font-black text-gray-800">{filteredProducts.length}</span>
          </div>
          <div className="bg-white rounded-[16px] p-4 border border-green-100 flex flex-col gap-1 shadow-sm">
            <span className="text-[10px] text-green-600 font-bold uppercase">کالاهای موجود</span>
            <span className="text-lg font-black text-green-700">
              {filteredProducts.filter(p => p.Stock > 0).length}
            </span>
          </div>
        </div>

        {/* Products List */}
        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {displayedProducts.map((p, index) => {
              const isLastElement = index === displayedProducts.length - 1;
              return (
                <motion.div 
                  ref={isLastElement ? lastElementRef : null}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={p.Code} 
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 rounded-[20px] border border-gray-200 bg-white shadow-sm gap-4"
                >
                  <div className="flex items-start md:items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                      <Box size={24} strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-gray-800 leading-tight">{p.Name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 font-bold dir-ltr flex items-center gap-1">
                          <span className="text-gray-400 font-normal">کد:</span> {p.Code}
                        </span>
                        {p.Barcode && (
                          <span className="text-xs text-gray-500 font-bold dir-ltr flex items-center gap-1 border-r border-gray-200 pr-3">
                            <span className="text-gray-400 font-normal">بارکد:</span> {p.Barcode}
                          </span>
                        )}
                        <button 
                          onClick={() => window.open(`/admin/products/print-label?code=${p.Code}&name=${encodeURIComponent(p.Name)}`, '_blank')}
                          className="mr-3 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-[10px] text-[10px] font-black hover:bg-indigo-100 transition-colors"
                        >
                          تولید و چاپ لیبل (SKU)
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-6 bg-gray-50 md:bg-transparent p-3 md:p-0 rounded-[16px]">
                    <div className="flex flex-col items-center md:items-end">
                      <span className="text-[10px] font-bold text-gray-400 mb-0.5">موجودی سیستم</span>
                      <span className={`text-lg font-black ${p.Stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {p.Stock} <span className="text-xs font-bold text-gray-500">{p.Unit || 'عدد'}</span>
                      </span>
                    </div>
                    <div className="flex flex-col items-center md:items-end border-r border-gray-200 pr-6">
                      <span className="text-[10px] font-bold text-gray-400 mb-0.5">فی فروش</span>
                      <span className="text-sm font-black text-gray-700">
                        {p.SalesPrice?.toLocaleString()} <span className="text-[10px] text-gray-400">تومان</span>
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {visibleCount < filteredProducts.length && (
            <div className="py-4 flex justify-center">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 bg-white rounded-[24px] border border-dashed border-gray-300 flex flex-col items-center gap-3">
              <AlertCircle className="text-gray-300" size={32} />
              <p className="text-sm font-bold text-gray-500">هیچ کالایی با این مشخصات یافت نشد.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

