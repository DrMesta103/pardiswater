'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

function PrintLabelContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const name = searchParams.get('name');

  useEffect(() => {
    if (code) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [code]);

  if (!code) return <div className="p-10 text-center text-xl font-bold">کد نامعتبر است</div>;

  return (
    <div className="w-full h-screen bg-white flex flex-col items-center justify-center print:block print:w-auto print:h-auto">
      <div className="w-[60mm] h-[40mm] border-2 border-black p-2 flex flex-col items-center justify-center gap-2 bg-white mx-auto print:border-none print:p-0">
        <h2 className="text-[12px] font-black text-black text-center leading-tight line-clamp-2 w-full">{name}</h2>
        <img 
          src={`https://barcode.tec-it.com/barcode.ashx?data=${code}&code=Code128&translate-esc=on`} 
          alt={`Barcode ${code}`} 
          className="w-full h-12 object-contain"
        />
        <span className="text-[14px] font-black tracking-widest">{code}</span>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:block {
            position: absolute;
            left: 0;
            top: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default function PrintLabelPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">در حال بارگذاری...</div>}>
      <PrintLabelContent />
    </Suspense>
  );
}
