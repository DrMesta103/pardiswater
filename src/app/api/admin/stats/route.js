import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get all countings grouped by floor using the relation
    const countings = await prisma.counting.findMany({
      include: {
        location: true
      }
    });

    // Calculate stats per warehouse
    const stats = countings.reduce((acc, curr) => {
      const warehouse = curr.warehouse || 'بدون انبار';
      
      if (!acc[warehouse]) {
        acc[warehouse] = { group: warehouse, totalCountings: 0, items: [] };
      }
      
      acc[warehouse].totalCountings += 1;
      acc[warehouse].items.push(curr);
      
      return acc;
    }, {});

    return NextResponse.json(Object.values(stats));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'خطا در دریافت آمار' }, { status: 500 });
  }
}
