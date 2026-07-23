import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const periodId = Number(id);

    const period = await prisma.countingPeriod.findUnique({
      where: { id: periodId },
      include: {
        createdBy: { select: { id: true, name: true, username: true } },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, username: true } }
          }
        },
        countings: {
          include: {
            user: { select: { id: true, name: true, username: true } },
            location: true
          }
        }
      }
    });

    if (!period) {
      return NextResponse.json({ error: 'دوره مورد نظر یافت نشد' }, { status: 404 });
    }

    const warehousesList = Array.isArray(period.warehouses) 
      ? period.warehouses 
      : typeof period.warehouses === 'string' 
        ? JSON.parse(period.warehouses) 
        : [];

    // Detailed Warehouse Stats
    const warehouseStats = {};
    warehousesList.forEach(wId => {
      warehouseStats[wId] = { warehouse: wId, total: 0, completed: 0, countings: 0 };
    });

    // Match tasks to warehouses
    for (const task of period.tasks) {
      if (task.type === 'SYSTEM_LOCATION') {
        const loc = await prisma.location.findUnique({ where: { code: task.targetId } });
        if (loc && loc.warehouse) {
          const wStr = String(loc.warehouse);
          if (!warehouseStats[wStr]) {
            warehouseStats[wStr] = { warehouse: wStr, total: 0, completed: 0, countings: 0 };
          }
          warehouseStats[wStr].total += 1;
          if (task.status === 'COMPLETED') {
            warehouseStats[wStr].completed += 1;
          }
        }
      }
    }

    period.countings.forEach(c => {
      const wStr = String(c.warehouse);
      if (warehouseStats[wStr]) {
        warehouseStats[wStr].countings += 1;
      }
    });

    // Personnel breakdown
    const personnelMap = {};
    period.countings.forEach(c => {
      const uId = c.user_id;
      const uName = c.user?.name || `کاربر ${uId}`;
      if (!personnelMap[uId]) {
        personnelMap[uId] = { id: uId, name: uName, username: c.user?.username, countings: 0 };
      }
      personnelMap[uId].countings += 1;
    });

    const totalTasks = period.tasks.length;
    const completedTasks = period.tasks.filter(t => t.status === 'COMPLETED').length;
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return NextResponse.json({
      ...period,
      warehousesList,
      totalTasks,
      completedTasks,
      progressPercent,
      warehouseStats: Object.values(warehouseStats),
      personnelBreakdown: Object.values(personnelMap)
    });
  } catch (error) {
    console.error('Error fetching period detail:', error);
    return NextResponse.json({ error: 'خطا در دریافت جزئیات دوره' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const { status, title } = await req.json();
    const periodId = Number(id);

    const updateData = {};
    if (status) {
      updateData.status = status;
      if (status === 'CLOSED') {
        updateData.closedAt = new Date();
      }
    }
    if (title) updateData.title = title;

    const updatedPeriod = await prisma.countingPeriod.update({
      where: { id: periodId },
      data: updateData
    });

    return NextResponse.json(updatedPeriod);
  } catch (error) {
    console.error('Error updating period:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی دوره' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const periodId = Number(id);

    await prisma.countingPeriod.delete({
      where: { id: periodId }
    });

    return NextResponse.json({ success: true, message: 'دوره انبارگردانی با موفقیت حذف شد' });
  } catch (error) {
    console.error('Error deleting period:', error);
    return NextResponse.json({ error: 'خطا در حذف دوره' }, { status: 500 });
  }
}
