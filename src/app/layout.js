import './globals.css'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f8fafc',
}

export const metadata = {
  title: 'پردیس رایانه - انبارگردانی',
  description: 'اپلیکیشن انبارگردانی پردیس',
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
          <div className="w-full max-w-md bg-white min-h-screen shadow-lg relative pb-16">
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}
