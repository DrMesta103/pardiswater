import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { code, warehouse } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'کد قفسه الزامی است' }, { status: 400 });
    }

    const location = await prisma.location.findFirst({
      where: {
        code: code,
        warehouse: warehouse
      }
    });

    if (!location) {
      return NextResponse.json({ error: 'این قفسه در این انبار وجود ندارد' }, { status: 404 });
    }

    if (location.isLocked) {
      return NextResponse.json({ 
        error: 'این قفسه در حال حاضر توسط شخص دیگری قفل شده و در حال انبارگردانی است',
        lockedBy: location.lockedById 
      }, { status: 403 });
    }

    return NextResponse.json({ success: true, location });
  } catch (error) {
    console.error('Validate location error:', error);
    return NextResponse.json({ error: 'خطا در اعتبارسنجی قفسه' }, { status: 500 });
  }
}
