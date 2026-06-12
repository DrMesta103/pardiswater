import './globals.css'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f8fafc',
}

export const metadata = {
  title: 'سیستم انبارداری',
  description: 'اپلیکیشن مدیریت انبار',
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "انبارگردانی",
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="bg-gray-100 transition-colors">
        <main className="w-full min-h-screen flex flex-col justify-start items-center">
          <div className="w-full max-w-md bg-white min-h-screen shadow-lg relative flex flex-col">
            <div className="flex-1 pb-10">
              {children}
            </div>
            <div className="w-full py-4 text-center mt-auto">
              <p className="text-[9px] font-bold text-gray-300 dir-ltr tracking-widest uppercase">
                Designed & Developed by <span className="text-indigo-300">DrMesta</span>
              </p>
              <p className="text-[8px] font-bold text-gray-200 mt-1">App v1.4.0</p>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
