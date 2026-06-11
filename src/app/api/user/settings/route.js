import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function PUT(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'عدم دسترسی (توکن ارسال نشده)' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (!payload || !payload.id) {
      return NextResponse.json({ error: 'عدم دسترسی (توکن نامعتبر)' }, { status: 401 });
    }

    const body = await req.json();
    const { name, password, avatarUrl } = body;

    const dataToUpdate = {};
    if (name) dataToUpdate.name = name;
    if (avatarUrl) dataToUpdate.avatarUrl = avatarUrl;
    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: payload.id },
      data: dataToUpdate,
      select: { id: true, username: true, name: true, role: true, avatarUrl: true }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Settings error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
