'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, Trash2, Edit, Check, XCircle, User, 
  Layers, ScanLine, RotateCcw, MoreVertical, Search, Filter, 
  UserCheck, UserX, AlertCircle, RefreshCw, Calendar
} from 'lucide-react';

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', isError: false });

  // Active Tab: 'SHELF' (SYSTEM_LOCATION) or 'ITEM' (SYSTEM_ITEM)
  const [activeTab, setActiveTab] = useState('SHELF');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState('ALL'); // ALL, UNASSIGNED, or userId
  const [selectedAssignment, setSelectedAssignment] = useState('ALL'); // ALL, ASSIGNED, UNASSIGNED
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // ALL, OPEN, IN_PROGRESS, COMPLETED, CANCELLED
  const [selectedDateFilter, setSelectedDateFilter] = useState('ALL'); // ALL, TODAY, WEEK

  // Modals & Menus
  const [openMenuId, setOpenMenuId] = useState(null);
  const [assignModal, setAssignModal] = useState({ isOpen: false, task: null });
  const [statusModal, setStatusModal] = useState({ isOpen: false, task: null });
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);

  useEffect(() => {
    fetchData();
    fetchUsers();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tasks');
      if (res.ok) setTasks(await res.json());
    } catch (e) {
      showToast('خطای شبکه در دریافت تسک‌ها', true);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsers(await res.json());
    } catch (e) {}
  };

  const showToast = (message, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => setToast({ show: false, message: '', isError: false }), 3500);
  };

  // Reset Tasks Handler
  const handleResetTasks = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/admin/tasks/reset', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'تسک‌ها با موفقیت ریست شدند');
        setResetModalOpen(false);
        fetchData();
      } else {
        showToast(data.error || 'خطا در ریست تسک‌ها', true);
      }
    } catch (e) {
      showToast('خطای شبکه', true);
    } finally {
      setIsResetting(false);
    }
  };

  // Delete Handler
  const handleDelete = async (id) => {
    if (!confirm('آیا از حذف این تسک اطمینان دارید؟')) return;
    setIsDeleting(id);
    setOpenMenuId(null);
    try {
      const res = await fetch(`/api/admin/tasks?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('تسک با موفقیت حذف شد');
        setTasks(tasks.filter(t => t.id !== id));
      } else {
        showToast('خطا در حذف تسک', true);
      }
    } catch (e) {
      showToast('خطای شبکه', true);
    } finally {
      setIsDeleting(null);
    }
  };

  // Quick Assign / Unassign Update
  const handleUpdateAssignee = async (taskId, newAssigneeId) => {
    setOpenMenuId(null);
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          assignedTo: newAssigneeId === null || newAssigneeId === '' ? null : Number(newAssigneeId)
        })
      });
      if (res.ok) {
        showToast('ارجاع تسک با موفقیت بروزرسانی شد');
        setAssignModal({ isOpen: false, task: null });
        fetchData();
      } else {
        showToast('خطا در بروزرسانی ارجاع تسک', true);
      }
    } catch (e) {
      showToast('خطای شبکه', true);
    }
  };

  // Status Update
  const handleUpdateStatus = async (taskId, newStatus) => {
    setOpenMenuId(null);
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          status: newStatus
        })
      });
      if (res.ok) {
        showToast('وضعیت تسک با موفقیت تغییر کرد');
        setStatusModal({ isOpen: false, task: null });
        fetchData();
      } else {
        showToast('خطا در تغییر وضعیت تسک', true);
      }
    } catch (e) {
      showToast('خطای شبکه', true);
    }
  };

  // Helper Labels & Badges
  const getStatusBadge = (status) => {
    switch(status) {
      case 'COMPLETED':
        return { label: 'انجام شده', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'IN_PROGRESS':
        return { label: 'در حال انجام', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'CANCELLED':
        return { label: 'لغو شده', bg: 'bg-gray-100 text-gray-500 border-gray-200' };
      default:
        return { label: 'جدید (در صف)', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
  };

  // Tab Filtering
  const shelfTasks = tasks.filter(t => t.type === 'SYSTEM_LOCATION');
  const itemTasks = tasks.filter(t => t.type === 'SYSTEM_ITEM');

  const currentTabTasks = activeTab === 'SHELF' ? shelfTasks : itemTasks;

  // Filter Logic
  const filteredTasks = currentTabTasks.filter(task => {
    // 1. Search Query
    const query = searchQuery.trim().toLowerCase();
    const matchesTarget = (task.targetName || '').toLowerCase().includes(query) || (task.targetId || '').toLowerCase().includes(query);
    const matchesPath = (task.fullPath || '').toLowerCase().includes(query);
    const matchesAssignee = (task.assignee?.name || '').toLowerCase().includes(query) || (task.assignee?.username || '').toLowerCase().includes(query);
    const matchesSearch = !query || matchesTarget || matchesPath || matchesAssignee;

    // 2. User Filter
    let matchesUser = true;
    if (selectedUser === 'UNASSIGNED') {
      matchesUser = !task.assignedTo;
    } else if (selectedUser !== 'ALL') {
      matchesUser = task.assignedTo === Number(selectedUser);
    }

    // 3. Assignment Status Filter
    let matchesAssignment = true;
    if (selectedAssignment === 'ASSIGNED') matchesAssignment = !!task.assignedTo;
    if (selectedAssignment === 'UNASSIGNED') matchesAssignment = !task.assignedTo;

    // 4. Task Status Filter
    let matchesStatus = true;
    if (selectedStatus !== 'ALL') matchesStatus = task.status === selectedStatus;

    // 5. Date Filter
    let matchesDate = true;
    if (selectedDateFilter === 'TODAY') {
      const today = new Date().toDateString();
      matchesDate = new Date(task.createdAt).toDateString() === today;
    } else if (selectedDateFilter === 'WEEK') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      matchesDate = new Date(task.createdAt) >= sevenDaysAgo;
    }

    return matchesSearch && matchesUser && matchesAssignment && matchesStatus && matchesDate;
  });

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-28 relative">
      <Header title="مدیریت تسک‌های انبار" showBack={true} />

      <div className="flex-1 p-4 md:p-6 w-full max-w-4xl mx-auto flex flex-col gap-5 mt-1">
        
        {/* Top Control Bar with Reset Button & Live Indicator */}
        <div className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
              <ClipboardList size={22} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                مدیریت و ارجاع تسک‌ها
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </h2>
              <p className="text-[11px] text-gray-400 font-medium">مشاهده، تخصیص و تنظیم مجدد تسک‌های انبارگردانی</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => fetchData()}
              className="p-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              title="بروزرسانی لیست"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={() => setResetModalOpen(true)}
              className="flex-1 sm:flex-none bg-indigo-600 text-white px-4 py-3 rounded-xl hover:bg-indigo-700 transition-colors text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-indigo-100"
            >
              <RotateCcw size={16} />
              <span>بازسازی و ریست تسک‌ها</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation: Shelf Tasks vs Item Tasks */}
        <div className="grid grid-cols-2 bg-gray-200/70 p-1.5 rounded-[20px] gap-2">
          <button
            onClick={() => setActiveTab('SHELF')}
            className={`py-3 rounded-[16px] text-xs font-black flex items-center justify-center gap-2 transition-all ${
              activeTab === 'SHELF'
                ? 'bg-white text-indigo-600 shadow-md scale-[1.01]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Layers size={18} />
            <span>تسک‌های قفسه‌ای</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === 'SHELF' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-300 text-gray-700'}`}>
              {shelfTasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ITEM')}
            className={`py-3 rounded-[16px] text-xs font-black flex items-center justify-center gap-2 transition-all ${
              activeTab === 'ITEM'
                ? 'bg-white text-indigo-600 shadow-md scale-[1.01]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ScanLine size={18} />
            <span>تسک‌های کالایی و مغایرت</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === 'ITEM' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-300 text-gray-700'}`}>
              {itemTasks.length}
            </span>
          </button>
        </div>

        {/* Search & Multi-Filter Bar */}
        <div className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
          {/* Search Box */}
          <div className="relative w-full">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'SHELF' ? "جستجوی کد یا نام قفسه، آدرس، نام انبارگردان..." : "جستجوی عنوان کالا، کد کالا، نام انبارگردان..."}
              className="w-full bg-gray-50 border border-gray-200 rounded-[16px] pr-11 pl-4 py-3 text-xs font-bold text-gray-800 focus:outline-none focus:border-indigo-500 transition-all placeholder:font-normal"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XCircle size={16} />
              </button>
            )}
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {/* Filter 1: Employee */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-500 pr-1 flex items-center gap-1">
                <User size={12} />
                کارمند / انبارگردان
              </label>
              <select
                value={selectedUser}
                onChange={e => setSelectedUser(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">همه کاربران</option>
                <option value="UNASSIGNED">عمومی (بدون مجری)</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.username})</option>
                ))}
              </select>
            </div>

            {/* Filter 2: Assignment Status */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-500 pr-1 flex items-center gap-1">
                <UserCheck size={12} />
                وضعیت انتصاب
              </label>
              <select
                value={selectedAssignment}
                onChange={e => setSelectedAssignment(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">همه انتصاب‌ها</option>
                <option value="ASSIGNED">تخصیص‌یافته</option>
                <option value="UNASSIGNED">عمومی (در صف)</option>
              </select>
            </div>

            {/* Filter 3: Task Status */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-500 pr-1 flex items-center gap-1">
                <Filter size={12} />
                وضعیت انجام
              </label>
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">همه وضعیت‌ها</option>
                <option value="OPEN">جدید (OPEN)</option>
                <option value="IN_PROGRESS">در حال انجام</option>
                <option value="COMPLETED">انجام شده</option>
                <option value="CANCELLED">لغو شده</option>
              </select>
            </div>

            {/* Filter 4: Date Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-500 pr-1 flex items-center gap-1">
                <Calendar size={12} />
                تاریخ ایجاد
              </label>
              <select
                value={selectedDateFilter}
                onChange={e => setSelectedDateFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">همه تواریخ</option>
                <option value="TODAY">امروز</option>
                <option value="WEEK">۷ روز اخیر</option>
              </select>
            </div>
          </div>
        </div>

        {/* Task Cards List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100 gap-3">
            <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-1">
              <ClipboardList size={32} />
            </div>
            <h3 className="font-bold text-gray-800">هیچ تسکی با این مشخصات پیدا نشد</h3>
            <p className="text-xs text-gray-500 font-bold max-w-sm leading-relaxed">
              می‌توانید فیلترهای جستجو را پاک کنید یا دکمه «بازسازی و ریست تسک‌ها» را فشار دهید.
            </p>
          </div>
        ) : (
          <div className="grid gap-3.5">
            {filteredTasks.map(task => {
              const statusInfo = getStatusBadge(task.status);
              const isAssigned = !!task.assignedTo;

              return (
                <motion.div 
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-100 rounded-[24px] p-4 flex flex-col md:flex-row items-start md:items-center justify-between shadow-sm gap-4 hover:border-indigo-200 transition-all relative"
                >
                  <div className="flex items-start gap-3.5 flex-1 pr-1">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${task.type === 'SYSTEM_LOCATION' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                      {task.type === 'SYSTEM_LOCATION' ? <Layers size={24} /> : <ScanLine size={24} />}
                    </div>

                    {/* Task Info */}
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                          {task.type === 'SYSTEM_LOCATION' ? 'شمارش قفسه' : 'شمارش کالا'}
                          <span>•</span>
                          {new Date(task.createdAt).toLocaleDateString('fa-IR')}
                        </span>

                        {/* Status Badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${statusInfo.bg}`}>
                          {statusInfo.label}
                        </span>

                        {/* Assignment Status Badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${isAssigned ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          {isAssigned ? <UserCheck size={11} /> : <UserX size={11} />}
                          {isAssigned ? `مختص ${task.assignee?.name || 'انبارگردان'}` : 'عمومی (صف سیستم)'}
                        </span>
                      </div>

                      <h4 className="text-sm font-black text-gray-900 leading-snug">{task.targetName}</h4>
                      
                      {task.fullPath && (
                        <p className="text-[11px] font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-xl w-fit border border-gray-100 mt-0.5">
                          📍 {task.fullPath}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions & Three-dots Menu */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => setAssignModal({ isOpen: true, task })}
                      className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <User size={14} />
                      <span>{isAssigned ? 'تغییر مجری' : 'تخصیص'}</span>
                    </button>

                    {/* Three-dots Menu Button */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === task.id ? null : task.id)}
                        className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {/* Dropdown Menu Popup */}
                      <AnimatePresence>
                        {openMenuId === task.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute left-0 top-12 z-40 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 w-48 flex flex-col gap-1 text-xs font-bold text-gray-700"
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              onClick={() => { setAssignModal({ isOpen: true, task }); setOpenMenuId(null); }}
                              className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 transition-colors"
                            >
                              <User size={14} />
                              <span>{isAssigned ? 'تغییر / سلب انتصاب' : 'تخصیص به کارمند'}</span>
                            </button>

                            <button
                              onClick={() => { setStatusModal({ isOpen: true, task }); setOpenMenuId(null); }}
                              className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
                            >
                              <Edit size={14} />
                              <span>تغییر وضعیت تسک</span>
                            </button>

                            <div className="h-px bg-gray-100 my-0.5"></div>

                            <button
                              onClick={() => handleDelete(task.id)}
                              disabled={isDeleting === task.id}
                              className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-red-50 hover:text-red-600 text-red-500 flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                              <Trash2 size={14} />
                              <span>حذف تسک</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {resetModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-5"
            onClick={() => setResetModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl flex flex-col gap-4 text-center"
            >
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                <RotateCcw size={28} />
              </div>

              <h3 className="font-black text-gray-900 text-lg">بازسازی و ریست تسک‌ها</h3>
              <p className="text-xs text-gray-500 font-bold leading-relaxed px-2">
                با تایید این عملیات، تمامی تسک‌های انجام‌نشده (جدید و در حال انجام) پاک شده و سیستم مجدداً بر اساس **ریزترین قفسه‌ها (Leaf Nodes)** تسک‌های جدید ایجاد می‌کند.
              </p>

              <div className="flex gap-3 mt-3">
                <button 
                  onClick={() => setResetModalOpen(false)}
                  disabled={isResetting}
                  className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-[16px] text-xs font-extrabold hover:bg-gray-200 transition-colors"
                >
                  انصراف
                </button>
                <button 
                  onClick={handleResetTasks}
                  disabled={isResetting}
                  className="flex-1 bg-indigo-600 text-white py-3.5 rounded-[16px] text-xs font-black hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-indigo-100 disabled:opacity-50"
                >
                  {isResetting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'تایید و بازسازی'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assignee Edit Modal */}
      <AnimatePresence>
        {assignModal.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-5"
            onClick={() => setAssignModal({ isOpen: false, task: null })}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl flex flex-col gap-4"
            >
              <h3 className="font-black text-gray-800 text-base flex items-center gap-2">
                <User size={18} className="text-indigo-500" />
                تخصیص / تغییر مجری تسک
              </h3>
              
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-xs font-bold text-gray-700">
                قفسه/کالا: <span className="text-indigo-600">{assignModal.task?.targetName}</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 px-1">انتخاب انبارگردان</label>
                <select 
                  value={assignModal.task?.assignedTo || ''}
                  onChange={(e) => setAssignModal({ ...assignModal, task: { ...assignModal.task, assignedTo: e.target.value === '' ? null : Number(e.target.value) }})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-[14px] px-4 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">عمومی (صف سیستم - تخصیص به اولین نفر آزاد)</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.username})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 mt-3">
                <button 
                  onClick={() => setAssignModal({ isOpen: false, task: null })}
                  className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-[16px] text-xs font-extrabold hover:bg-gray-200 transition-colors"
                >
                  انصراف
                </button>
                <button 
                  onClick={() => handleUpdateAssignee(assignModal.task.id, assignModal.task.assignedTo)}
                  className="flex-1 bg-indigo-600 text-white py-3.5 rounded-[16px] text-xs font-black hover:bg-indigo-700 transition-colors shadow-md"
                >
                  ذخیره ارجاع
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Status Modal */}
      <AnimatePresence>
        {statusModal.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-5"
            onClick={() => setStatusModal({ isOpen: false, task: null })}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl flex flex-col gap-4"
            >
              <h3 className="font-black text-gray-800 text-base flex items-center gap-2">
                <Edit size={18} className="text-indigo-500" />
                تغییر وضعیت تسک
              </h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 px-1">وضعیت جدید</label>
                <select 
                  value={statusModal.task?.status || 'OPEN'}
                  onChange={(e) => setStatusModal({ ...statusModal, task: { ...statusModal.task, status: e.target.value }})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-[14px] px-4 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="OPEN">جدید (OPEN)</option>
                  <option value="IN_PROGRESS">در حال انجام</option>
                  <option value="COMPLETED">انجام شده</option>
                  <option value="CANCELLED">لغو شده</option>
                </select>
              </div>

              <div className="flex gap-3 mt-3">
                <button 
                  onClick={() => setStatusModal({ isOpen: false, task: null })}
                  className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-[16px] text-xs font-extrabold hover:bg-gray-200 transition-colors"
                >
                  انصراف
                </button>
                <button 
                  onClick={() => handleUpdateStatus(statusModal.task.id, statusModal.task.status)}
                  className="flex-1 bg-indigo-600 text-white py-3.5 rounded-[16px] text-xs font-black hover:bg-indigo-700 transition-colors shadow-md"
                >
                  ذخیره وضعیت
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl shadow-xl backdrop-blur-3xl border text-xs font-bold whitespace-nowrap flex items-center justify-center gap-2 ${toast.isError ? 'bg-red-50/90 border-red-100 text-red-600' : 'bg-white/90 border-gray-100 text-gray-800'}`}
          >
            {toast.isError ? <XCircle size={16} /> : <Check size={16} className="text-emerald-500" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
