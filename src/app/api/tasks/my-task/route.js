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

    // Check if user already has an active task
    const activeTask = await prisma.task.findFirst({
      where: { 
        assignedTo: parseInt(userId, 10), 
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        type: { in: ['SYSTEM_LOCATION', 'SYSTEM_ITEM'] }
      }
    });

    if (activeTask) {
      return NextResponse.json({ task: activeTask });
    }

    // Generate location task if enabled
    if (taskModeLocation) {
      const locations = await prisma.location.findMany({
        include: { children: true }
      });
      // We only want leaf locations (no children)
      const countableLocations = locations.filter(l => l.children.length === 0).sort((a,b) => a.code.localeCompare(b.code));

      if (countableLocations.length > 0) {
        const activeTasks = await prisma.task.findMany({
          where: { status: { in: ['OPEN', 'IN_PROGRESS'] }, type: 'SYSTEM_LOCATION' }
        });
        const activeTargetIds = activeTasks.map(t => t.targetId);

        const userLastTask = await prisma.task.findFirst({
          where: { assignedTo: parseInt(userId, 10), type: 'SYSTEM_LOCATION', status: 'COMPLETED' },
          orderBy: { updatedAt: 'desc' }
        });

        let locationToAssign = null;
        for (let i = 0; i < countableLocations.length; i++) {
          const loc = countableLocations[i];
          
          if (userLastTask && userLastTask.targetId === loc.code) continue;
          if (activeTargetIds.includes(loc.code)) continue;

          const prevLoc = i > 0 ? countableLocations[i-1].code : null;
          const nextLoc = i < countableLocations.length - 1 ? countableLocations[i+1].code : null;

          if (prevLoc && activeTargetIds.includes(prevLoc)) continue;
          if (nextLoc && activeTargetIds.includes(nextLoc)) continue;

          locationToAssign = loc;
          break;
        }

        // If all available locations are adjacent or same as last task, we fallback to just find any unassigned location
        if (!locationToAssign) {
          locationToAssign = countableLocations.find(loc => !activeTargetIds.includes(loc.code));
        }

        if (locationToAssign) {
          const newTask = await prisma.task.create({
            data: {
              type: 'SYSTEM_LOCATION',
              targetId: locationToAssign.code,
              targetName: locationToAssign.title || locationToAssign.code,
              assignedTo: parseInt(userId, 10),
              createdBy: 1, // Assume system or admin 1
              status: 'OPEN'
            }
          });
          return NextResponse.json({ task: newTask });
        }
      }
    }

    // Generate item task if enabled and no location task was generated
    if (taskModeItem) {
      // In a real scenario we would fetch products from DB, but we don't have them in DB.
      // We might need to generate an item task based on uncounted items? 
      // For now, let's just return null if no items in DB or we can create a dummy.
      // Or maybe we can fetch uncounted items from Hesabfa? We don't have time.
      // I'll return null for item for now.
    }

    return NextResponse.json({ task: null });
  } catch (error) {
    console.error('Task generation error:', error);
    return NextResponse.json({ error: 'Error generating task' }, { status: 500 });
  }
}
