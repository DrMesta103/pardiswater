import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    const { roles } = await req.json();

    const updated = await prisma.user.update({
      where: { id },
      data: { roles }
    });
    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    return NextResponse.json({ error: 'خطا در ویرایش کاربر' }, { status: 500 });
  }
}
