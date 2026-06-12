import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'کاربر نامشخص' }, { status: 400 });
    }

    const activeLocations = await prisma.location.findMany({
      where: {
        isLocked: true,
        lockedById: Number(userId)
      },
      select: {
        code: true,
        warehouse: true,
        floor: true
      }
    });

    return NextResponse.json({ active: activeLocations });
  } catch (error) {
    console.error('Fetch active locations error:', error);
    return NextResponse.json({ error: 'خطا در سرور' }, { status: 500 });
  }
}
