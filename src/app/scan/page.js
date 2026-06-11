'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import dynamic from 'next/dynamic';
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
      }, 1500);
    }
  };

  const handleError = (error) => {
    console.error(error);
    const msg = error?.message || error?.name || '';
    if (msg.includes('Requested device not found') || msg.includes('NotFoundError') || msg.includes('device not found')) {
      setCamError('هیچ دوربینی روی این دستگاه یافت نشد. لطفاً از لپ‌تاپ یا موبایل استفاده کنید.');
    } else {
      setCamError(msg || 'خطا در دسترسی به دوربین. آیا از HTTPS یا localhost استفاده میکنید؟');
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-20">
      <Header title="اسکن کد کالا" showBack={true} />
      
      <div className="p-4 flex flex-col gap-6 items-center mt-4">
        
        <div className="w-full max-w-sm aspect-video border-2 border-dashed border-gray-300 rounded-lg overflow-hidden flex flex-col items-center justify-center bg-gray-100 relative">
          {cameraEnabled ? (
            <div className="w-full h-full relative">
              {camError ? (
                <div className="text-red-500 text-xs p-4 text-center">{camError}</div>
              ) : (
                <Scanner 
                  onScan={handleScan}
                  onError={handleError}
                  formats={['qr_code', 'code_128', 'ean_13']}
                />
              )}
              <button 
                onClick={() => { setCameraEnabled(false); setCamError(''); }}
                className="absolute bottom-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded z-10"
              >
                بستن دوربین
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setCameraEnabled(true)}
              className="text-blue-500 font-bold px-4 py-2"
            >
              فعال کردن دوربین برای اسکن
            </button>
          )}
        </div>
        
        <p className="text-sm text-gray-500">کد کالا را اسکن یا وارد کنید</p>
        
        <input 
          type="number" 
          dir="ltr"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="ورود دستی کد"
          className="w-full max-w-xs text-center text-3xl p-4 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
        />
        
        <select 
          value={warehouse}
          onChange={(e) => setWarehouse(e.target.value)}
          className="w-full max-w-xs text-center text-lg p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
        >
          <option value="11">مرکزی</option>
          <option value="13">انبار فروشگاه</option>
          <option value="14">انبار کارگاه شارژ</option>
          <option value="15">انبار کارگاه تعمیرات</option>
        </select>
        
        <button 
          onClick={handleGoToCounting}
          disabled={!code}
          className="w-full max-w-xs py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-bold text-xl rounded-lg transition-colors"
        >
          شمارش
        </button>
      </div>
    </div>
  );
}
