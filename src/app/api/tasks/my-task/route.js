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

    // If we have less than 3 tasks, try to get from pool or generate new ones
    while (currentTasks.length < 3) {
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

        if (countableLocations.length > 0) {
          const allActiveTasks = await prisma.task.findMany({
            where: { status: { in: ['OPEN', 'IN_PROGRESS'] }, type: 'SYSTEM_LOCATION' }
          });
          const activeTargetIds = allActiveTasks.map(t => t.targetId);

          const userLastTask = await prisma.task.findFirst({
            where: { assignedTo: parseInt(userId, 10), type: 'SYSTEM_LOCATION', status: 'COMPLETED' },
            orderBy: { updatedAt: 'desc' }
          });

          let locationToAssign = null;
          for (let i = 0; i < countableLocations.length; i++) {
            const loc = countableLocations[i];
            
            if (userLastTask && userLastTask.targetId === loc.code) continue;
            // Also ensure it's not already in currentTasks
            if (currentTasks.some(t => t.targetId === loc.code)) continue;
            if (activeTargetIds.includes(loc.code)) continue;

            const prevLoc = i > 0 ? countableLocations[i-1].code : null;
            const nextLoc = i < countableLocations.length - 1 ? countableLocations[i+1].code : null;

            if (prevLoc && activeTargetIds.includes(prevLoc)) continue;
            if (nextLoc && activeTargetIds.includes(nextLoc)) continue;

            locationToAssign = loc;
            break;
          }

          if (!locationToAssign) {
            locationToAssign = countableLocations.find(loc => !activeTargetIds.includes(loc.code) && !currentTasks.some(t => t.targetId === loc.code));
          }

          if (locationToAssign) {
            const newTask = await prisma.task.create({
              data: {
                type: 'SYSTEM_LOCATION',
                targetId: locationToAssign.code,
                targetName: locationToAssign.title || locationToAssign.code,
                assignedTo: parseInt(userId, 10),
                createdBy: 1, // System or admin
                status: 'OPEN'
              }
            });
            currentTasks.push(newTask);
            newTaskAdded = true;
          }
        }
      }

      // If we couldn't add any new task (pool empty and no locations available), break
      if (!newTaskAdded) {
        break;
      }
    }

    return NextResponse.json({ tasks: currentTasks });
  } catch (error) {
    console.error('Task generation error:', error);
    return NextResponse.json({ error: 'Error generating task' }, { status: 500 });
  }
}
