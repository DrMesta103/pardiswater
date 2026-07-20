'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Activity, Search, Filter, CalendarDays, History, X } from 'lucide-react';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const take = 50;

  const actionTypes = [
    { id: 'ALL', label: 'همه عملیات‌ها' },
    { id: 'LOGIN', label: 'ورود' },
    { id: 'CANCEL_COUNTING', label: 'لغو انبارگردانی' },
  ];

  useEffect(() => {
    fetchLogs();
  }, [page, typeFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * take;
      const res = await fetch(`/api/logs?skip=${skip}&take=${take}&type=${typeFilter}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / take);

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24 relative">
      <Header title="لاگ عملیات سیستم" showBack={true} />

      <div className="flex-1 p-4 md:p-6 flex flex-col gap-6 max-w-4xl mx-auto w-full mt-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2">
            <Activity className="text-indigo-600" size={24} strokeWidth={2.5} />
            رهگیری فعالیت کاربران
          </h2>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            گزارش کامل عملیات‌های حساس از جمله ورود، لغو انبارگردانی و ...
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-600 ml-2">
            <Filter size={16} /> فیلتر نوع:
          </div>
          {actionTypes.map(t => (
            <button
              key={t.id}
              onClick={() => { setTypeFilter(t.id); setPage(1); }}
              className={`px-4 py-2 rounded-[14px] text-xs font-bold transition-all border ${
                typeFilter === t.id 
                ? 'bg-gray-900 text-white border-gray-900 shadow-md' 
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Logs List */}
        <div className="bg-white border border-gray-100 rounded-[24px] overflow-hidden shadow-sm flex flex-col">
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-right text-sm min-w-[600px]">
              <thead className="bg-gray-50 text-gray-500 text-xs font-bold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">کاربر</th>
                  <th className="px-6 py-4">نوع عملیات</th>
                  <th className="px-6 py-4">جزئیات</th>
                  <th className="px-6 py-4 text-left">تاریخ و زمان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
                          {log.user?.name ? log.user.name.charAt(0) : '?'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800 text-xs">{log.user?.name || 'ناشناس'}</span>
                          <span className="text-[10px] text-gray-400 font-medium dir-ltr text-right">{log.user?.username}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${
                        log.action === 'CANCEL_COUNTING' ? 'bg-red-50 text-red-600' :
                        log.action === 'LOGIN' ? 'bg-green-50 text-green-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-600 font-medium leading-relaxed max-w-xs truncate">
                        {log.details || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-left">
                      <div className="flex items-center justify-end gap-1.5 text-[10px] font-bold text-gray-500 dir-ltr">
                        {new Date(log.createdAt).toLocaleString('fa-IR')}
                        <CalendarDays size={12} className="text-gray-400" />
                      </div>
                    </td>
                  </tr>
                ))}
                
                {logs.length === 0 && !loading && (
                  <tr>
                    <td colSpan="4" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <History size={32} className="text-gray-300" />
                        <span className="text-gray-500 font-bold text-sm">هیچ لاگی یافت نشد.</span>
                      </div>
                    </td>
                  </tr>
                )}
                
                {loading && (
                  <tr>
                    <td colSpan="4" className="px-6 py-16 text-center text-indigo-500 font-bold">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs">در حال دریافت لاگ‌ها...</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 text-xs font-bold text-gray-600">
              <span>تعداد کل: {total}</span>
              <div className="flex items-center gap-2">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  قبلی
                </button>
                <span>صفحه {page} از {totalPages}</span>
                <button 
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  بعدی
                </button>
              </div>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
