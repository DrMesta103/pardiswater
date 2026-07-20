import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { shelfCode, warehouse, userId } = await req.json();

    if (!shelfCode || !userId) {
      return NextResponse.json({ error: 'اطلاعات کامل نیست' }, { status: 400 });
    }

    // 1. Mark task as COMPLETED
    await prisma.task.updateMany({
      where: {
        targetId: shelfCode.toUpperCase(),
        assignedTo: Number(userId),
        status: { in: ['OPEN', 'IN_PROGRESS'] }
      },
      data: { status: 'COMPLETED' }
    });

    // 2. Unlock location
    await prisma.location.updateMany({
      where: { code: shelfCode.toUpperCase(), warehouse: Number(warehouse) },
      data: { isLocked: false, lockedById: null, lockedAt: null }
    });

    // 3. Mark all pending counts as COMPLETED
    await prisma.counting.updateMany({
      where: {
        shelfCode: shelfCode.toUpperCase(),
        user_id: Number(userId),
        status: 'PENDING'
      },
      data: { status: 'COMPLETED' }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('End shelf error:', error);
    return NextResponse.json({ error: 'خطا در پایان انبارگردانی قفسه' }, { status: 500 });
  }
}
