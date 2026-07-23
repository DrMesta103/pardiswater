import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

    const settingsDb = await prisma.systemSetting.findMany();
    const settings = settingsDb.reduce((acc, setting) => {
      acc[setting.key] = JSON.parse(setting.value);
      return acc;
    }, {});

    const taskModeLocation = settings.task_mode_location === true;
    const taskModeItem = settings.task_mode_item === true;

    if (!taskModeLocation && !taskModeItem) {
      return NextResponse.json({ task: null });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeTasks = await prisma.task.findMany({
      where: { 
        assignedTo: parseInt(userId, 10), 
        OR: [
          { status: { in: ['OPEN', 'IN_PROGRESS'] } },
          { status: 'COMPLETED', updatedAt: { gte: today } }
        ],
        type: { in: ['SYSTEM_LOCATION', 'SYSTEM_ITEM'] }
      },
      take: 20
    });

    let currentTasks = [...activeTasks.filter(t => t.status !== 'COMPLETED')];
    let completedTasks = activeTasks.filter(t => t.status === 'COMPLETED');

    // If we have no tasks, try to get from pool or generate a new one
    while (currentTasks.length < 1) {
      let newTaskAdded = false;

      // 1. Try to get from open pooled tasks (ordered by period priority)
      const rotationCycles = settings.shelf_assignment_rotation_cycles !== undefined ? settings.shelf_assignment_rotation_cycles : 2;
      const numericUserId = parseInt(userId, 10);

      const openPooledTasks = await prisma.task.findMany({
        where: {
          assignedTo: null,
          status: 'OPEN',
          type: { in: ['SYSTEM_LOCATION', 'SYSTEM_ITEM'] }
        },
        orderBy: { id: 'asc' },
        take: 50
      });

      let chosenTask = null;
      for (const task of openPooledTasks) {
        if (rotationCycles > 0 && task.type === 'SYSTEM_LOCATION') {
          const previousCounts = await prisma.counting.findMany({
            where: { shelfCode: task.targetId },
            orderBy: { createdAt: 'desc' },
            take: rotationCycles,
            select: { user_id: true }
          });
          const previousUserIds = previousCounts.map(c => c.user_id);
          if (previousUserIds.includes(numericUserId)) {
            continue; // Skip this shelf for this user to enforce rotation
          }
        }
        chosenTask = task;
        break;
      }

      if (chosenTask) {
        const assignedPooledTask = await prisma.task.update({
          where: { id: chosenTask.id },
          data: { assignedTo: numericUserId }
        });
        currentTasks.push(assignedPooledTask);
        newTaskAdded = true;
      }

      // 2. If no pooled task, try to generate location task using Leaf Nodes & Rotation Cycles
      if (!newTaskAdded && taskModeLocation) {
        // Query leaf locations (locations with no children)
        const locations = await prisma.location.findMany({
          where: { children: { none: {} } },
          orderBy: { createdAt: 'asc' }
        });
        
        const rotationCycles = settings.shelf_assignment_rotation_cycles !== undefined ? settings.shelf_assignment_rotation_cycles : 2;
        const daysAgo = settings.uncounted_shelf_days || 10;
        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - daysAgo);
        const numericUserId = parseInt(userId, 10);

        for (const loc of locations) {
          const lastCount = await prisma.counting.findFirst({
            where: { shelfCode: loc.code },
            orderBy: { createdAt: 'desc' }
          });

          const activeTask = await prisma.task.findFirst({
            where: { targetId: loc.code, status: { in: ['OPEN', 'IN_PROGRESS'] } }
          });

          // Check rotation cycles: Has this user counted this shelf in the last N cycles?
          if (rotationCycles > 0) {
            const previousCounts = await prisma.counting.findMany({
              where: { shelfCode: loc.code },
              orderBy: { createdAt: 'desc' },
              take: rotationCycles,
              select: { user_id: true }
            });
            const previousUserIds = previousCounts.map(c => c.user_id);
            if (previousUserIds.includes(numericUserId)) {
              continue; // Skip this shelf for this user to enforce rotation
            }
          }

          if (!activeTask && (!lastCount || lastCount.createdAt < dateThreshold)) {
            const newTask = await prisma.task.create({
              data: {
                type: 'SYSTEM_LOCATION',
                targetId: loc.code,
                targetName: loc.title || loc.code,
                assignedTo: numericUserId,
                createdBy: 1,
                status: 'OPEN'
              }
            });
            currentTasks.push(newTask);
            newTaskAdded = true;
            break;
          }
        }
      }

      if (!newTaskAdded) {
        break;
      }
    }

    const allTasksToReturn = [...currentTasks, ...completedTasks];

    // Enhance tasks with full location path
    const enhancedTasks = await Promise.all(allTasksToReturn.map(async (task) => {
      if (task.type === 'SYSTEM_LOCATION') {
        const loc = await prisma.location.findUnique({
          where: { code: task.targetId },
          include: { 
            parent: { include: { parent: { include: { parent: true } } } }
          }
        });
        
        if (loc) {
          let pathParts = [`${loc.type || ''} ${loc.title || loc.code}`.trim()];
          let current = loc.parent;
          while (current) {
            pathParts.unshift(`${current.type || ''} ${current.title || current.code}`.trim());
            current = current.parent;
          }
          if (loc.warehouse) pathParts.unshift(`انبار ${loc.warehouse}`);
          
          return { ...task, fullPath: pathParts.join(' ، '), warehouse: loc.warehouse, targetName: loc.title || loc.code };
        }
      }
      return task;
    }));

    return NextResponse.json({ tasks: enhancedTasks });
  } catch (error) {
    console.error('Task generation error:', error);
    return NextResponse.json({ error: 'Error generating task' }, { status: 500 });
  }
}
