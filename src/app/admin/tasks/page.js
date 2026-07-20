'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Trash2, Edit, AlertCircle, Check, XCircle, User, Activity, ScanLine, Layers } from 'lucide-react';

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', isError: false });
  const [editModal, setEditModal] = useState({ isOpen: false, task: null });
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
      showToast('خطای شبکه', true);
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
    setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
  };

  const handleDelete = async (id) => {
    if (!confirm('آیا از حذف این تسک اطمینان دارید؟')) return;
    setIsDeleting(id);
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

  const handleUpdate = async () => {
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editModal.task.id,
          assignedTo: editModal.task.assignedTo,
          status: editModal.task.status
        })
      });
      if (res.ok) {
        showToast('تسک با موفقیت بروزرسانی شد');
        setEditModal({ isOpen: false, task: null });
        fetchData(); // reload
      } else {
        showToast('خطا در بروزرسانی تسک', true);
      }
    } catch (e) {
      showToast('خطای شبکه', true);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'IN_PROGRESS': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'CANCELLED': return 'bg-gray-100 text-gray-500 border-gray-200';
      default: return 'bg-orange-50 text-orange-600 border-orange-100';
    }
  };
  const getStatusLabel = (status) => {
    switch(status) {
      case 'COMPLETED': return 'انجام شده';
      case 'IN_PROGRESS': return 'در حال انجام';
      case 'CANCELLED': return 'لغو شده';
      default: return 'باز (جدید)';
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24 relative">
      <Header title="مدیریت تسک‌ها" showBack={true} />

      <div className="flex-1 p-4 md:p-6 w-full max-w-4xl mx-auto flex flex-col gap-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-sm border border-gray-100 gap-3">
            <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-2">
              <ClipboardList size={32} />
            </div>
            <h3 className="font-bold text-gray-800">هیچ تسکی وجود ندارد</h3>
            <p className="text-xs text-gray-500 font-bold">می‌توانید از طریق داشبورد سیستم تسک‌های جدیدی ایجاد کنید.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {tasks.map(task => (
              <motion.div 
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between shadow-sm gap-4 hover:border-indigo-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    {task.type === 'SYSTEM_LOCATION' ? <Layers size={24} /> : <ScanLine size={24} />}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                      {task.type === 'SYSTEM_LOCATION' ? 'شمارش قفسه' : 'شمارش کالا'}
                      <span className="mx-1">•</span>
                      ایجاد: {new Date(task.createdAt).toLocaleDateString('fa-IR')}
                    </span>
                    <span className="text-sm font-black text-gray-900 uppercase tracking-widest">{task.targetName}</span>
                    {task.fullPath && (
                      <span className="text-[10px] text-gray-500 font-bold mb-1">{task.fullPath}</span>
                    )}
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${getStatusColor(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </span>
                      <span className="bg-gray-100 text-gray-600 text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <User size={10} />
                        {task.assignee ? task.assignee.name : 'در صف سیستم (تخصیص اتومات)'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                  <button
                    onClick={() => setEditModal({ isOpen: true, task })}
                    className="flex-1 md:flex-none bg-blue-50 text-blue-600 p-2.5 rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-xs font-bold"
                  >
                    <Edit size={16} />
                    <span>ویرایش</span>
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    disabled={isDeleting === task.id}
                    className="bg-red-50 text-red-600 p-2.5 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    {isDeleting === task.id ? <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div> : <Trash2 size={16} />}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {editModal.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-5"
            onClick={() => setEditModal({ isOpen: false, task: null })}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl flex flex-col gap-4"
            >
              <h3 className="font-black text-gray-800 text-lg mb-2 flex items-center gap-2">
                <Edit size={20} className="text-indigo-500" />
                ویرایش تسک
              </h3>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-600 px-1">ارجاع به کاربر</label>
                <select 
                  value={editModal.task?.assignedTo || ''}
                  onChange={(e) => setEditModal({ ...editModal, task: { ...editModal.task, assignedTo: e.target.value === '' ? null : Number(e.target.value) }})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-[14px] px-4 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">بدون صاحب (صف سیستم)</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.username})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-xs font-bold text-gray-600 px-1">وضعیت تسک</label>
                <select 
                  value={editModal.task?.status || 'OPEN'}
                  onChange={(e) => setEditModal({ ...editModal, task: { ...editModal.task, status: e.target.value }})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-[14px] px-4 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="OPEN">باز (جدید)</option>
                  <option value="IN_PROGRESS">در حال انجام</option>
                  <option value="COMPLETED">انجام شده</option>
                  <option value="CANCELLED">لغو شده</option>
                </select>
              </div>
              
              <div className="flex gap-3 mt-4">
                <button 
                  onClick={() => setEditModal({ isOpen: false, task: null })}
                  className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-[16px] text-sm font-black hover:bg-gray-200 transition-colors"
                >
                  انصراف
                </button>
                <button 
                  onClick={handleUpdate}
                  className="flex-1 bg-indigo-600 text-white py-3.5 rounded-[16px] text-sm font-black hover:bg-indigo-700 transition-colors"
                >
                  ذخیره تغییرات
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl shadow-xl backdrop-blur-3xl border text-xs font-bold whitespace-nowrap flex items-center justify-center gap-2 ${toast.isError ? 'bg-red-50/90 border-red-100 text-red-600' : 'bg-white/90 border-gray-100 text-gray-800'}`}
          >
            {toast.isError ? <XCircle size={14} /> : <Check size={14} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
