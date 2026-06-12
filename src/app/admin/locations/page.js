'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanLine, Plus, Trash2, Edit2, Layers, MapPin, X, AlertCircle, XCircle, Box } from 'lucide-react';
const Scanner = dynamic(() => import('@yudiel/react-qr-scanner').then(mod => mod.Scanner), { ssr: false });

export default function AdminLocations() {
  const [locations, setLocations] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  
  // Separate states for location parts
  const [floor, setFloor] = useState('');
  const [region, setRegion] = useState('');
  const [sector, setSector] = useState('');
  const [row, setRow] = useState('');

  const [loading, setLoading] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [camError, setCamError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  
  const [editingId, setEditingId] = useState(null);

  const [toast, setToast] = useState({ show: false, message: '', isError: false });

  const showToast = (message, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
  };

  useEffect(() => {
    fetchLocations();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setWarehouses(data.warehouses || []);
        if (data.warehouses?.length > 0) {
          setSelectedWarehouse(data.warehouses[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

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

  // Smart Parser for the main code input
  const handleFullCodeChange = (e) => {
    const val = e.target.value.toUpperCase();
    
    // Attempt to parse regex: [Letter][Number][Letter][Number] e.g. C2F3
    const regex = /^([A-Za-z]+)(\d+)([A-Za-z]+)(\d+)$/;
    const match = val.match(regex);
    
    if (match) {
      setFloor(match[1]);
      setRegion(match[2]);
      setSector(match[3]);
      setRow(match[4]);
    } else {
      // If it doesn't match perfectly, just use it as floor or something, but best to let users type in separate fields
      // We will just leave it empty or partially fill. Actually, it's better to clear them or let them type.
    }
  };

  const handleAddOrEdit = async () => {
    if (!floor || !region || !sector || !row) {
      showToast('لطفا همه مقادیر طبقه، منطقه، قطاع و ردیف را وارد کنید', true);
      return;
    }
    if (!selectedWarehouse) {
      showToast('لطفاً ابتدا انبار را انتخاب کنید', true);
      return;
    }
    
    const generatedCode = `${floor.toUpperCase()}${region}${sector.toUpperCase()}${row}`;

    setLoading(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/locations/${editingId}` : '/api/locations';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: generatedCode, warehouse: selectedWarehouse })
      });
      
      const data = await res.json();
      if (res.ok) {
        showToast(editingId ? 'قفسه با موفقیت ویرایش شد' : 'قفسه با موفقیت ثبت شد!');
        setFloor(''); setRegion(''); setSector(''); setRow('');
        setEditingId(null);
        fetchLocations();
      } else {
        showToast(data.error || 'خطا در ثبت قفسه', true);
      }
    } catch (e) {
      showToast('خطای شبکه', true);
    } finally {
      setLoading(false);
      setCameraEnabled(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('آیا از حذف این قفسه اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/locations/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast('قفسه حذف شد');
        fetchLocations();
      } else {
        showToast(data.error || 'خطا در حذف', true);
      }
    } catch (e) {
      showToast('خطای شبکه', true);
    }
  };

  const handleScan = (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const scannedValue = detectedCodes[0].rawValue.toUpperCase();
      const regex = /^([A-Za-z]+)(\d+)([A-Za-z]+)(\d+)$/;
      const match = scannedValue.match(regex);
      if (match) {
        setFloor(match[1]);
        setRegion(match[2]);
        setSector(match[3]);
        setRow(match[4]);
        showToast(`کد ${scannedValue} شناسایی و پر شد`);
        // Optional: auto-submit here if desired
        // setTimeout(handleAddOrEdit, 500); 
      } else {
        showToast(`کد اسکن شده نامعتبر است: ${scannedValue}`, true);
      }
    }
  };

  const handleError = (error) => {
    const msg = error?.message || error?.name || '';
    if (msg.includes('Requested device not found')) {
      setCamError('دوربینی یافت نشد.');
    } else {
      setCamError(msg || 'خطا در دسترسی به دوربین.');
    }
  };

  const floors = [...new Set(locations.map(loc => loc.floor))].sort();
  
  let filteredLocations = locations;
  if (selectedWarehouse) {
    filteredLocations = filteredLocations.filter(loc => loc.warehouse == selectedWarehouse);
  }
  if (activeFilter !== 'all') {
    filteredLocations = filteredLocations.filter(loc => loc.floor === activeFilter);
  }

  const generatedCodePreview = (floor || region || sector || row) ? `${floor.toUpperCase()}${region}${sector.toUpperCase()}${row}` : '';

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24 relative">
      <Header title="مدیریت قفسه‌ها" showBack={true} />
      
      <div className="flex-1 p-5 flex flex-col gap-6 max-w-md mx-auto w-full mt-2">
        
        {/* Action Box */}
        <div className="w-full bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
          
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-bold text-gray-700">{editingId ? 'ویرایش قفسه' : 'ثبت قفسه جدید'}</span>
            {editingId && (
              <button onClick={() => { setEditingId(null); setFloor(''); setRegion(''); setSector(''); setRow(''); }} className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded-lg">
                لغو ویرایش
              </button>
            )}
          </div>
          
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-[16px] px-4 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="" disabled>انبار را انتخاب کنید...</option>
            {warehouses.map(wh => (
              <option key={wh.id} value={wh.id}>{wh.name} (کد: {wh.id})</option>
            ))}
          </select>
          
          {/* Smart Code Input */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 mr-2 mb-1 block">اسکن یا تایپ کد قفسه (مثال: C2F3)</label>
            <input 
              type="text" 
              dir="ltr"
              onChange={handleFullCodeChange}
              placeholder="C2F3"
              className="w-full bg-indigo-50/50 border border-indigo-100 rounded-[16px] px-4 py-3 text-center uppercase font-black text-indigo-700 tracking-widest focus:outline-none focus:border-indigo-400 focus:bg-indigo-50 transition-colors placeholder-indigo-200"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400 font-bold text-center">طبقه</label>
              <input type="text" dir="ltr" value={floor} onChange={e => setFloor(e.target.value)} placeholder="C" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 text-center uppercase font-bold text-gray-800 focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400 font-bold text-center">منطقه</label>
              <input type="number" dir="ltr" value={region} onChange={e => setRegion(e.target.value)} placeholder="2" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 text-center font-bold text-gray-800 focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400 font-bold text-center">قطاع</label>
              <input type="text" dir="ltr" value={sector} onChange={e => setSector(e.target.value)} placeholder="F" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 text-center uppercase font-bold text-gray-800 focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400 font-bold text-center">ردیف</label>
              <input type="number" dir="ltr" value={row} onChange={e => setRow(e.target.value)} placeholder="3" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-2 text-center font-bold text-gray-800 focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={handleAddOrEdit}
            disabled={loading || !generatedCodePreview}
            className="w-full bg-gray-900 text-white py-3.5 rounded-[16px] text-sm font-black flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 mt-1"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (editingId ? <Edit2 size={18}/> : <Plus size={20}/>)}
            {editingId ? `ویرایش ${generatedCodePreview}` : `ثبت قفسه ${generatedCodePreview}`}
          </motion.button>

          <div className="relative overflow-hidden rounded-[16px]">
            <AnimatePresence>
              {cameraEnabled && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="w-full aspect-video relative flex flex-col items-center justify-center bg-black overflow-hidden"
                >
                  {camError ? (
                    <div className="text-red-400 text-xs p-4 text-center font-medium">{camError}</div>
                  ) : (
                    <div className="w-full h-full [&>div]:!object-cover [&>div>video]:!object-cover">
                      <Scanner onScan={handleScan} onError={handleError} />
                    </div>
                  )}
                  <button 
                    onClick={() => { setCameraEnabled(false); setCamError(''); }}
                    className="absolute top-2 right-2 bg-white/20 backdrop-blur-md p-1.5 rounded-full text-white pointer-events-auto"
                  >
                    <X size={16} strokeWidth={3} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            
            {!cameraEnabled && !editingId && (
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={() => setCameraEnabled(true)}
                className="w-full py-3.5 bg-indigo-50 text-indigo-600 text-sm font-extrabold rounded-[16px] transition-colors flex items-center justify-center gap-2 mt-2"
              >
                <ScanLine size={18} strokeWidth={2.5} />
                اسکن بارکد قفسه
              </motion.button>
            )}
          </div>
        </div>

        {/* List Section */}
        <div className="flex flex-col gap-4 mt-2">
          
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-sm">لیست قفسه‌ها <span className="text-gray-400 font-medium text-xs">({filteredLocations.length})</span></h3>
          </div>

          {/* Tag Filters */}
          {floors.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <button 
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-[12px] text-xs font-bold whitespace-nowrap transition-all border ${activeFilter === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
              >
                همه طبقات
              </button>
              {floors.map(floor => (
                <button 
                  key={floor}
                  onClick={() => setActiveFilter(floor)}
                  className={`px-4 py-2 rounded-[12px] text-xs font-bold whitespace-nowrap transition-all border ${activeFilter === floor ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                >
                  طبقه {floor}
                </button>
              ))}
            </div>
          )}

          {/* Cards */}
          <div className="flex flex-col gap-3">
            {filteredLocations.map((loc) => {
              const hasData = loc._count?.countings > 0;
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={loc.id} 
                  className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-[14px] flex items-center justify-center shrink-0">
                      <Layers className="text-gray-400" size={20} strokeWidth={2} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-black text-lg text-gray-800 tracking-wide uppercase">{loc.code}</span>
                      <span className="text-[10px] text-gray-400 font-bold mt-0.5">
                        {loc.warehouse ? `انبار: ${loc.warehouse} • ` : ''}طبقه {loc.floor} • منطقه {loc.region} • قطاع {loc.sector} • ردیف {loc.row}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {!hasData ? (
                      <>
                        <button 
                          onClick={() => { 
                            setEditingId(loc.id); 
                            setFloor(loc.floor);
                            setRegion(loc.region);
                            setSector(loc.sector);
                            setRow(loc.row);
                            window.scrollTo({ top: 0, behavior: 'smooth' }); 
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                        >
                          <Edit2 size={16} strokeWidth={2.5} />
                        </button>
                        <button 
                          onClick={() => handleDelete(loc.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                      </>
                    ) : (
                      <div className="px-3 py-1 bg-gray-50 rounded-full flex items-center gap-1.5 border border-gray-100">
                        <Box size={12} className="text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-500">{loc._count.countings} کالا</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
            
            {filteredLocations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                  <MapPin className="text-gray-300" size={24} />
                </div>
                <span className="text-sm font-bold text-gray-500">هیچ قفسه‌ای یافت نشد</span>
                <span className="text-xs text-gray-400 mt-1">با فرم بالا یک قفسه جدید ثبت کنید</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Minimal Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl shadow-xl backdrop-blur-3xl border text-xs font-bold whitespace-nowrap flex items-center justify-center gap-2 ${toast.isError ? 'bg-red-50/90 border-red-100 text-red-600' : 'bg-white/90 border-gray-100 text-gray-800'}`}
          >
            {toast.isError ? <XCircle size={14} /> : <AlertCircle size={14} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
