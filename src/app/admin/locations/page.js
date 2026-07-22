'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Layers, ChevronLeft, MapPin, XCircle, AlertCircle, Box, Home, QrCode, Camera, Check } from 'lucide-react';
import dynamic from 'next/dynamic';
const Scanner = dynamic(() => import('@yudiel/react-qr-scanner').then(mod => mod.Scanner), { ssr: false });

export default function AdminLocations() {
  const [locations, setLocations] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [listWarehouseFilter, setListWarehouseFilter] = useState('');
  
  const [title, setTitle] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, title: 'ساختار انبار' }]);
  const [locationLevels, setLocationLevels] = useState([
    { name: 'طبقه', format: 'ANY' },
    { name: 'اتاق', format: 'ANY' },
    { name: 'قفسه', format: 'ANY' },
    { name: 'ردیف', format: 'ANY' }
  ]);
  
  // Bulk Scan States
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanCode, setScanCode] = useState('');
  const [ignoreEndingX, setIgnoreEndingX] = useState(true);
  const [scanPreview, setScanPreview] = useState(null);
  const [scanError, setScanError] = useState('');
  const [existingLocation, setExistingLocation] = useState(null);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [camError, setCamError] = useState('');

  const [toast, setToast] = useState({ show: false, message: '', isError: false });

  const showToast = (message, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
  };

  const currentParentId = breadcrumbs[breadcrumbs.length - 1].id;

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    fetchLocations(currentParentId);
  }, [currentParentId]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setWarehouses(data.warehouses || []);
        if (data.warehouses?.length > 0) {
          setSelectedWarehouse(data.warehouses[0].id);
        }
        if (data.location_levels) {
          const normalized = data.location_levels.map(l => typeof l === 'string' ? { name: l, format: 'ANY' } : l);
          setLocationLevels(normalized);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLocations = async (parentId) => {
    setFetching(true);
    try {
      const res = await fetch(`/api/locations?parentId=${parentId || 'null'}`);
      if (res.ok) {
        setLocations(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  };

  const handleAddOrEdit = async () => {
    const currentDepth = breadcrumbs.length - 1;
    const currentLevel = locationLevels[currentDepth] || { name: `سطح ${currentDepth + 1}`, format: 'ANY' };
    const determinedType = currentLevel.name;

    if (!title) {
      showToast('لطفا عنوان را وارد کنید', true);
      return;
    }

    // Validation
    const format = currentLevel.format;
    if (format === 'UPPERCASE' && !/^[A-Z]+$/.test(title)) {
      showToast('عنوان فقط باید شامل حروف انگلیسی بزرگ باشد', true);
      return;
    }
    if (format === 'LOWERCASE' && !/^[a-z]+$/.test(title)) {
      showToast('عنوان فقط باید شامل حروف انگلیسی کوچک باشد', true);
      return;
    }
    if (format === 'NUMBER' && !/^[0-9]+$/.test(title)) {
      showToast('عنوان فقط باید شامل اعداد باشد', true);
      return;
    }
    if (format === 'SYMBOL' && !/^[+\-]+$/.test(title)) {
      showToast('عنوان فقط می‌تواند شامل علامت + یا - باشد', true);
      return;
    }
    
    setLoading(true);
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/locations/${editingId}` : '/api/locations';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          type: determinedType, 
          parentId: currentParentId, 
          warehouse: selectedWarehouse 
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        showToast(editingId ? 'سطح با موفقیت ویرایش شد' : 'سطح با موفقیت ثبت شد!');
        setTitle('');
        setEditingId(null);
        setIsModalOpen(false);
        fetchLocations(currentParentId);
      } else {
        showToast(data.error || 'خطا در ثبت سطح', true);
      }
    } catch (e) {
      showToast('خطای شبکه', true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('آیا از حذف این سطح اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/locations/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast('سطح حذف شد');
        fetchLocations(currentParentId);
      } else {
        showToast(data.error || 'خطا در حذف', true);
      }
    } catch (e) {
      showToast('خطای شبکه', true);
    }
  };

  const navigateTo = (loc) => {
    setBreadcrumbs(prev => [...prev, { id: loc.id, title: loc.type + ' ' + loc.title }]);
    setEditingId(null);
    setTitle('');
  };

  const navigateToCrumb = (index) => {
    setBreadcrumbs(prev => prev.slice(0, index + 1));
    setEditingId(null);
    setTitle('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setIsModalOpen(false);
  };

  const handleParseScan = async (val) => {
    let raw = val?.trim() || '';
    if (!raw) {
      setScanPreview(null);
      setScanError('');
      setExistingLocation(null);
      return;
    }
    
    if (ignoreEndingX && raw.toLowerCase().endsWith('x')) {
      raw = raw.slice(0, -1);
    }
    
    const tokens = raw.match(/[a-zA-Z]+|[0-9]+/g) || [];
    
    if (tokens.length === 0) {
      setScanError('هیچ الگوی مجازی در کد یافت نشد');
      setScanPreview(null);
      setExistingLocation(null);
      return;
    }
    
    const fullCode = tokens.join('').toUpperCase();
    setIsCheckingCode(true);
    setScanError('');
    setExistingLocation(null);
    setScanPreview(null);

    try {
      const res = await fetch(`/api/locations?code=${fullCode}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.code) {
          setExistingLocation(data);
          setIsCheckingCode(false);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCheckingCode(false);
    }

    if (tokens.length > locationLevels.length) {
      setScanError(`تعداد سطوح کد اسکن شده (${tokens.length}) از تنظیمات سیستم (${locationLevels.length}) بیشتر است`);
      setScanPreview(null);
      return;
    }
    
    for (let i = 0; i < tokens.length; i++) {
      const tokenVal = tokens[i];
      const format = locationLevels[i]?.format || 'ANY';
      const levelName = locationLevels[i]?.name || (i === 0 ? 'طبقه' : i === 1 ? 'اتاق' : i === 2 ? 'ضلع' : i === 3 ? 'قفسه' : `سطح ${i+1}`);
      
      let isValid = true;
      if (format === 'UPPERCASE' && !/^[A-Z]+$/.test(tokenVal)) isValid = false;
      if (format === 'LOWERCASE' && !/^[a-z]+$/.test(tokenVal)) isValid = false;
      if (format === 'NUMBER' && !/^[0-9]+$/.test(tokenVal)) isValid = false;
      
      if (!isValid) {
        let expected = format === 'UPPERCASE' ? 'حروف بزرگ انگلیسی' : format === 'NUMBER' ? 'اعداد' : 'حروف کوچک انگلیسی';
        setScanError(`سطح ${i+1} (${levelName}) باید شامل ${expected} باشد. اما «${tokenVal}» اسکن شد.`);
        setScanPreview(null);
        return;
      }
    }
    
    setScanPreview(tokens.map((t, i) => ({
      title: t.toUpperCase(),
      type: locationLevels[i]?.name || (i === 0 ? 'طبقه' : i === 1 ? 'اتاق' : i === 2 ? 'ضلع' : i === 3 ? 'قفسه' : `سطح ${i+1}`)
    })));
  };

  const handleCameraScan = (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const val = detectedCodes[0].rawValue;
      setScanCode(val);
      setCameraEnabled(false);
      handleParseScan(val);
    }
  };

  const handleBulkScanCreate = async () => {
    if (!scanPreview || !scanPreview.length) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/locations/bulk-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tokens: scanPreview.map(p => p.title),
          warehouseId: selectedWarehouse 
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('مسیر ساختار قفسه با موفقیت ایجاد شد');
        setIsScanModalOpen(false);
        setScanPreview(null);
        setScanCode('');
        setExistingLocation(null);
        fetchLocations(currentParentId);
      } else {
        showToast(data.error || 'خطا در ایجاد', true);
      }
    } catch (e) {
      showToast('خطای شبکه', true);
    } finally {
      setLoading(false);
    }
  };

  const currentDepth = breadcrumbs.length - 1;
  const currentLevel = locationLevels[currentDepth] || { name: `سطح ${currentDepth + 1}`, format: 'ANY' };
  const nextLevel = locationLevels[currentDepth + 1] || { name: `سطح ${currentDepth + 2}`, format: 'ANY' };
  
  const nextLevelName = currentLevel.name;
  const childLevelName = nextLevel.name;

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24 relative">
      <Header title="مدیریت قفسه‌ها و سطوح" showBack={true} />
      
      <div className="flex-1 p-4 flex flex-col gap-4 max-w-md mx-auto w-full">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide text-sm font-bold text-gray-600">
          {breadcrumbs.length > 1 && (
            <button 
              onClick={() => navigateToCrumb(breadcrumbs.length - 2)}
              className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-600 shrink-0 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          {breadcrumbs.map((crumb, index) => {
            if (crumb.id === null) return null;
            return (
              <div key={crumb.id || 'root'} className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => navigateToCrumb(index)}
                  className={`flex items-center gap-1 transition-colors ${index === breadcrumbs.length - 1 ? 'text-indigo-600 px-3 py-1.5 bg-indigo-50 rounded-xl' : 'hover:text-gray-900'}`}
                >
                  {crumb.title}
                </button>
                {index < breadcrumbs.length - 1 && <ChevronLeft size={16} className="text-gray-400" />}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-2">
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)}
            className="flex-1 bg-indigo-50 text-indigo-600 py-3.5 rounded-[16px] text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors"
          >
            <Plus size={20} />
            افزودن {nextLevelName}
          </motion.button>

          {currentDepth === 0 && (
            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setScanCode('');
                setScanPreview(null);
                setScanError('');
                setExistingLocation(null);
                setCameraEnabled(false);
                setIsScanModalOpen(true);
              }}
              className="flex-1 bg-emerald-50 text-emerald-600 py-3.5 rounded-[16px] text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
            >
              <QrCode size={20} />
              اسکن قفسه
            </motion.button>
          )}
        </div>

        {/* List Section */}
        <div className="flex flex-col gap-4 mt-2">
          
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-sm">لیست {nextLevelName}‌ها <span className="text-gray-400 font-medium text-xs">({locations.length})</span></h3>
            {currentDepth === 0 && warehouses.length > 0 && (
              <select 
                value={listWarehouseFilter}
                onChange={e => setListWarehouseFilter(e.target.value)}
                className="bg-white border border-gray-200 text-xs font-bold text-gray-600 rounded-[12px] px-3 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="">همه انبارها</option>
                {warehouses.map(wh => (
                  <option key={wh.id} value={wh.id}>{wh.name}</option>
                ))}
              </select>
            )}
          </div>

          {fetching ? (
            <div className="flex justify-center py-10">
               <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {locations
                  .filter(loc => currentDepth === 0 && listWarehouseFilter ? loc.warehouse === parseInt(listWarehouseFilter) : true)
                  .map((loc) => {
                  const hasData = loc._count?.countings > 0;
                  const hasChildren = loc._count?.children > 0;
                  
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={loc.id} 
                      className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between cursor-pointer" onClick={() => navigateTo(loc)}>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-[14px] flex items-center justify-center shrink-0">
                            <Layers size={20} strokeWidth={2.5} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-base text-gray-800">{loc.type} {loc.title}</span>
                            <span className="text-[10px] text-gray-400 font-bold mt-0.5 tracking-wider leading-relaxed">
                              کد: <span className="text-indigo-500">{loc.code}</span>
                              {loc.warehouse ? ` • انبار: ${loc.warehouse}` : ''}
                              {loc.parent && ` • مسیر: ${
                                (function getPath(p) {
                                  let path = [];
                                  let curr = p;
                                  while(curr) { path.unshift(curr.title); curr = curr.parent; }
                                  return path.join(' / ');
                                })(loc.parent)
                              }`}
                            </span>
                          </div>
                        </div>
                        <ChevronLeft size={20} className="text-gray-300" />
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                        <div className="flex items-center gap-2">
                          {(hasData || hasChildren) ? (
                            <div className="px-3 py-1.5 bg-gray-50 rounded-xl flex items-center gap-1.5 border border-gray-100">
                              <Box size={12} className="text-gray-400" />
                              <span className="text-[10px] font-bold text-gray-500">
                                {hasChildren ? `${loc._count.children} ${childLevelName}` : ''}
                                {hasChildren && hasData ? ' • ' : ''}
                                {hasData ? `${loc._count.countings} کالا` : ''}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-medium text-gray-400 px-1">خالی</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation();
                              setEditingId(loc.id); 
                              setTitle(loc.title);
                              if(loc.warehouse) setSelectedWarehouse(loc.warehouse);
                              setIsModalOpen(true);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                          >
                            <Edit2 size={16} strokeWidth={2.5} />
                          </button>
                          
                          {(!hasData && !hasChildren) && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(loc.id);
                              }}
                              className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={16} strokeWidth={2.5} />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              {locations.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 px-4 text-center"
                >
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <MapPin className="text-gray-300" size={24} />
                  </div>
                  <span className="text-sm font-bold text-gray-500">هیچ {nextLevelName}‌ای یافت نشد</span>
                  <span className="text-xs text-gray-400 mt-1">با فرم بالا یک {nextLevelName} اضافه کنید</span>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={cancelEdit}
          >
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-black text-gray-800 text-lg">{editingId ? `ویرایش ${nextLevelName}` : `ثبت ${nextLevelName} جدید`}</h3>
                <button onClick={cancelEdit} className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200">
                  <XCircle size={20} />
                </button>
              </div>
              
              <div className="flex flex-col gap-4">
                {currentDepth === 0 && (
                  <select
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-[16px] px-4 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="" disabled>انبار را انتخاب کنید...</option>
                    {warehouses.map(wh => (
                      <option key={wh.id} value={wh.id}>{wh.name} (کد: {wh.id})</option>
                    ))}
                  </select>
                )}
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-500 font-bold">عنوان {nextLevelName}</label>
                  <input 
                    type="text" 
                    dir="ltr"
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    placeholder="مثال: A یا 1" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-[16px] px-4 py-4 text-base text-left font-black text-gray-800 focus:outline-none focus:border-indigo-500" 
                  />
                  <span className="text-[10px] text-gray-400 font-medium">فرمت مجاز: {currentLevel.format === 'ANY' ? 'هر کاراکتری' : currentLevel.format === 'UPPERCASE' ? 'حروف بزرگ انگلیسی' : currentLevel.format === 'LOWERCASE' ? 'حروف کوچک انگلیسی' : currentLevel.format === 'NUMBER' ? 'فقط عدد' : 'فقط + یا -'}</span>
                </div>
              </div>

              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={handleAddOrEdit}
                disabled={loading || !title}
                className="w-full bg-indigo-600 text-white py-4 rounded-[16px] text-sm font-black flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 mt-2"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (editingId ? <Edit2 size={18}/> : <Plus size={20}/>)}
                {editingId ? 'ذخیره تغییرات' : 'ثبت اطلاعات'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk / Shelf Scan Modal */}
      <AnimatePresence>
        {isScanModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={() => setIsScanModalOpen(false)}
          >
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-black text-gray-800 text-lg flex items-center gap-2">
                  <QrCode size={22} className="text-indigo-600" />
                  اسکن قفسه (ثبت و استعلام آدرس)
                </h3>
                <button onClick={() => setIsScanModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200">
                  <XCircle size={20} />
                </button>
              </div>
              
              {/* Warehouse selector */}
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
              
              <label className="flex items-center gap-2 text-xs font-bold text-gray-600 bg-gray-50 p-3 rounded-[16px] cursor-pointer border border-gray-100">
                <input 
                  type="checkbox" 
                  checked={ignoreEndingX}
                  onChange={(e) => {
                    setIgnoreEndingX(e.target.checked);
                    if (scanCode) {
                      setTimeout(() => handleParseScan(scanCode), 0);
                    }
                  }}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                نادیده گرفتن حرف X یا x در انتهای کد (مانند A5F6x)
              </label>

              {cameraEnabled ? (
                <div className="w-full aspect-[4/3] rounded-[24px] overflow-hidden relative bg-black shadow-inner border border-gray-200">
                  <div className="w-full h-full [&>div]:!object-cover [&>div>video]:!object-cover">
                    <Scanner 
                      onScan={handleCameraScan}
                      onError={(err) => setCamError(err?.message || 'خطا در دوربین')}
                      formats={['qr_code', 'code_128', 'ean_13']}
                    />
                  </div>
                  {camError && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
                      <span className="text-white text-xs font-bold text-center">{camError}</span>
                    </div>
                  )}
                  <button 
                    onClick={() => setCameraEnabled(false)}
                    className="absolute top-3 right-3 bg-white/20 backdrop-blur-md p-1.5 rounded-full text-white"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    dir="ltr"
                    value={scanCode} 
                    onChange={e => {
                      setScanCode(e.target.value);
                      handleParseScan(e.target.value);
                    }} 
                    placeholder="بارکد قفسه (مثال A5F6x)..." 
                    className="flex-1 bg-white border-2 border-gray-200 rounded-[16px] px-4 py-3 text-base text-left font-black text-gray-800 focus:outline-none focus:border-indigo-500" 
                  />
                  <button 
                    onClick={() => setCameraEnabled(true)}
                    className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-[16px] flex items-center justify-center shrink-0 hover:bg-indigo-100 transition-colors border border-indigo-100"
                  >
                    <Camera size={20} />
                  </button>
                </div>
              )}

              {isCheckingCode && (
                <div className="flex items-center justify-center gap-2 p-3 bg-indigo-50/70 text-indigo-600 rounded-[14px] text-xs font-bold animate-pulse">
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  در حال استعلام آدرس قفسه در سیستم...
                </div>
              )}
              
              {scanError && !isCheckingCode && (
                <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-[12px] text-center border border-red-100">
                  {scanError}
                </div>
              )}

              {/* Case 1: Existing Location */}
              {existingLocation && !isCheckingCode && (
                <div className="bg-blue-50/80 border border-blue-200 rounded-[20px] p-4 flex flex-col gap-3 shadow-sm">
                  <div className="flex items-center gap-2 text-blue-700 text-xs font-black">
                    <Check className="w-4 h-4 bg-blue-600 text-white rounded-full p-0.5" />
                    این آدرس قبلاً در سیستم ثبت شده است:
                  </div>
                  
                  <div className="flex flex-col gap-2 bg-white p-3 rounded-[14px] border border-blue-100 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-bold">کد کامل قفسه:</span>
                      <span className="font-black text-indigo-600 text-sm">{existingLocation.code}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-bold">عنوان و نوع سطح:</span>
                      <span className="font-bold text-gray-800">{existingLocation.type} {existingLocation.title}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-bold">انبار:</span>
                      <span className="font-bold text-gray-800">{existingLocation.warehouse || selectedWarehouse}</span>
                    </div>
                    {existingLocation.parent && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-bold">مسیر کامل:</span>
                        <span className="font-bold text-indigo-600" dir="ltr">
                          {(function getPath(p) {
                            let path = [existingLocation.title];
                            let curr = p;
                            while(curr) { path.unshift(curr.title); curr = curr.parent; }
                            return path.join(' / ');
                          })(existingLocation.parent)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                      <span className="text-gray-500 font-bold">تعداد کالای ثبت‌شده:</span>
                      <span className="font-black text-gray-800">{existingLocation._count?.countings || 0} مورد</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setIsScanModalOpen(false)}
                    className="w-full bg-blue-600 text-white py-3 rounded-[14px] text-xs font-black shadow-md hover:bg-blue-700 transition-colors"
                  >
                    متوجه شدم (بستن)
                  </button>
                </div>
              )}
              
              {/* Case 2: New Location Breakdown */}
              {scanPreview && !scanError && !existingLocation && !isCheckingCode && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-[20px] p-4 flex flex-col gap-3 shadow-sm">
                  <div className="text-xs font-black text-emerald-800 text-center">
                    ✨ آدرس جدید است؛ تفکیک سطوح به شکل زیر صورت گرفت:
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    {scanPreview.map((level, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-[14px] border border-emerald-100 shadow-xs">
                        <span className="text-xs font-bold text-gray-500">سطح {idx + 1} ({level.type}):</span>
                        <span className="text-sm font-black text-emerald-700 tracking-widest">{level.title}</span>
                      </div>
                    ))}
                  </div>

                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBulkScanCreate}
                    disabled={loading}
                    className="w-full bg-emerald-600 text-white py-4 rounded-[16px] text-sm font-black flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 mt-1 shadow-md shadow-emerald-600/20"
                  >
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Check size={20}/>}
                    تایید ادمین و ایجاد مسیر در مدیریت قفسه‌ها
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
