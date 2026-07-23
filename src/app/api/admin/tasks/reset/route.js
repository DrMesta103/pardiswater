import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Clean up rogue/orphaned tasks (tasks with no period or tasks for periods that don't exist)
    const deletedOrphans = await prisma.task.deleteMany({
      where: {
        type: 'SYSTEM_LOCATION',
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        OR: [
          { periodId: null },
          { period: { status: 'CLOSED' } }
        ]
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `پاک‌سازی با موفقیت انجام شد. تعداد ${deletedOrphans.count} تسک‌ سرگردان و فاقد دوره حذف گردیدند.`,
      count: deletedOrphans.count 
    });
  } catch (error) {
    console.error('Reset Tasks Error:', error);
    return NextResponse.json({ error: 'خطا در پاک‌سازی تسک‌ها' }, { status: 500 });
  }
}
