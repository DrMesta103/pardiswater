import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // Delete all countings first (due to foreign key constraints if any)
    await prisma.counting.deleteMany({});
    
    // Delete all locations
    await prisma.location.deleteMany({});
    
    // Delete all tasks
    await prisma.task.deleteMany({});

    return NextResponse.json({ success: true, message: 'دیتا با موفقیت پاک شد' });
  } catch (error) {
    console.error('Error resetting data:', error);
    return NextResponse.json({ error: 'خطا در پاک کردن اطلاعات' }, { status: 500 });
  }
}
