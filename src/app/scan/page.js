'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanLine, Search, Box, X, ChevronDown, CheckCircle2, LayoutGrid, Layers } from 'lucide-react';
const Scanner = dynamic(() => import('@yudiel/react-qr-scanner').then(mod => mod.Scanner), { ssr: false });

export default function ScanPage() {
  const [mode, setMode] = useState('ITEM'); // 'ITEM' | 'SHELF'
  const [code, setCode] = useState('');
  const [warehouse, setWarehouse] = useState('11');
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [camError, setCamError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockError, setLockError] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const router = useRouter();
  
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

  const handleGoToCounting = async () => {
    if (!code) return;
    setLockError('');
    setLoading(true);

    try {
      if (mode === 'SHELF') {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/locations/lock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ shelfCode: code, action: 'LOCK' })
        });
        const data = await res.json();
        
        if (!res.ok) {
          setLockError(data.error || 'خطا در قفل‌گذاری قفسه');
          setLoading(false);
          return;
        }
        router.push(`/counting/shelf?code=${code}&warehouse=${warehouse}`);
      } else {
        router.push(`/counting/item?code=${code}&warehouse=${warehouse}`);
      }
    } catch (error) {
      setLockError('خطای ارتباط با سرور');
      setLoading(false);
    }
  };

  const handleScan = (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const scannedValue = detectedCodes[0].rawValue;
      setCode(scannedValue);
      setCameraEnabled(false);
      setTimeout(() => {
        handleGoToCounting();
      }, 500);
    }
  };

  const handleError = (error) => {
    console.error(error);
    const msg = error?.message || error?.name || '';
    if (msg.includes('Requested device not found') || msg.includes('NotFoundError') || msg.includes('device not found')) {
      setCamError('دوربینی روی این دستگاه یافت نشد. لطفاً از لپ‌تاپ یا موبایل استفاده کنید.');
    } else {
      setCamError(msg || 'خطا در دسترسی به دوربین.');
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24">
      <Header title="شروع انبارگردانی" showBack={true} />
      
      <div className="flex-1 px-4 md:px-6 pt-4 flex flex-col items-center max-w-md mx-auto w-full">
        
        {/* Mode Switcher */}
        <div className="w-full bg-white p-1.5 rounded-[20px] shadow-sm flex mb-6 border border-gray-100">
          <button 
            onClick={() => { setMode('ITEM'); setCode(''); setLockError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[16px] text-xs font-bold transition-all ${mode === 'ITEM' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Box size={16} />
            بر اساس کالا
          </button>
          <button 
            onClick={() => { setMode('SHELF'); setCode(''); setLockError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[16px] text-xs font-bold transition-all ${mode === 'SHELF' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <LayoutGrid size={16} />
            بر اساس قفسه
          </button>
        </div>

        {/* Camera Area */}
        <div className="w-full relative mb-6">
          <div className={`w-full aspect-[4/3] rounded-[32px] overflow-hidden flex flex-col items-center justify-center transition-all duration-500 relative ${cameraEnabled ? 'bg-black shadow-2xl' : 'bg-white border border-gray-200 shadow-sm'}`}>
            {cameraEnabled ? (
              <div className="w-full h-full relative">
                {camError ? (
                  <div className="text-red-400 text-xs p-6 text-center h-full flex items-center justify-center font-medium bg-gray-900">{camError}</div>
                ) : (
                  <div className="w-full h-full [&>div]:!object-cover [&>div>video]:!object-cover">
                    <Scanner 
                      onScan={handleScan}
                      onError={handleError}
                      formats={['qr_code', 'code_128', 'ean_13']}
                    />
                  </div>
                )}
                
                {/* Scanner Target Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-white/40 rounded-3xl relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl"></div>
                  </div>
                </div>

                <button 
                  onClick={() => { setCameraEnabled(false); setCamError(''); }}
                  className="absolute top-4 right-4 bg-white/10 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/20 transition-colors pointer-events-auto"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={() => setCameraEnabled(true)}
                className="w-full h-full flex flex-col items-center justify-center gap-4 py-12"
              >
                <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center ${mode === 'SHELF' ? 'bg-indigo-50 text-indigo-500' : 'bg-gray-100 text-gray-600'}`}>
                  <ScanLine size={32} strokeWidth={2} />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-sm font-extrabold text-gray-800 mb-1">فعال‌سازی دوربین</span>
                  <span className="text-xs font-medium text-gray-400">
                    برای اسکن {mode === 'SHELF' ? 'بارکد قفسه' : 'بارکد کالا'} کلیک کنید
                  </span>
                </div>
              </motion.button>
            )}
          </div>
        </div>
        
        {/* Manual Input */}
        <div className="w-full flex flex-col gap-4">
          <AnimatePresence>
            {lockError && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-50 text-red-600 text-xs rounded-[16px] text-center font-bold">
                {lockError}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={18} strokeWidth={2.5} />
            </div>
            <input 
              type={mode === 'SHELF' ? "text" : "number"} 
              dir="ltr"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={mode === 'SHELF' ? "کد قفسه (مثال A-1)..." : "کد کالا..."}
              className="w-full pl-12 pr-5 py-4 bg-white border border-gray-200 rounded-[24px] focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-left text-lg font-bold text-gray-800 placeholder-gray-300 shadow-sm"
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <ChevronDown className="text-gray-400" size={18} strokeWidth={2.5} />
            </div>
            <select 
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
              className="w-full appearance-none pl-12 pr-5 py-4 bg-white border border-gray-200 rounded-[24px] focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all text-sm font-bold text-gray-700 shadow-sm"
            >
              {warehouses.map(wh => (
                <option key={wh.id} value={wh.id}>{wh.name} ({wh.id})</option>
              ))}
            </select>
          </div>
          
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={handleGoToCounting}
            disabled={!code || loading}
            className={`w-full mt-4 py-4 text-white text-sm font-extrabold rounded-[24px] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md ${mode === 'SHELF' ? 'bg-indigo-600 shadow-indigo-600/20' : 'bg-gray-900 shadow-gray-900/20'}`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : mode === 'SHELF' ? (
              <>
                <Layers size={18} strokeWidth={2.5} />
                ورود به قفسه و قفل‌گذاری
              </>
            ) : (
              <>
                <Box size={18} strokeWidth={2.5} />
                شروع شمارش کالا
              </>
            )}
          </motion.button>
        </div>

      </div>
    </div>
  );
}
