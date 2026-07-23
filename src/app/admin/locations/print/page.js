'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, ChevronLeft, MapPin, CheckSquare, Square, Box, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

export default function PrintLocations() {
  const [warehouses, setWarehouses] = useState([]);
  const [locationLevels, setLocationLevels] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  
  const [locations, setLocations] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setWarehouses(data.warehouses || []);
        if (data.warehouses?.length > 0) {
          setSelectedWarehouse(data.warehouses[0].id.toString());
        }
        if (data.location_levels) {
          const normalized = data.location_levels.map((l, i) => ({
            level: i + 1,
            ...(typeof l === 'string' ? { name: l } : l)
          }));
          setLocationLevels(normalized);
          if (normalized.length > 0) {
            setSelectedLevel(normalized[0].level.toString());
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  };

  const handleFetchLocations = async () => {
    if (!selectedWarehouse || !selectedLevel) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/locations?warehouseId=${selectedWarehouse}&level=${selectedLevel}`);
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
        // Select all by default
        setSelectedIds(new Set(data.map(loc => loc.id)));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const visibleLocations = locations.filter(loc => {
    if (!searchQuery) return true;
    const q = searchQuery.toUpperCase();
    return loc.code.toUpperCase().startsWith(q) || loc.title.includes(q);
  });

  const toggleAll = () => {
    const visibleIds = visibleLocations.map(loc => loc.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
    
    const next = new Set(selectedIds);
    if (allVisibleSelected) {
      visibleIds.forEach(id => next.delete(id));
    } else {
      visibleIds.forEach(id => next.add(id));
    }
    setSelectedIds(next);
  };

  const handlePrint = () => {
    window.print();
  };

  const getPaddedCode = (code) => {
    const maxLen = locationLevels.length;
    const tokens = code.match(/[a-zA-Z]+|[0-9]+/g) || [];
    const missing = maxLen - tokens.length;
    if (missing > 0) {
      return code + 'x'.repeat(missing);
    }
    return code;
  };

  const selectedLocations = locations.filter(loc => selectedIds.has(loc.id));

  return (
    <>
      <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24 relative print:hidden">
        <Header title="چاپ بارکد قفسه‌ها" showBack={true} />
        
        <div className="flex-1 p-4 md:p-6 w-full max-w-4xl mx-auto flex flex-col gap-5 mt-1">
          
          <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm flex flex-col gap-4">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
              <Printer size={18} className="text-indigo-600" />
              تنظیمات چاپ
            </h2>
            
            {fetching ? (
              <div className="flex justify-center py-6">
                 <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500">انتخاب انبار</label>
                  <select
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-[14px] px-4 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    {warehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500">انتخاب سطح قفسه</label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-[14px] px-4 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    {locationLevels.map(lvl => (
                      <option key={lvl.level} value={lvl.level}>سطح {lvl.level} ({lvl.name})</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-end">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={handleFetchLocations}
                    disabled={loading}
                    className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-3 rounded-[14px] text-sm font-bold flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 h-[46px]"
                  >
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <RefreshCw size={16}/>}
                    بارگذاری آدرس‌ها
                  </motion.button>
                </div>
              </div>
            )}
          </div>

          {locations.length > 0 && (
            <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400" />
                  لیست آدرس‌ها
                  <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md text-xs">{locations.length}</span>
                </h3>
                <div className="flex items-center gap-4">
                  <input 
                    type="text"
                    dir="ltr"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="فیلتر کد (مثال: A5)"
                    className="border border-gray-200 bg-gray-50 px-3 py-1.5 rounded-lg text-sm text-gray-800 font-bold focus:outline-none focus:border-indigo-500"
                  />
                  <button 
                    onClick={toggleAll}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    {visibleLocations.length > 0 && visibleLocations.every(loc => selectedIds.has(loc.id)) ? <CheckSquare size={16} /> : <Square size={16} />}
                    {visibleLocations.length > 0 && visibleLocations.every(loc => selectedIds.has(loc.id)) ? 'لغو انتخاب' : 'انتخاب همه'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {visibleLocations.map(loc => {
                  const isSelected = selectedIds.has(loc.id);
                  return (
                    <div 
                      key={loc.id}
                      onClick={() => toggleSelection(loc.id)}
                      className={`cursor-pointer flex items-center gap-3 p-3 rounded-xl border transition-colors ${isSelected ? 'bg-indigo-50/50 border-indigo-200' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}
                    >
                      <div className="text-indigo-600 flex-shrink-0">
                        {isSelected ? <CheckSquare size={18} /> : <Square size={18} className="text-gray-400" />}
                      </div>
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <span className="font-black text-sm text-gray-800 truncate">{loc.type} {loc.title}</span>
                        <span className="text-xs font-bold text-gray-500 truncate" dir="ltr">{getPaddedCode(loc.code)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-2">
                <div className="text-sm font-bold text-gray-600">
                  <span className="text-indigo-600">{selectedIds.size}</span> آدرس برای چاپ انتخاب شده است
                </div>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePrint}
                  disabled={selectedIds.size === 0}
                  className="bg-emerald-600 text-white px-6 py-3 rounded-[16px] text-sm font-black flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 shadow-md shadow-emerald-100"
                >
                  <Printer size={18} />
                  ایجاد خروجی چاپ
                </motion.button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Print View (Only visible during printing) */}
      <div className="hidden print:block bg-white text-black p-4">
        <div className="grid grid-cols-4 gap-8 gap-y-12">
          {selectedLocations.map((loc, index) => {
            const paddedCode = getPaddedCode(loc.code);
            return (
              <div key={loc.id} className="flex flex-col items-center justify-center text-center p-2 border border-dashed border-gray-300">
                <QRCodeSVG 
                  value={loc.code} 
                  size={100}
                  level="M"
                  includeMargin={true}
                />
                <div className="font-black text-xl tracking-[0.2em] mt-1 uppercase" dir="ltr">
                  {paddedCode}
                </div>
                <div className="text-[9px] font-bold text-gray-600 mt-2">
                  گروه نوآوری هوکا
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
