'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Trophy, AlertTriangle, Activity, BarChart2, CheckCircle2, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReportsPage() {
  const [data, setData] = useState({ topPerformers: [], mostDiscrepancies: [], all: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/leaderboard')
      .then(res => res.json())
      .then(d => {
        if (d.topPerformers) setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex flex-col">
        <Header title="گزارشات پرسنل" showBack={true} />
        <div className="flex-1 flex justify-center items-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24 relative">
      <Header title="گزارشات و عملکرد" showBack={true} />

      <div className="flex-1 p-4 md:p-6 flex flex-col gap-6 max-w-4xl mx-auto w-full mt-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-black text-gray-800 tracking-tight flex items-center gap-2">
            <BarChart2 className="text-indigo-600" size={24} strokeWidth={2.5} />
            کارنامه عملکرد تیم
          </h2>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            بررسی جامع آمار انبارگردانی، برترین‌ها و میزان خطاهای ثبت شده
          </p>
        </div>

        {/* Top Performers */}
        <div className="bg-white border border-indigo-100 rounded-[24px] p-5 shadow-sm flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-bl-full z-0"></div>
          
          <div className="flex items-center gap-2 relative z-10">
            <Trophy className="text-yellow-500" size={20} strokeWidth={2.5} />
            <h3 className="font-bold text-gray-800">برترین انبارگردان‌ها</h3>
          </div>

          <div className="flex flex-col gap-3 relative z-10">
            {data.topPerformers.map((user, idx) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-[16px] border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-sm ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-indigo-400'}`}>
                    {idx + 1}
                  </div>
                  <span className="font-bold text-gray-800 text-sm">{user.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-gray-400 font-bold">شمارش‌ها</span>
                    <span className="text-sm font-black text-indigo-600">{user.totalCounted}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-gray-400 font-bold">دقت عملکرد</span>
                    <span className="text-sm font-black text-green-600">{user.accuracy}%</span>
                  </div>
                </div>
              </div>
            ))}
            {data.topPerformers.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">هنوز هیچ انبارگردانی ثبت نشده است.</p>
            )}
          </div>
        </div>

        {/* Most Discrepancies */}
        <div className="bg-white border border-red-100 rounded-[24px] p-5 shadow-sm flex flex-col gap-4 relative overflow-hidden">
          <div className="flex items-center gap-2 relative z-10">
            <AlertTriangle className="text-red-500" size={20} strokeWidth={2.5} />
            <h3 className="font-bold text-gray-800">بیشترین مغایرت‌های ثبت شده</h3>
          </div>

          <div className="flex flex-col gap-3 relative z-10">
            {data.mostDiscrepancies.filter(u => u.discrepancies > 0).map((user, idx) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-red-50/30 rounded-[16px] border border-red-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center font-black text-xs text-red-600">
                    {idx + 1}
                  </div>
                  <span className="font-bold text-gray-800 text-sm">{user.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-red-400 font-bold">مغایرت‌ها</span>
                    <span className="text-sm font-black text-red-600">{user.discrepancies}</span>
                  </div>
                </div>
              </div>
            ))}
            {data.mostDiscrepancies.filter(u => u.discrepancies > 0).length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">خوشبختانه هیچ کاربری مغایرتی نداشته است.</p>
            )}
          </div>
        </div>

        {/* Full Details */}
        <div className="bg-white border border-gray-100 rounded-[24px] overflow-hidden shadow-sm flex flex-col mt-2">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Activity className="text-gray-500" size={18} />
              جزئیات عملکرد همه پرسنل
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-widest border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3">نام کاربر</th>
                  <th className="px-5 py-3 text-center">تعداد شمارش</th>
                  <th className="px-5 py-3 text-center">قفسه‌های پوشش داده</th>
                  <th className="px-5 py-3 text-center">خطا/مغایرت</th>
                  <th className="px-5 py-3 text-center">لغو شده</th>
                  <th className="px-5 py-3 text-left">دقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.all.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 font-bold text-gray-800">{user.name}</td>
                    <td className="px-5 py-4 text-center font-black text-indigo-600">{user.totalCounted}</td>
                    <td className="px-5 py-4 text-center font-bold text-gray-600">{user.uniqueShelves}</td>
                    <td className="px-5 py-4 text-center font-bold text-red-500">{user.discrepancies}</td>
                    <td className="px-5 py-4 text-center font-bold text-orange-500">{user.cancelled}</td>
                    <td className="px-5 py-4 text-left">
                      <div className="flex items-center justify-end gap-1 font-black text-green-600">
                        {user.accuracy}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
