'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { PackageOpen, Search, Filter, Box } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStock, setFilterStock] = useState('all'); // 'all', 'in-stock', 'out-of-stock'

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
        if (data.Success && data.Result?.List) {
          setProducts(data.Result.List);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.Name.includes(searchTerm) || p.Code.includes(searchTerm);
    if (!matchesSearch) return false;
    
    if (filterStock === 'in-stock') return p.Stock > 0;
    if (filterStock === 'out-of-stock') return p.Stock <= 0;
    return true;
  });

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex flex-col">
        <Header title="لیست محصولات" showBack={true} />
        <div className="flex-1 flex justify-center items-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24 relative overflow-x-hidden">
      <Header title="محصولات حسابفا" showBack={true} />

      <div className="flex-1 p-5 flex flex-col gap-6 max-w-3xl mx-auto w-full mt-2">
        <div className="flex flex-col">
          <h2 className="text-xl font-black text-gray-800 tracking-tight">موجودی کالاها</h2>
          <p className="text-xs text-gray-400 font-medium mt-1">لیست زنده کالاهای ثبت شده در نرم‌افزار حسابفا</p>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="جستجو با نام یا کد کالا..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-[16px] pr-12 pl-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors shadow-sm"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
          <div className="flex gap-2 shrink-0">
            {['all', 'in-stock', 'out-of-stock'].map(filter => (
              <button
                key={filter}
                onClick={() => setFilterStock(filter)}
                className={`px-4 py-3 rounded-[16px] text-xs font-bold transition-all border shadow-sm ${
                  filterStock === filter 
                  ? 'bg-gray-900 text-white border-gray-900' 
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {filter === 'all' ? 'همه' : filter === 'in-stock' ? 'موجود' : 'ناموجود'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {filteredProducts.map(p => (
            <motion.div 
              key={p.Code}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded-[14px] flex items-center justify-center shrink-0">
                  <PackageOpen className="text-gray-400" size={20} strokeWidth={2} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-800 text-sm line-clamp-1">{p.Name}</span>
                  <span className="text-[11px] text-gray-400 font-bold mt-0.5" dir="ltr">{p.Code}</span>
                </div>
              </div>

              <div className={`shrink-0 px-3 py-1.5 rounded-[12px] flex items-center gap-1.5 ${p.Stock > 0 ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-50 text-gray-500 border border-gray-100'}`}>
                <Box size={14} strokeWidth={2.5} />
                <span className="text-xs font-black">{p.Stock} {p.Unit || 'عدد'}</span>
              </div>
            </motion.div>
          ))}
          
          {filteredProducts.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <Filter className="text-gray-400" size={24} />
              </div>
              <span className="text-sm font-bold text-gray-500">کالایی یافت نشد</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
