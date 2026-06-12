import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function DELETE(req, { params }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    const location = await prisma.location.findUnique({
      where: { id },
      include: { _count: { select: { countings: true } } }
    });

    if (!location) return NextResponse.json({ error: 'قفسه یافت نشد' }, { status: 404 });
    if (location._count.countings > 0) {
      return NextResponse.json({ error: 'این قفسه دارای کالای شمرده شده است و قابل حذف نیست.' }, { status: 400 });
    }

    await prisma.location.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'خطا در حذف قفسه' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    const { code, warehouse } = await req.json();

    const location = await prisma.location.findUnique({
      where: { id },
      include: { _count: { select: { countings: true } } }
    });

    if (!location) return NextResponse.json({ error: 'قفسه یافت نشد' }, { status: 404 });
    if (location._count.countings > 0) {
      return NextResponse.json({ error: 'این قفسه دارای کالا است و قابل ویرایش نیست.' }, { status: 400 });
    }

    const regex = /^([A-Za-z]+)(\d+)([A-Za-z]+)(\d+)$/;
    const match = code.toUpperCase().match(regex);
    if (!match) return NextResponse.json({ error: 'فرمت کد نامعتبر است. مثال: C2F2' }, { status: 400 });

    const [, floor, regionStr, sector, rowStr] = match;
    const region = parseInt(regionStr, 10);
    const row = parseInt(rowStr, 10);
    const warehouseId = warehouse ? parseInt(warehouse, 10) : null;

    const updated = await prisma.location.update({
      where: { id },
      data: { code: code.toUpperCase(), floor, region, sector, row, warehouse: warehouseId }
    });

    return NextResponse.json({ success: true, location: updated });
  } catch (error) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'این کد قفسه از قبل وجود دارد' }, { status: 400 });
    return NextResponse.json({ error: 'خطا در ویرایش قفسه' }, { status: 500 });
  }
}
