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

    const activeTasks = await prisma.task.findMany({
      where: { 
        assignedTo: parseInt(userId, 10), 
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        type: { in: ['SYSTEM_LOCATION', 'SYSTEM_ITEM'] }
      },
      take: 3
    });

    let currentTasks = [...activeTasks];

    // If we have no tasks, try to get from pool or generate a new one
    while (currentTasks.length < 1) {
      let newTaskAdded = false;

      // 1. Try to get from pool
      const pooledTask = await prisma.task.findFirst({
        where: {
          assignedTo: null,
          status: 'OPEN',
          type: { in: ['SYSTEM_LOCATION', 'SYSTEM_ITEM'] }
        },
        orderBy: { createdAt: 'asc' }
      });

      if (pooledTask) {
        const assignedPooledTask = await prisma.task.update({
          where: { id: pooledTask.id },
          data: { assignedTo: parseInt(userId, 10) }
        });
        currentTasks.push(assignedPooledTask);
        newTaskAdded = true;
      }

      // 2. If no pooled task, try to generate location task
      if (!newTaskAdded && taskModeLocation) {
        const locations = await prisma.location.findMany({
          include: { children: true }
        });
        const countableLocations = locations.filter(l => l.children.length === 0).sort((a,b) => a.code.localeCompare(b.code));

          where: { level: 2 },
          orderBy: { createdAt: 'asc' }
        });
        
        for (const loc of locations) {
          const daysAgo = settings.uncounted_shelf_days || 10;
          const dateThreshold = new Date();
          dateThreshold.setDate(dateThreshold.getDate() - daysAgo);

          const lastCount = await prisma.counting.findFirst({
            where: { shelfCode: loc.code },
            orderBy: { createdAt: 'desc' }
          });

          const activeTask = await prisma.task.findFirst({
            where: { targetId: loc.code, status: { in: ['OPEN', 'IN_PROGRESS'] } }
          });

          if (!activeTask && (!lastCount || lastCount.createdAt < dateThreshold)) {
            const newTask = await prisma.task.create({
              data: {
                type: 'SYSTEM_LOCATION',
                targetId: loc.code,
                targetName: loc.title || loc.code,
                assignedTo: parseInt(userId, 10),
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
