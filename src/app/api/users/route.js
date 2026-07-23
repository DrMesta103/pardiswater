import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        mobile: true,
        roles: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            countings: true,
            createdTasks: true,
            assignedTasks: true,
            actionLogs: true,
          }
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

export async function POST(req) {
  try {
    const { name, username, mobile, password, roles, isActive } = await req.json();
    
    if (!username || !password) {
      return NextResponse.json({ error: 'نام کاربری و رمز عبور الزامی است' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json({ error: 'این نام کاربری قبلاً ثبت شده است' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await prisma.user.create({
      data: {
        name: name || null,
        username,
        mobile: mobile || null,
        password: hashedPassword,
        roles: roles ? JSON.stringify(roles) : JSON.stringify(['COUNTER']),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
      select: {
        id: true,
        name: true,
        username: true,
        mobile: true,
        roles: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            countings: true,
            createdTasks: true,
            assignedTasks: true,
            actionLogs: true,
          }
        }
      }
    });

    let parsedRoles = newUser.roles;
    if (typeof parsedRoles === 'string') {
      try { parsedRoles = JSON.parse(parsedRoles); } catch (e) { parsedRoles = null; }
    }
    newUser.roles = Array.isArray(parsedRoles) ? parsedRoles : ['COUNTER'];

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'خطا در ایجاد کاربر' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, name, username, mobile, roles, isActive, password } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'شناسه کاربر الزامی است' }, { status: 400 });
    }

    const userId = parseInt(id);

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    if (username && username !== existingUser.username) {
      const takenUser = await prisma.user.findUnique({ where: { username } });
      if (takenUser) {
        return NextResponse.json({ error: 'این نام کاربری توسط کاربر دیگری استفاده شده است' }, { status: 400 });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name || null;
    if (username !== undefined) updateData.username = username;
    if (mobile !== undefined) updateData.mobile = mobile || null;
    if (roles !== undefined) updateData.roles = JSON.stringify(roles);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        mobile: true,
        roles: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            countings: true,
            createdTasks: true,
            assignedTasks: true,
            actionLogs: true,
          }
        }
      }
    });

    let parsedRoles = updated.roles;
    if (typeof parsedRoles === 'string') {
      try { parsedRoles = JSON.parse(parsedRoles); } catch (e) { parsedRoles = null; }
    }
    updated.roles = Array.isArray(parsedRoles) ? parsedRoles : ['COUNTER'];

    return NextResponse.json({ message: 'اطلاعات کاربر بروزرسانی شد', user: updated });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی کاربر' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    let id;
    const { searchParams } = new URL(req.url);
    const queryId = searchParams.get('id');

    if (queryId) {
      id = parseInt(queryId);
    } else {
      const body = await req.json();
      id = parseInt(body.id);
    }

    if (!id || isNaN(id)) {
      return NextResponse.json({ error: 'شناسه کاربر الزامی است' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            countings: true,
            createdTasks: true,
            assignedTasks: true,
            actionLogs: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    const totalDataCount = (user._count.countings || 0) +
                           (user._count.createdTasks || 0) +
                           (user._count.assignedTasks || 0) +
                           (user._count.actionLogs || 0);

    if (totalDataCount > 0) {
      return NextResponse.json({ 
        error: `امکان حذف این کاربر به دلیل داشتن ${totalDataCount} سابقه/رکورد ثبت‌شده وجود ندارد. می‌توانید کاربر را غیرفعال کنید.`
      }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: 'کاربر با موفقیت حذف شد' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'خطا در حذف کاربر' }, { status: 500 });
  }
}
