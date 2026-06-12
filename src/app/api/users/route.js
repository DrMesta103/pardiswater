import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        mobile: true,
        roles: true,
        createdAt: true,
        _count: {
          select: { countings: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Parse roles
    const parsedUsers = users.map(user => {
      let parsedRoles = user.roles;
      if (typeof parsedRoles === 'string') {
        try { parsedRoles = JSON.parse(parsedRoles); } catch (e) { parsedRoles = null; }
      }
      return {
        ...user,
        roles: Array.isArray(parsedRoles) ? parsedRoles : ['COUNTER']
      };
    });

    return NextResponse.json(parsedUsers);
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ error: 'خطا در دریافت کاربران' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, roles } = await req.json();
    
    if (!id || !roles) {
      return NextResponse.json({ error: 'اطلاعات ناقص است' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { roles: JSON.stringify(roles) },
      select: { id: true, roles: true }
    });

    return NextResponse.json({ message: 'نقش‌های کاربر بروزرسانی شد', user: updated });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی کاربر' }, { status: 500 });
  }
}
