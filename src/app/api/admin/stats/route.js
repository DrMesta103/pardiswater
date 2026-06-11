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

    // Calculate stats per floor
    const stats = countings.reduce((acc, curr) => {
      const floor = curr.location?.floor || 'بدون قفسه';
      
      if (!acc[floor]) {
        acc[floor] = { floor, totalCountings: 0, items: [] };
      }
      
      acc[floor].totalCountings += 1;
      acc[floor].items.push(curr);
      
      return acc;
    }, {});

    return NextResponse.json(Object.values(stats));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'خطا در دریافت آمار' }, { status: 500 });
  }
}
