import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        assignee: { select: { id: true, name: true, username: true } },
        creator: { select: { id: true, name: true, username: true } }
      }
    });

    const enhancedTasks = await Promise.all(tasks.map(async (task) => {
      if (task.type === 'SYSTEM_LOCATION') {
        const loc = await prisma.location.findUnique({
          where: { code: task.targetId },
          include: { 
            parent: { 
              include: { 
                parent: { 
                  include: { 
                    parent: { 
                      include: { parent: true } 
                    } 
                  } 
                } 
              } 
            }
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
          return { ...task, fullPath: pathParts.join(' ➔ ') };
        }
      }
      return task;
    }));

    return NextResponse.json(enhancedTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'خطا در دریافت تسک‌ها' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, assignedTo, status } = await req.json();
    
    if (!id) return NextResponse.json({ error: 'شناسه تسک الزامی است' }, { status: 400 });

    const dataToUpdate = {};
    if (assignedTo !== undefined) dataToUpdate.assignedTo = assignedTo === null ? null : Number(assignedTo);
    if (status) dataToUpdate.status = status;

    const updatedTask = await prisma.task.update({
      where: { id: Number(id) },
      data: dataToUpdate
    });
    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی تسک' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'شناسه تسک الزامی است' }, { status: 400 });

    await prisma.task.delete({
      where: { id: Number(id) }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'خطا در حذف تسک' }, { status: 500 });
  }
}
