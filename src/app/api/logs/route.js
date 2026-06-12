import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const take = parseInt(url.searchParams.get('take')) || 50;
    const skip = parseInt(url.searchParams.get('skip')) || 0;
    const type = url.searchParams.get('type'); // optional filter

    const where = type && type !== 'ALL' ? { action: type } : {};

    const [logs, total] = await Promise.all([
      prisma.actionLog.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, username: true } } }
      }),
      prisma.actionLog.count({ where })
    ]);

    return NextResponse.json({ logs, total });
  } catch (error) {
    console.error('Fetch logs error:', error);
    return NextResponse.json({ error: 'خطا در دریافت لاگ‌ها' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId, action, details } = await req.json();
    
    if (!userId || !action) {
      return NextResponse.json({ error: 'اطلاعات ناقص است' }, { status: 400 });
    }

    const log = await prisma.actionLog.create({
      data: {
        userId: Number(userId),
        action,
        details
      }
    });

    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error('Create log error:', error);
    return NextResponse.json({ error: 'خطا در ثبت لاگ' }, { status: 500 });
  }
}
