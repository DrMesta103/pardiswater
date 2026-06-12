import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'عدم احراز هویت' }, { status: 401 });
    const user = verifyToken(authHeader.replace('Bearer ', ''));
    if (!user) return NextResponse.json({ error: 'توکن نامعتبر' }, { status: 401 });

    const { shelfCode, action } = await req.json(); // action: 'LOCK' | 'UNLOCK'

    const location = await prisma.location.findUnique({ where: { code: shelfCode } });
    if (!location) return NextResponse.json({ error: 'قفسه یافت نشد' }, { status: 404 });

    if (action === 'LOCK') {
      if (location.isLocked && location.lockedById !== user.id) {
        const lockedByUser = await prisma.user.findUnique({ where: { id: location.lockedById } });
        return NextResponse.json({ error: `این قفسه توسط "${lockedByUser?.name || 'کاربر دیگر'}" در حال شمارش است.` }, { status: 403 });
      }

      await prisma.location.update({
        where: { code: shelfCode },
        data: { isLocked: true, lockedById: user.id, lockedAt: new Date() }
      });
      return NextResponse.json({ message: 'قفسه با موفقیت قفل شد.' });
    } 
    else if (action === 'UNLOCK') {
      // Allow the locker or an Admin/Supervisor to unlock
      if (location.isLocked && location.lockedById !== user.id && !user.roles?.includes('ADMIN') && !user.roles?.includes('SUPERVISOR')) {
        return NextResponse.json({ error: 'شما دسترسی باز کردن این قفسه را ندارید' }, { status: 403 });
      }

      await prisma.location.update({
        where: { code: shelfCode },
        data: { isLocked: false, lockedById: null, lockedAt: null }
      });
      return NextResponse.json({ message: 'قفل قفسه باز شد.' });
    }

    return NextResponse.json({ error: 'عملیات نامعتبر' }, { status: 400 });

  } catch (error) {
    console.error('Lock error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
