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
            <div className="flex-1 pb-16">
              {children}
            </div>
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 py-2.5 text-center z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
              <p className="text-[10px] font-black text-gray-400 tracking-wide flex items-center justify-center gap-1">
                طراحی در <span className="text-indigo-500 font-extrabold">استودیو نوآوری هوکا</span>
              </p>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
