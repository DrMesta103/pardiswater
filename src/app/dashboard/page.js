'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { History, ScanLine, ListChecks, AlertTriangle, Layers, MapPin, ClipboardList } from 'lucide-react';

export default function Dashboard() {
  const [uncountedShelves, setUncountedShelves] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [settings, setSettings] = useState(null);
  const [user, setUser] = useState(null);
  const [systemTasks, setSystemTasks] = useState([]);
  
  useEffect(() => {
    const userData = localStorage.getItem('user');
    let u = null;
    if (userData) {
      u = JSON.parse(userData);
      setUser(u);
    }
    fetchData(u);
  }, []);

  const fetchData = async (currentUser) => {
    try {
      const setRes = await fetch('/api/settings');
      let currentSettings = { uncounted_shelf_days: 10, show_suggested_shelves: true };
      if (setRes.ok) {
        currentSettings = await setRes.json();
        setSettings(currentSettings);
      }

      if (currentUser?.id) {
        // Fetch System Tasks
        const taskRes = await fetch(`/api/tasks/my-task?userId=${currentUser.id}`);
        if (taskRes.ok) {
          const taskData = await taskRes.json();
          if (taskData.tasks && taskData.tasks.length > 0) {
            setSystemTasks(taskData.tasks);
          }
        }

        const actRes = await fetch(`/api/locations/active?userId=${currentUser.id}`);
        if (actRes.ok) {
          const actData = await actRes.json();
          setActiveSessions(actData.active || []);
        }
      }

      if (currentSettings.show_suggested_shelves !== false) {
        const uncRes = await fetch(`/api/reports/uncounted?days=${currentSettings.uncounted_shelf_days || 10}`);
        if (uncRes.ok) {
          const uncData = await uncRes.json();
          setUncountedShelves(uncData.uncounted || []);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col pb-24">
      <Header title="داشبورد" />
      
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="p-4 md:p-6 flex flex-col gap-6 max-w-lg mx-auto w-full mt-2"
      >
        {/* System Assigned Tasks (Minimal) */}
        {systemTasks.length > 0 && (
          <motion.div variants={item} className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-indigo-700">
                <ClipboardList size={18} strokeWidth={2.5} />
                <h3 className="text-sm font-black tracking-tight">تسک‌های محول شده سیستم</h3>
              </div>
              <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-[10px] font-bold">
                {systemTasks.length} تسک فعال
              </span>
            </div>
            
            <div className="grid gap-3">
              {systemTasks.map((task, idx) => (
                <div key={task.id || idx} className="bg-white border-2 border-indigo-100 rounded-[20px] p-3 flex items-center justify-between shadow-sm hover:border-indigo-300 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                      {task.type === 'SYSTEM_LOCATION' ? <Layers size={20} /> : <ScanLine size={20} />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-500 font-bold mb-0.5">
                        {task.type === 'SYSTEM_LOCATION' ? 'شمارش قفسه' : 'شمارش کالا'}
                      </span>
                      <span className="text-sm font-black text-gray-900 uppercase tracking-widest">{task.targetName}</span>
                      {task.fullPath && (
                        <span className="text-[9px] text-gray-500 font-bold mt-1 line-clamp-1">{task.fullPath}</span>
                      )}
                    </div>
                  </div>
                  
                  <Link 
                    href={task.type === 'SYSTEM_LOCATION' ? `/counting/shelf?code=${task.targetId}` : `/counting/item?id=${task.targetId}`}
                    className="bg-indigo-600 text-white px-4 py-2.5 rounded-[12px] text-xs font-bold shadow-md hover:bg-indigo-700 transition-all shrink-0"
                  >
                    شروع
                  </Link>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <motion.div variants={item}>
            <Link href="/history" className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-3xl shadow-sm p-6 flex flex-col items-center justify-center aspect-square gap-3 hover:bg-white hover:scale-[1.02] active:scale-95 transition-all">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-1">
                <History strokeWidth={2} size={24} />
              </div>
              <span className="font-black text-xs text-gray-700">تاریخچه شمارش</span>
            </Link>
          </motion.div>
          
          {/* Free Count Section */}
          <motion.div variants={item}>
            {settings?.task_mode_location || settings?.task_mode_item ? (
              <div className="bg-white/40 backdrop-blur-sm border border-gray-100 rounded-3xl shadow-sm p-6 flex flex-col items-center justify-center aspect-square gap-3 relative overflow-hidden opacity-70 cursor-not-allowed">
                <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mb-1">
                  <ScanLine strokeWidth={2.5} size={24} />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="font-black text-xs text-gray-500">شمارش آزاد</span>
                  <span className="text-[9px] font-bold text-red-400 text-center leading-tight mt-1 px-1">
                    غیرفعال: انبارگردانی تسک‌محور فعال است
                  </span>
                </div>
              </div>
            ) : (
              <Link href="/scan" className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-3xl shadow-sm p-6 flex flex-col items-center justify-center aspect-square gap-3 hover:bg-white hover:scale-[1.02] active:scale-95 transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50/50 rounded-bl-full -z-0"></div>
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-1 relative z-10">
                  <ScanLine strokeWidth={2.5} size={24} />
                </div>
                <span className="font-black text-xs text-gray-800 relative z-10">شمارش آزاد</span>
              </Link>
            )}
          </motion.div>
        </div>
        
        {/* Active Sessions */}
        {activeSessions.length > 0 && systemTasks.length === 0 && (
          <motion.div variants={item} className="flex flex-col gap-3 mt-2">
            <h3 className="text-sm font-black text-gray-800 flex items-center gap-2 px-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
              </span>
              قفسه‌های باز شما (ناتمام)
            </h3>
            
            <div className="flex flex-col gap-3">
              {activeSessions.map((session, idx) => (
                <div key={idx} className="bg-white border border-indigo-100 rounded-[20px] p-4 flex items-center justify-between shadow-sm shadow-indigo-100/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <Layers size={18} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-gray-800 tracking-widest uppercase">{session.code}</span>
                      <span className="text-[10px] text-gray-400 font-bold mt-1">انبار: {session.warehouse || '-'}</span>
                    </div>
                  </div>
                  <Link 
                    href={`/counting/shelf?code=${session.code}&warehouse=${session.warehouse}`}
                    className="bg-gray-900 text-white px-4 py-2.5 rounded-[12px] text-xs font-bold hover:bg-gray-800 transition-colors"
                  >
                    ادامه / پایان
                  </Link>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Suggested Shelves to count */}
        {settings?.show_suggested_shelves !== false && uncountedShelves.length > 0 && systemTasks.length === 0 && (
          <motion.div variants={item} className="flex flex-col gap-3 mt-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                <AlertTriangle size={18} className="text-orange-500" />
                قفسه‌های پیشنهادی
              </h3>
              <span className="text-[10px] text-gray-400 font-bold bg-white px-2 py-1 rounded-md border border-gray-100">
                بدون بررسی بالای {settings?.uncounted_shelf_days || 10} روز
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {uncountedShelves.slice(0, 4).map((shelf, idx) => (
                <Link 
                  key={idx} 
                  href={`/counting/shelf?code=${shelf.code}&warehouse=${shelf.warehouse}`}
                  className="bg-orange-50/50 border border-orange-100 rounded-[20px] p-4 flex flex-col gap-2 hover:bg-orange-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 bg-white rounded-[10px] flex items-center justify-center text-orange-400 shadow-sm">
                      <Layers size={14} />
                    </div>
                    <span className="text-xs font-black text-orange-600 uppercase tracking-widest">{shelf.code}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500 font-bold">
                    <MapPin size={10} />
                    مسیر: {shelf.code || shelf.Code}، انبار: {shelf.warehouse || 11}
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

      </motion.div>
    </div>
  );
}
