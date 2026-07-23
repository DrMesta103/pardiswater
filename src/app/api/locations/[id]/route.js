import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function DELETE(req, { params }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    const location = await prisma.location.findUnique({
      where: { id }
    });

    if (!location) return NextResponse.json({ error: 'قفسه/سطح یافت نشد' }, { status: 404 });

    // Check if there are ANY countings for this code or its children (using startsWith)
    const countingsCount = await prisma.counting.count({
      where: {
        shelfCode: {
          startsWith: location.code
        }
      }
    });

    if (countingsCount > 0) {
      return NextResponse.json({ error: 'این سطح یا زیرمجموعه‌های آن دارای کالای شمرده شده است و قابل حذف نیست.' }, { status: 400 });
    }

    // Since no countings exist, we can safely delete tasks and locations
    // 1. Delete all tasks related to this location or its children
    await prisma.task.deleteMany({
      where: {
        targetId: {
          startsWith: location.code
        }
      }
    });

    // 2. Delete all child locations
    await prisma.location.deleteMany({
      where: {
        code: {
          startsWith: location.code
        },
        id: {
          not: id // Exclude parent to delete it last, or just let it be deleted here
        }
      }
    });

    // 3. Delete the parent location itself
    await prisma.location.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Location Error:', error);
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
