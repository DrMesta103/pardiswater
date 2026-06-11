'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { ScanLine, Search, Box, X, ChevronDown, CheckCircle2 } from 'lucide-react';
const Scanner = dynamic(() => import('@yudiel/react-qr-scanner').then(mod => mod.Scanner), { ssr: false });

export default function ScanPage() {
  const [code, setCode] = useState('');
  const [warehouse, setWarehouse] = useState('11');
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const router = useRouter();

  const handleGoToCounting = () => {
    if (code) {
      router.push(`/counting?code=${code}&warehouse=${warehouse}`);
    }
  };

  const [camError, setCamError] = useState('');

  const handleScan = (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const scannedValue = detectedCodes[0].rawValue;
      setCode(scannedValue);
      setCameraEnabled(false);
      setTimeout(() => {
        router.push(`/counting?code=${scannedValue}&warehouse=${warehouse}`);
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
      <Header title="اسکن کالا" showBack={true} />
      
      <div className="flex-1 px-6 pt-6 flex flex-col items-center max-w-md mx-auto w-full">
        
        {/* Camera Area */}
        <div className="w-full relative mb-8">
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
                <div className="w-16 h-16 rounded-[20px] bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <ScanLine size={32} strokeWidth={2} />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-sm font-extrabold text-gray-800 mb-1">فعال‌سازی دوربین</span>
                  <span className="text-xs font-medium text-gray-400">برای اسکن بارکد کالا کلیک کنید</span>
                </div>
              </motion.button>
            )}
          </div>
        </div>
        
        {/* Manual Input */}
        <div className="w-full flex flex-col gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={18} strokeWidth={2.5} />
            </div>
            <input 
              type="number" 
              dir="ltr"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ورود دستی کد کالا..."
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
              <option value="11">انبار مرکزی (11)</option>
              <option value="13">انبار فروشگاه (13)</option>
              <option value="14">انبار کارگاه شارژ (14)</option>
              <option value="15">انبار کارگاه تعمیرات (15)</option>
            </select>
          </div>
          
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={handleGoToCounting}
            disabled={!code}
            className="w-full mt-4 py-4 bg-gray-900 text-white text-sm font-extrabold rounded-[24px] transition-all disabled:opacity-50 disabled:bg-gray-300 flex items-center justify-center gap-2 shadow-md shadow-gray-900/10"
          >
            {code ? <CheckCircle2 size={18} strokeWidth={2.5} /> : <Box size={18} strokeWidth={2.5} />}
            شروع شمارش کالا
          </motion.button>
        </div>

      </div>
    </div>
  );
}
