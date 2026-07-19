'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Layers, ChevronLeft, MapPin, XCircle, AlertCircle, Box, Home } from 'lucide-react';

export default function AdminLocations() {
  const [locations, setLocations] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [editingId, setEditingId] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, title: 'ریشه انبار' }]);
  
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
    if (!title || !type) {
      showToast('لطفا عنوان و نوع سطح را وارد کنید', true);
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
          type, 
          parentId: currentParentId, 
          warehouse: selectedWarehouse 
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        showToast(editingId ? 'سطح با موفقیت ویرایش شد' : 'سطح با موفقیت ثبت شد!');
        setTitle('');
        setType('');
        setEditingId(null);
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
    setType('');
  };

  const navigateToCrumb = (index) => {
    setBreadcrumbs(prev => prev.slice(0, index + 1));
    setEditingId(null);
    setTitle('');
    setType('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setType('');
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24 relative">
      <Header title="مدیریت قفسه‌ها و سطوح" showBack={true} />
      
      <div className="flex-1 p-5 flex flex-col gap-6 max-w-md mx-auto w-full mt-2">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide text-sm font-bold text-gray-600">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.id || 'root'} className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => navigateToCrumb(index)}
                className={`flex items-center gap-1 transition-colors ${index === breadcrumbs.length - 1 ? 'text-indigo-600 px-3 py-1.5 bg-indigo-50 rounded-xl' : 'hover:text-gray-900'}`}
              >
                {crumb.id === null ? <Home size={16} /> : null}
                {crumb.title}
              </button>
              {index < breadcrumbs.length - 1 && <ChevronLeft size={16} className="text-gray-400" />}
            </div>
          ))}
        </div>

        {/* Action Box */}
        <div className="w-full bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex flex-col gap-4">
          
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-bold text-gray-700">{editingId ? 'ویرایش سطح' : 'ثبت سطح جدید در ' + (breadcrumbs[breadcrumbs.length - 1].id === null ? 'ریشه' : breadcrumbs[breadcrumbs.length - 1].title)}</span>
            {editingId && (
              <button onClick={cancelEdit} className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded-lg">
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
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400 font-bold">نوع سطح (مثل: طبقه، اتاق)</label>
              <input 
                type="text" 
                value={type} 
                onChange={e => setType(e.target.value)} 
                placeholder="مثال: طبقه" 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:border-indigo-500" 
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400 font-bold">عنوان سطح (مثل: A, 5)</label>
              <input 
                type="text" 
                dir="ltr"
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="مثال: A" 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-sm text-left uppercase font-bold text-gray-800 focus:outline-none focus:border-indigo-500" 
              />
            </div>
          </div>

          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={handleAddOrEdit}
            disabled={loading || !title || !type}
            className="w-full bg-gray-900 text-white py-3.5 rounded-[16px] text-sm font-black flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 mt-1"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (editingId ? <Edit2 size={18}/> : <Plus size={20}/>)}
            {editingId ? 'ویرایش اطلاعات' : 'ثبت اطلاعات'}
          </motion.button>
        </div>

        {/* List Section */}
        <div className="flex flex-col gap-4 mt-2">
          
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-sm">لیست زیرمجموعه‌ها <span className="text-gray-400 font-medium text-xs">({locations.length})</span></h3>
          </div>

          {fetching ? (
            <div className="flex justify-center py-10">
               <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {locations.map((loc) => {
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
                            <span className="text-[10px] text-gray-400 font-bold mt-0.5 tracking-wider">
                              کد: <span className="text-indigo-500">{loc.code}</span>
                              {loc.warehouse ? ` • انبار: ${loc.warehouse}` : ''}
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
                                {hasChildren ? `${loc._count.children} زیرمجموعه` : ''}
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
                              setType(loc.type);
                              if(loc.warehouse) setSelectedWarehouse(loc.warehouse);
                              window.scrollTo({ top: 0, behavior: 'smooth' }); 
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
                  <span className="text-sm font-bold text-gray-500">هیچ سطحی یافت نشد</span>
                  <span className="text-xs text-gray-400 mt-1">با فرم بالا یک زیرمجموعه اضافه کنید</span>
                </motion.div>
              )}
            </div>
          )}
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
