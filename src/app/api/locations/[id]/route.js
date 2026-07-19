import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function DELETE(req, { params }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    const location = await prisma.location.findUnique({
      where: { id },
      include: { _count: { select: { countings: true, children: true } } }
    });

    if (!location) return NextResponse.json({ error: 'قفسه/سطح یافت نشد' }, { status: 404 });
    if (location._count.countings > 0) {
      return NextResponse.json({ error: 'این سطح دارای کالای شمرده شده است و قابل حذف نیست.' }, { status: 400 });
    }
    if (location._count.children > 0) {
      return NextResponse.json({ error: 'این سطح دارای زیرمجموعه است و قابل حذف نیست.' }, { status: 400 });
    }

    await prisma.location.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'خطا در حذف سطح' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    const { title, type, warehouse } = await req.json();

    const location = await prisma.location.findUnique({
      where: { id },
      include: { _count: { select: { countings: true } } }
    });

    if (!location) return NextResponse.json({ error: 'سطح یافت نشد' }, { status: 404 });

    let newCode = title.toUpperCase();
    if (location.parentId) {
      const parent = await prisma.location.findUnique({ where: { id: location.parentId } });
      if (parent) {
        newCode = parent.code + title.toUpperCase();
      }
    }

    const updated = await prisma.location.update({
      where: { id },
      data: { 
        title, 
        type, 
        code: newCode, 
        warehouse: warehouse ? parseInt(warehouse, 10) : null 
      }
    });

    return NextResponse.json({ success: true, location: updated });
  } catch (error) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'این عنوان برای این مسیر تکراری است' }, { status: 400 });
    return NextResponse.json({ error: 'خطا در ویرایش سطح' }, { status: 500 });
  }
}
