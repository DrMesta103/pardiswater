'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import dynamic from 'next/dynamic';
const Scanner = dynamic(() => import('@yudiel/react-qr-scanner').then(mod => mod.Scanner), { ssr: false });

export default function AdminLocations() {
  const [locations, setLocations] = useState([]);
  const [newCode, setNewCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);

  const [camError, setCamError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/locations');
      if (res.ok) {
        setLocations(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddLocation = async (codeValue) => {
    const targetCode = codeValue || newCode;
    if (!targetCode) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: targetCode })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert('قفسه با موفقیت ثبت شد!');
        setNewCode('');
        fetchLocations();
      } else {
        alert(data.error || 'خطا در ثبت قفسه');
      }
    } catch (e) {
      alert('خطای شبکه');
    } finally {
      setLoading(false);
      setCameraEnabled(false);
    }
  };

  const handleScan = (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const scannedValue = detectedCodes[0].rawValue;
      handleAddLocation(scannedValue);
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

  // استخراج طبقات یکتا برای ساخت دکمه‌های فیلتر
  const floors = [...new Set(locations.map(loc => loc.floor))].sort();

  // اعمال فیلتر روی لیست قفسه‌ها
  const filteredLocations = activeFilter === 'all' 
    ? locations 
    : locations.filter(loc => loc.floor === activeFilter);

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-20">
      <Header title="مدیریت قفسه ها (ادمین)" showBack={true} />
      
      <div className="p-4 flex flex-col gap-6 items-center">
        
        <div className="w-full bg-white p-4 rounded shadow border border-gray-200">
          <h2 className="font-bold mb-2">ثبت قفسه جدید</h2>
          <p className="text-xs text-gray-500 mb-4">
            فرمت استاندارد شامل حروف و اعداد است. 
            مثال: C2F2 (طبقه C، منطقه 2، قطاع F، ردیف 2)
          </p>

          <div className="flex flex-col gap-3">
            <input 
              type="text" 
              dir="ltr"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="مثال: C2F2"
              className="w-full border p-2 rounded text-center uppercase font-bold"
            />
            <button 
              onClick={() => handleAddLocation(newCode)}
              disabled={loading}
              className="bg-purple-600 text-white font-bold py-2 rounded"
            >
              ثبت دستی
            </button>
          </div>

          <div className="mt-4 border-t pt-4">
            {cameraEnabled ? (
              <div className="w-full aspect-video relative flex flex-col items-center justify-center bg-gray-100 rounded">
                {camError ? (
                  <div className="text-red-500 text-xs p-4 text-center">{camError}</div>
                ) : (
                  <Scanner onScan={handleScan} onError={handleError} />
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
                className="w-full bg-blue-500 text-white font-bold py-2 rounded flex justify-center items-center gap-2"
              >
                اسکن بارکد قفسه
              </button>
            )}
          </div>
        </div>

        <div className="w-full bg-white p-4 rounded shadow border border-gray-200">
          <h2 className="font-bold mb-4">قفسه های ثبت شده ({filteredLocations.length})</h2>
          
          {/* فیلترهای تگ (اسکرول افقی) */}
          {floors.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <button 
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${activeFilter === 'all' ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
              >
                همه طبقات
              </button>
              {floors.map(floor => (
                <button 
                  key={floor}
                  onClick={() => setActiveFilter(floor)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${activeFilter === floor ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                >
                  طبقه {floor}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
            {filteredLocations.map((loc) => (
              <div key={loc.id} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100 text-sm">
                <span className="font-bold text-lg text-purple-700">{loc.code}</span>
                <span className="text-gray-500 text-xs">طبقه {loc.floor} | منطقه {loc.region} | قطاع {loc.sector} | ردیف {loc.row}</span>
              </div>
            ))}
            {filteredLocations.length === 0 && <span className="text-center text-sm text-gray-400 py-4">موردی یافت نشد.</span>}
          </div>
        </div>

      </div>
    </div>
  );
}
