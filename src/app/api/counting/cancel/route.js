import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { shelfCode, warehouse, userId, reason, mode, product_id } = body;

    if (!reason) {
      return NextResponse.json({ error: 'اطلاعات کامل نیست' }, { status: 400 });
    }

    // 1. Mark recent countings in this shelf/warehouse by this user as CANCELLED
    // We assume counts created in the last 24h by this user for this shelf
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const where = {
      warehouse: Number(warehouse),
      user_id: Number(userId),
      createdAt: { gte: twentyFourHoursAgo },
      status: 'PENDING'
    };

    if (mode === 'SHELF' && shelfCode) {
      where.shelfCode = shelfCode.toUpperCase();
    } else if (mode === 'ITEM' && product_id) {
      where.product_id = Number(product_id);
    }

    const deletedCounts = await prisma.counting.deleteMany({
      where
    });

    // 2. Unlock the location
    if (shelfCode) {
      await prisma.location.updateMany({
        where: { code: shelfCode.toUpperCase(), warehouse: Number(warehouse) },
        data: { isLocked: false, lockedById: null, lockedAt: null }
      });
      
      // Update Task to OPEN and remove assignee so someone else can do it
      await prisma.task.updateMany({
        where: {
          targetId: shelfCode.toUpperCase(),
          assignedTo: Number(userId),
          status: { in: ['OPEN', 'IN_PROGRESS'] }
        },
        data: { status: 'OPEN', assignedTo: null }
      });
    } else if (product_id) {
      // For Item Mode
      await prisma.task.updateMany({
        where: {
          targetId: String(product_id),
          assignedTo: Number(userId),
          status: { in: ['OPEN', 'IN_PROGRESS'] }
        },
        data: { status: 'OPEN', assignedTo: null }
      });
    }

    // 3. Log the action
    await prisma.actionLog.create({
      data: {
        userId: Number(userId),
        action: 'CANCEL_COUNTING',
        details: `لغو شمارش ${mode === 'SHELF' ? 'قفسه' : 'کالا'} ${shelfCode ? shelfCode.toUpperCase() : product_id} به دلیل: ${reason}`
      }
    });

    return NextResponse.json({ success: true, cancelledCount: updated.count });
  } catch (error) {
    console.error('Cancel counting error:', error);
    return NextResponse.json({ error: 'خطا در لغو انبارگردانی' }, { status: 500 });
  }
}
