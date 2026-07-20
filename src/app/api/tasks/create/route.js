import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const data = await req.json();
    const { type, targetId, targetName, assignedTo, createdBy } = data;

    if (!type || !targetId || !createdBy) {
      return NextResponse.json({ error: 'اطلاعات ناقص است' }, { status: 400 });
    }

    const newTask = await prisma.task.create({
      data: {
        type,
        targetId: String(targetId),
        targetName: targetName || String(targetId),
        assignedTo: assignedTo ? parseInt(assignedTo, 10) : null,
        createdBy: parseInt(createdBy, 10),
        status: 'OPEN'
      }
    });

    return NextResponse.json({ success: true, task: newTask });
  } catch (error) {
    console.error('Create Task Error:', error);
    return NextResponse.json({ error: 'خطا در ایجاد تسک' }, { status: 500 });
  }
}
