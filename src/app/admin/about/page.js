'use client';
import Header from '@/components/Header';
import { motion } from 'framer-motion';
import { Terminal, Code, Cpu, Shield, Smartphone, ArrowLeft, Mail, Phone, Globe } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function AboutDeveloper() {
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
      <Header title="درباره توسعه‌دهنده" showBack={true} />

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="p-4 md:p-6 flex flex-col gap-6 max-w-lg mx-auto w-full mt-2"
      >
        {/* App Info Card */}
        <motion.div variants={item} className="bg-white rounded-[32px] p-8 shadow-sm border border-indigo-50 flex flex-col items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50/50 rounded-bl-full -z-0"></div>
          
          <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-[24px] shadow-lg shadow-indigo-200 flex items-center justify-center relative z-10 rotate-3">
            <Smartphone size={36} className="text-white -rotate-3" strokeWidth={2} />
          </div>
          
          <div className="flex flex-col items-center gap-1 relative z-10 text-center mt-2">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">سیستم انبارگردانی هوشمند</h2>
            <p className="text-sm font-bold text-gray-400 tracking-widest mt-1">نسخه ۱.۴.۰ - نسخه ابری</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 mt-4 relative z-10">
            <span className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-100 flex items-center gap-1.5">
              <Shield size={12} /> پایداری بالا
            </span>
            <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-xs font-bold border border-blue-100 flex items-center gap-1.5">
              <Cpu size={12} /> هوش مصنوعی تسک‌ها
            </span>
          </div>
        </motion.div>

        {/* Developer Info Card */}
        <motion.div variants={item} className="bg-gray-900 rounded-[32px] p-8 shadow-xl shadow-gray-900/20 text-white flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl"></div>

          <div className="flex flex-col gap-2 relative z-10">
            <div className="w-12 h-12 bg-white/10 rounded-[16px] flex items-center justify-center mb-2 border border-white/10">
              <Terminal size={24} className="text-indigo-400" />
            </div>
            <h3 className="text-xs font-bold text-indigo-400 tracking-widest">طراحی و توسعه در</h3>
            <h2 className="text-3xl font-black text-white">استودیو نوآوری هوکا</h2>
          </div>

          <div className="text-sm text-gray-300 font-medium leading-relaxed relative z-10">
            این پلتفرم با تمرکز بر سرعت، دقت و رفع چالش‌های انبارگردانی مدرن توسعه یافته است. هدف ما تسهیل فرآیند کنترل موجودی از طریق الگوریتم‌های هوشمند توزیع تسک است.
          </div>

          <div className="flex flex-col gap-3 relative z-10 mt-2">
            <a href="https://hukaio.com" target="_blank" rel="noopener noreferrer" className="bg-white/5 border border-white/10 p-4 rounded-[20px] flex items-center gap-4 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <Globe size={18} className="text-gray-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 font-bold mb-0.5">وب‌سایت رسمی</span>
                <span className="text-sm font-black text-white" dir="ltr">Hukaio.com</span>
              </div>
            </a>
            
            <a href="tel:09981230125" className="bg-white/5 border border-white/10 p-4 rounded-[20px] flex items-center gap-4 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                <Phone size={18} className="text-gray-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 font-bold mb-0.5">پشتیبانی و توسعه</span>
                <span className="text-sm font-black text-white" dir="ltr">0998 123 0125</span>
              </div>
            </a>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
