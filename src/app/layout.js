import './globals.css'

export const metadata = {
  title: 'Pardis Counting',
  description: 'اپلیکیشن انبارگردانی پردیس',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <main className="w-full min-h-screen flex flex-col justify-start items-center bg-gray-100">
          <div className="w-full max-w-md bg-white min-h-screen shadow-lg relative pb-16">
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}
