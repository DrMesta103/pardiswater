'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Layers, Check, Plus, Trash2, X, BarChart2, 
  User, CheckCircle, Clock, Lock, RefreshCw, AlertCircle, 
  Warehouse, PieChart, TrendingUp, Users, ChevronLeft, MoreVertical
} from 'lucide-react';

export default function CountingPeriodsPage() {
  const [periods, setPeriods] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', isError: false });

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', warehouses: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail / Report Modal State
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchPeriods();
    fetchSettings();
  }, []);

  const fetchPeriods = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/periods');
      if (res.ok) setPeriods(await res.json());
    } catch (e) {
      showToast('خطا در دریافت لیست دوره‌ها', true);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.warehouses) setWarehouses(data.warehouses);
      }
    } catch (e) {
      // Fallback default warehouses if API fails
      setWarehouses([
        { id: '11', name: 'انبار مرکزی (۱۱)' },
        { id: '13', name: 'انبار فروشگاه (۱۳)' },
        { id: '14', name: 'انبار کارگاه شارژ (۱۴)' },
        { id: '15', name: 'انبار تعمیرات (۱۵)' },
        { id: '20', name: 'انبار عمومی (۲۰)' }
      ]);
    }
  };

  const showToast = (message, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast({ show: false, message: '', isError: false }), 3500);
  };

  // Toggle Warehouse Selection
  const toggleWarehouse = (id) => {
    setCreateForm(prev => {
      const exists = prev.warehouses.includes(id);
      return {
        ...prev,
        warehouses: exists ? prev.warehouses.filter(w => w !== id) : [...prev.warehouses, id]
      };
    });
  };

  // Create Period Handler
  const handleCreatePeriod = async () => {
    if (!createForm.title.trim()) {
      showToast('عنوان دوره را وارد کنید', true);
      return;
    }

    if (createForm.warehouses.length === 0) {
      showToast('حداقل یک انبار برای دوره انتخاب کنید', true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      });
      const data = await res.json();

      if (res.ok) {
        showToast(data.message || 'دوره با موفقیت ایجاد گردید');
        setIsCreateModalOpen(false);
        setCreateForm({ title: '', warehouses: [] });
        fetchPeriods();
      } else {
        showToast(data.error || 'خطا در ایجاد دوره', true);
      }
    } catch (e) {
      showToast('خطای شبکه', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close Period Handler
  const handleClosePeriod = async (id, title) => {
    if (!confirm(`آیا از بستن و نهایی‌سازی دوره «${title}» اطمینان دارید؟`)) return;

    try {
      const res = await fetch(`/api/admin/periods/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CLOSED' })
      });
      if (res.ok) {
        showToast('دوره با موفقیت بسته شد');
        fetchPeriods();
        if (selectedPeriod?.id === id) setIsReportModalOpen(false);
      } else {
        showToast('خطا در بستن دوره', true);
      }
    } catch (e) {
      showToast('خطای شبکه', true);
    }
  };

  // Delete Period Handler
  const handleDeletePeriod = async (id, title) => {
    if (!confirm(`آیا از حذف دوره «${title}» اطمینان دارید؟`)) return;

    try {
      const res = await fetch(`/api/admin/periods/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('دوره با موفقیت حذف گردید');
        fetchPeriods();
        if (selectedPeriod?.id === id) setIsReportModalOpen(false);
      } else {
        showToast('خطا در حذف دوره', true);
      }
    } catch (e) {
      showToast('خطای شبکه', true);
    }
  };

  // Open Detailed Report Modal
  const openReportModal = async (periodId) => {
    setLoadingDetail(true);
    setIsReportModalOpen(true);
    try {
      const res = await fetch(`/api/admin/periods/${periodId}`);
      if (res.ok) {
        const detail = await res.json();
        setSelectedPeriod(detail);
      }
    } catch (e) {
      showToast('خطا در دریافت گزارش دوره', true);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-28 relative">
      <Header title="مدیریت دوره‌های انبارگردانی" showBack={true} />

      <div className="flex-1 p-4 md:p-6 w-full max-w-4xl mx-auto flex flex-col gap-6 mt-1">
        
        {/* Banner Action Bar */}
        <div className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
              <Calendar size={24} />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                دوره‌های انبارگردانی
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </h2>
              <p className="text-xs text-gray-500 font-bold mt-0.5">مدیریت، تفکیک انبارها و گزارش‌گیری جامع عملکرد</p>
            </div>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto bg-indigo-600 text-white px-5 py-3.5 rounded-2xl hover:bg-indigo-700 transition-all font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 scale-[1.01] active:scale-[0.99]"
          >
            <Plus size={18} />
            <span>تعریف دوره انبارگردانی جدید</span>
          </button>
        </div>

        {/* Periods List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : periods.length === 0 ? (
          <div className="bg-white rounded-[32px] p-12 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100 gap-3">
            <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-1">
              <Calendar size={32} />
            </div>
            <h3 className="font-black text-gray-800 text-base">هیچ دوره انبارگردانی تعریف نشده است</h3>
            <p className="text-xs text-gray-500 font-bold max-w-sm leading-relaxed">
              جهت شروع انبارگردانی جدید و تولید تسک‌های منحصر به فرد انبارها، دکمه بالا را فشارد دهید.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {periods.map(period => {
              const isActive = period.status === 'ACTIVE';
              const warehousesText = period.warehousesList.map(wId => {
                const found = warehouses.find(w => String(w.id) === String(wId));
                return found ? found.name : `انبار ${wId}`;
              }).join(' ، ');

              return (
                <motion.div 
                  key={period.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white border rounded-[28px] p-5 shadow-sm flex flex-col gap-4 transition-all relative ${
                    isActive ? 'border-indigo-100 hover:border-indigo-300' : 'border-gray-100 bg-gray-50/40'
                  }`}
                >
                  {/* Period Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1 border ${
                          isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-200 text-gray-600 border-gray-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                          {isActive ? 'دوره فعال (در حال شمارش)' : 'خاتمه‌یافته (بسته شده)'}
                        </span>

                        <span className="text-[11px] text-gray-400 font-bold dir-rtl">
                          ایجاد: {new Date(period.createdAt).toLocaleDateString('fa-IR')}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-gray-900 leading-snug">{period.title}</h3>
                      
                      <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold bg-indigo-50/70 px-3 py-1 rounded-xl w-fit border border-indigo-100">
                        <Warehouse size={14} />
                        <span>انبارهای هدف: {warehousesText || 'مشخص نشده'}</span>
                      </div>
                    </div>

                    {/* Progress Badge */}
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xl font-black text-indigo-600">{period.progressPercent}%</span>
                      <span className="text-[10px] font-bold text-gray-400">پیشرفت کل</span>
                    </div>
                  </div>

                  {/* Progress Bar Component */}
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden p-0.5 border border-gray-200/50">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${period.progressPercent}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full transition-all ${
                        period.progressPercent === 100 
                          ? 'bg-emerald-500' 
                          : period.progressPercent > 50 
                            ? 'bg-indigo-600' 
                            : 'bg-amber-500'
                      }`}
                    ></motion.div>
                  </div>

                  {/* Period Stats Summary Bar */}
                  <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-2xl text-center border border-gray-100 text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400">کل تسک‌ها</p>
                      <p className="font-black text-gray-800 text-sm mt-0.5">{period.totalTasks}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400">شمرده شده</p>
                      <p className="font-black text-emerald-600 text-sm mt-0.5">{period.completedTasks}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400">باقی‌مانده</p>
                      <p className="font-black text-amber-600 text-sm mt-0.5">{period.openTasks + period.inProgressTasks}</p>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-3 mt-1">
                    <button
                      onClick={() => openReportModal(period.id)}
                      className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <BarChart2 size={16} />
                      <span>گزارش جامع و نمودار عملکرد</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {isActive && (
                        <button
                          onClick={() => handleClosePeriod(period.id, period.title)}
                          className="bg-amber-50 text-amber-700 hover:bg-amber-100 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-amber-200"
                          title="بستن دوره"
                        >
                          <Lock size={14} />
                          <span>خاتمه دوره</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDeletePeriod(period.id, period.title)}
                        className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="حذف دوره"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create New Period Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={() => setIsCreateModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-[32px] p-6 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
                  <Calendar className="text-indigo-600" size={20} />
                  تعریف دوره جدید انبارگردانی
                </h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              {/* Period Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-700 px-1">عنوان دوره انبارگردانی</label>
                <input 
                  type="text" 
                  value={createForm.title}
                  onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="مثال: انبارگردانی جامع انبار ۱۱ و ۲۰ - پاییز ۱۴۰۴"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Warehouse Selection Checkboxes */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-700 px-1 flex items-center justify-between">
                  <span>انتخاب انبارهای هدف (اجماع انبارها):</span>
                  <span className="text-[10px] text-indigo-600 font-black">{createForm.warehouses.length} انبار انتخاب شده</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1">
                  {warehouses.map(w => {
                    const isSelected = createForm.warehouses.includes(String(w.id));
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => toggleWarehouse(String(w.id))}
                        className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between border transition-all ${
                          isSelected 
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-800 shadow-sm' 
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Warehouse size={16} className={isSelected ? 'text-indigo-600' : 'text-gray-400'} />
                          <span>{w.name}</span>
                        </div>
                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300'}`}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Informational Alert */}
              <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 text-[11px] font-bold text-indigo-900 leading-relaxed">
                📍 با ایجاد این دوره، تسک‌های برگی (Leaf Nodes) تمامی انبارهای انتخاب‌شده استخراج شده و بدون انتشار تکراری تا پایان این دوره تحت نظارت خواهند بود.
              </div>

              {/* Form Buttons */}
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-2xl text-xs font-extrabold hover:bg-gray-200 transition-colors"
                >
                  انصراف
                </button>
                <button 
                  onClick={handleCreatePeriod}
                  disabled={isSubmitting}
                  className="flex-1 bg-indigo-600 text-white py-3.5 rounded-2xl text-xs font-black hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-50"
                >
                  {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'ایجاد دوره و ساخت تسک‌ها'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comprehensive Period Report Modal */}
      <AnimatePresence>
        {isReportModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={() => setIsReportModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl bg-white rounded-[32px] p-6 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <BarChart2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-base">گزارش جامع دوره انبارگردانی</h3>
                    <p className="text-[11px] text-gray-400 font-bold">{selectedPeriod?.title}</p>
                  </div>
                </div>
                <button onClick={() => setIsReportModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              {loadingDetail || !selectedPeriod ? (
                <div className="flex justify-center py-16">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  
                  {/* Overall Progress Gauge */}
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col gap-3">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-gray-700 flex items-center gap-1.5">
                        <TrendingUp size={16} className="text-indigo-600" />
                        درصد کل انبارگردانی دوره:
                      </span>
                      <span className="text-indigo-600 font-black text-base">{selectedPeriod.progressPercent}%</span>
                    </div>

                    <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden p-0.5">
                      <div 
                        style={{ width: `${selectedPeriod.progressPercent}%` }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                      ></div>
                    </div>
                  </div>

                  {/* Breakdown 1: By Warehouse */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-black text-gray-800 flex items-center gap-2">
                      <Warehouse size={16} className="text-indigo-600" />
                      تفکیک وضعیت به ازای انبارها:
                    </h4>

                    <div className="grid gap-2.5">
                      {selectedPeriod.warehouseStats?.map(wStat => {
                        const foundW = warehouses.find(w => String(w.id) === String(wStat.warehouse));
                        const wName = foundW ? foundW.name : `انبار ${wStat.warehouse}`;
                        const wPercent = wStat.total > 0 ? Math.round((wStat.completed / wStat.total) * 100) : 0;

                        return (
                          <div key={wStat.warehouse} className="bg-white border border-gray-100 rounded-2xl p-3.5 flex flex-col gap-2">
                            <div className="flex justify-between items-center text-xs font-bold">
                              <span className="text-gray-800">{wName}</span>
                              <span className="text-indigo-600 font-extrabold">{wStat.completed} از {wStat.total} تسک ({wPercent}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                              <div style={{ width: `${wPercent}%` }} className="h-full bg-indigo-500 rounded-full"></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Breakdown 2: Personnel Performance */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-black text-gray-800 flex items-center gap-2">
                      <Users size={16} className="text-indigo-600" />
                      عملکرد انبارگردان‌ها در این دوره:
                    </h4>

                    {selectedPeriod.personnelBreakdown?.length === 0 ? (
                      <p className="text-xs text-gray-400 font-bold text-center py-4 bg-gray-50 rounded-2xl">هنوز هیچ شمرده‌ای در این دوره توسط انبارگردان‌ها ثبت نشده است.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {selectedPeriod.personnelBreakdown?.map(person => (
                          <div key={person.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-3.5 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-black flex items-center justify-center">
                                {person.name.charAt(0)}
                              </div>
                              <span className="font-bold text-gray-800">{person.name}</span>
                            </div>
                            <span className="px-3 py-1 bg-white border border-gray-200 rounded-xl font-black text-indigo-600">
                              {person.countings} شمارش ثبت‌شده
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Alert */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl shadow-xl backdrop-blur-3xl border text-xs font-bold whitespace-nowrap flex items-center justify-center gap-2 ${toast.isError ? 'bg-red-50/90 border-red-100 text-red-600' : 'bg-white/90 border-gray-100 text-gray-800'}`}
          >
            {toast.isError ? <AlertCircle size={16} /> : <CheckCircle size={16} className="text-emerald-500" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
