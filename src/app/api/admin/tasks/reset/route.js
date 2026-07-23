import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // 1. Delete all uncompleted auto location tasks (OPEN or IN_PROGRESS)
    await prisma.task.deleteMany({
      where: {
        type: 'SYSTEM_LOCATION',
        status: { in: ['OPEN', 'IN_PROGRESS'] }
      }
    });

    // 2. Fetch system settings
    const settingsDb = await prisma.systemSetting.findMany();
    const settings = settingsDb.reduce((acc, setting) => {
      acc[setting.key] = JSON.parse(setting.value);
      return acc;
    }, {});

    const daysAgo = settings.uncounted_shelf_days || 10;
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysAgo);

    // 3. Find all leaf locations (locations with no children)
    const leafLocations = await prisma.location.findMany({
      where: { children: { none: {} } },
      orderBy: { createdAt: 'asc' }
    });

    let createdCount = 0;

    // 4. Generate new clean tasks for eligible leaf locations
    for (const loc of leafLocations) {
      const lastCount = await prisma.counting.findFirst({
        where: { shelfCode: loc.code },
        orderBy: { createdAt: 'desc' }
      });

      if (!lastCount || lastCount.createdAt < dateThreshold) {
        await prisma.task.create({
          data: {
            type: 'SYSTEM_LOCATION',
            targetId: loc.code,
            targetName: loc.title || loc.code,
            assignedTo: null, // Open pool for auto assignment or admin assignment
            createdBy: 1,
            status: 'OPEN'
          }
        });
        createdCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `تسک‌ها با موفقیت ریست شدند و ${createdCount} تسک بر اساس ریزترین قفسه‌ها (Leaf Nodes) بازتولید گردید.`,
      count: createdCount 
    });
  } catch (error) {
    console.error('Reset Tasks Error:', error);
    return NextResponse.json({ error: 'خطا در ریست تسک‌ها' }, { status: 500 });
  }
}
