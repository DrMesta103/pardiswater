import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { shelfCode, warehouse, userId } = await req.json();

    if (!shelfCode || !userId) {
      return NextResponse.json({ error: 'اطلاعات کامل نیست' }, { status: 400 });
    }

    const shelfCodeUpper = shelfCode.toUpperCase();

    // 1. Check if they have an active task for this shelf
    const activeTask = await prisma.task.findFirst({
      where: {
        targetId: shelfCodeUpper,
        assignedTo: Number(userId),
        status: { in: ['OPEN', 'IN_PROGRESS'] }
      }
    });

    if (activeTask) {
      // Normal flow: they own the task
      await prisma.task.update({
        where: { id: activeTask.id },
        data: { status: 'COMPLETED' }
      });
    } else {
      // Manual scan flow (Chain Counting Trap)
      // Get the products they counted in THIS shelf during this session
      const currentCounts = await prisma.counting.findMany({
        where: {
          shelfCode: shelfCodeUpper,
          user_id: Number(userId),
          status: 'PENDING'
        },
        select: { product_id: true }
      });
      const currentProductIds = currentCounts.map(c => c.product_id);

      // Find their LAST completed task
      const lastCompletedTask = await prisma.task.findFirst({
        where: {
          assignedTo: Number(userId),
          status: 'COMPLETED'
        },
        orderBy: { updatedAt: 'desc' }
      });

      if (lastCompletedTask) {
        // Get products they counted in the last task's shelf
        const lastCounts = await prisma.counting.findMany({
          where: {
            shelfCode: lastCompletedTask.targetId,
            user_id: Number(userId)
          },
          select: { product_id: true }
        });
        const lastProductIds = lastCounts.map(c => c.product_id);

        // Check intersection
        const hasCommonProduct = currentProductIds.some(pid => lastProductIds.includes(pid));

        if (!hasCommonProduct) {
          // PUNISHMENT! Delete their pending counts for this shelf
          await prisma.counting.deleteMany({
            where: {
              shelfCode: shelfCodeUpper,
              user_id: Number(userId),
              status: 'PENDING'
            }
          });

          await prisma.location.updateMany({
            where: { code: shelfCodeUpper, warehouse: Number(warehouse) },
            data: { isLocked: false, lockedById: null, lockedAt: null }
          });

          return NextResponse.json({ 
            error: 'وقت گذاشتی برای شمارش عیب نداره ولی شمارشت ثبت نمیشه چون میخواستی سیستم رو دور بزنی. تو فقط باید وظیفه‌های خودت رو انجام بدی یا قفسه‌های مرتبط رو بشماری!',
            punished: true 
          }, { status: 403 });
        } else {
          // ACCEPTED! Assign the open task (if exists) to them and complete it
          const openTask = await prisma.task.findFirst({
            where: { targetId: shelfCodeUpper, status: { in: ['OPEN', 'IN_PROGRESS'] } }
          });
          if (openTask) {
            await prisma.task.update({
              where: { id: openTask.id },
              data: { assignedTo: Number(userId), status: 'COMPLETED' }
            });
          } else {
            // Create a completed task for them so it shows in history
            const activePeriod = await prisma.countingPeriod.findFirst({
              where: { status: 'ACTIVE' }
            });
            await prisma.task.create({
              data: {
                type: 'SYSTEM_LOCATION',
                targetId: shelfCodeUpper,
                targetName: shelfCodeUpper,
                status: 'COMPLETED',
                assignedTo: Number(userId),
                createdBy: Number(userId),
                periodId: activePeriod ? activePeriod.id : null
              }
            });
          }
        }
      } else {
        // No previously completed task
        await prisma.counting.deleteMany({
          where: { shelfCode: shelfCodeUpper, user_id: Number(userId), status: 'PENDING' }
        });
        await prisma.location.updateMany({
          where: { code: shelfCodeUpper, warehouse: Number(warehouse) },
          data: { isLocked: false, lockedById: null, lockedAt: null }
        });
        return NextResponse.json({ 
          error: 'شما هنوز هیچ وظیفه‌ای انجام نداده‌اید. ابتدا باید یکی از تسک‌های رسمی خود را تکمیل کنید!',
          punished: true 
        }, { status: 403 });
      }
    }

    // 2. Unlock location
    await prisma.location.updateMany({
      where: { code: shelfCodeUpper, warehouse: Number(warehouse) },
      data: { isLocked: false, lockedById: null, lockedAt: null }
    });

    // 3. Mark all pending counts as COMPLETED
    await prisma.counting.updateMany({
      where: {
        shelfCode: shelfCodeUpper,
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
