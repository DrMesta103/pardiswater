import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const periods = await prisma.countingPeriod.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true, username: true } },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, username: true } }
          }
        },
        countings: {
          include: {
            user: { select: { id: true, name: true, username: true } }
          }
        }
      }
    });

    const enhancedPeriods = periods.map(period => {
      const warehousesList = Array.isArray(period.warehouses) 
        ? period.warehouses 
        : typeof period.warehouses === 'string' 
          ? JSON.parse(period.warehouses) 
          : [];

      const totalTasks = period.tasks.length;
      const completedTasks = period.tasks.filter(t => t.status === 'COMPLETED').length;
      const inProgressTasks = period.tasks.filter(t => t.status === 'IN_PROGRESS').length;
      const openTasks = period.tasks.filter(t => t.status === 'OPEN').length;
      const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Personnel breakdown
      const personnelMap = {};
      period.countings.forEach(c => {
        const uId = c.user_id;
        const uName = c.user?.name || `کاربر ${uId}`;
        if (!personnelMap[uId]) {
          personnelMap[uId] = { id: uId, name: uName, count: 0 };
        }
        personnelMap[uId].count += 1;
      });

      const personnelBreakdown = Object.values(personnelMap);

      return {
        ...period,
        warehousesList,
        totalTasks,
        completedTasks,
        inProgressTasks,
        openTasks,
        progressPercent,
        totalCountings: period.countings.length,
        personnelBreakdown
      };
    });

    return NextResponse.json(enhancedPeriods);
  } catch (error) {
    console.error('Error fetching periods:', error);
    return NextResponse.json({ error: 'خطا در دریافت دوره‌های انبارگردانی' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { title, warehouses } = await req.json();

    if (!title || !warehouses || !Array.isArray(warehouses) || warehouses.length === 0) {
      return NextResponse.json({ error: 'عنوان دوره و حداقل یک انبار الزامی است' }, { status: 400 });
    }

    const warehouseInts = warehouses.map(w => Number(w));

    // 1. Create CountingPeriod record
    const period = await prisma.countingPeriod.create({
      data: {
        title,
        warehouses: warehouses, // stored as JSON
        status: 'ACTIVE',
        createdById: 1 // Default Admin
      }
    });

    // 2. Fetch all leaf locations in the selected warehouses
    const rawLeafLocations = await prisma.location.findMany({
      where: {
        warehouse: { in: warehouseInts },
        children: { none: {} }
      }
    });

    // 3. Calculate priority: Oldest counted shelves come first (Day 1 of previous cycle -> earlier assignment)
    // Add minor random variance for initial distribution among uncounted shelves.
    const sortedLeafLocations = await Promise.all(
      rawLeafLocations.map(async (loc) => {
        const lastCount = await prisma.counting.findFirst({
          where: { shelfCode: loc.code },
          orderBy: { createdAt: 'desc' }
        });
        
        // Priority weight: timestamp of last count (0 if never counted).
        // Plus a tiny random jitter (0 to 999 ms) for random distribution among equal priority items.
        const priorityTime = (lastCount ? lastCount.createdAt.getTime() : 0) + (Math.random() * 1000);
        return { loc, priorityTime };
      })
    );

    // Sort ascending: Oldest count timestamp (or 0) comes FIRST
    sortedLeafLocations.sort((a, b) => a.priorityTime - b.priorityTime);

    // 4. Spatial Interleaving (Round-Robin by parentId to prevent room-clustering)
    // We group tasks by their immediate parent (e.g. Room/Row) and interleave them.
    // This ensures if 5 users ask for tasks, they get tasks in 5 DIFFERENT rooms/rows!
    const groupedByParent = {};
    for (const item of sortedLeafLocations) {
      const pId = item.loc.parentId || 'root';
      if (!groupedByParent[pId]) groupedByParent[pId] = [];
      groupedByParent[pId].push(item);
    }

    const spatiallyScatteredLocations = [];
    const groupKeys = Object.keys(groupedByParent);
    // Shuffle groupKeys slightly to prevent deterministic linear room scanning
    groupKeys.sort(() => Math.random() - 0.5); 
    
    let hasMore = true;
    while (hasMore) {
      hasMore = false;
      for (const key of groupKeys) {
        if (groupedByParent[key].length > 0) {
          spatiallyScatteredLocations.push(groupedByParent[key].shift());
          hasMore = true;
        }
      }
    }

    // 5. Generate SYSTEM_LOCATION tasks in scattered priority order
    let createdTasksCount = 0;
    for (const item of spatiallyScatteredLocations) {
      const loc = item.loc;
      await prisma.task.create({
        data: {
          type: 'SYSTEM_LOCATION',
          targetId: loc.code,
          targetName: loc.title || loc.code,
          assignedTo: null,
          createdBy: 1,
          status: 'OPEN',
          periodId: period.id
        }
      });
      createdTasksCount++;
    }

    return NextResponse.json({
      success: true,
      period,
      createdTasksCount,
      message: `دوره «${title}» با موفقیت ایجاد گردید و ${createdTasksCount} تسک انبارگردانی تعریف شد.`
    });
  } catch (error) {
    console.error('Error creating counting period:', error);
    return NextResponse.json({ error: 'خطا در ایجاد دوره انبارگردانی' }, { status: 500 });
  }
}
