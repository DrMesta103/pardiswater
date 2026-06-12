import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { signToken } from '@/lib/auth';

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return Response.json({ error: 'نام کاربری و رمز عبور الزامی است.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return Response.json({ error: 'کاربر یافت نشد.' }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return Response.json({ error: 'رمز عبور اشتباه است.' }, { status: 401 });
    }

    let userRoles = Array.isArray(user.roles) ? user.roles : (user.role === 'ADMIN' ? ['ADMIN'] : ['COUNTER']);

    const token = signToken({ id: user.id, username: user.username, name: user.name, orgId: user.orgId, roles: userRoles, role: user.role });

    return Response.json({ message: 'با موفقیت وارد شدید', token, user: { id: user.id, name: user.name, orgId: user.orgId, roles: userRoles, avatarUrl: user.avatarUrl } });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'خطای سرور رخ داد.' }, { status: 500 });
  }
}
