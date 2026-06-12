import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const data = await req.json();
    
    if (data.shelfCode) {
      await prisma.location.upsert({
        where: { code: data.shelfCode.toUpperCase() },
        update: {},
        create: { code: data.shelfCode.toUpperCase(), floor: '0', region: 0, sector: 'A', row: 0 }
      });
    }
    
    const count = await prisma.counting.create({
      data: {
        product_id: Number(data.product_id),
        product_name: data.product_name,
        warehouse: Number(data.warehouse),
        shelfCode: data.shelfCode ? data.shelfCode.toUpperCase() : null,
        old_count: Number(data.old_count),
        new_count: Number(data.new_count),
        user_id: Number(data.user_id),
        mode: data.mode || 'SHELF',
        is_offline: data.is_offline || false
      }
    });

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'خطا در ثبت اطلاعات' }, { status: 500 });
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('product_id');
  const warehouse = searchParams.get('warehouse');
  const userId = searchParams.get('user_id');

  try {
    if (productId && warehouse) {
      const lastCount = await prisma.counting.findFirst({
        where: { product_id: Number(productId), warehouse: Number(warehouse) },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json(lastCount || { message: -1 });
    }
    
    if (userId) {
      const counts = await prisma.counting.findMany({
        where: { user_id: Number(userId) },
        orderBy: { createdAt: 'desc' },
        include: { location: true }
      });
      return NextResponse.json(counts);
    }

    const allCounts = await prisma.counting.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { name: true } }, location: true }
    });
    return NextResponse.json(allCounts);

  } catch (error) {
    return NextResponse.json({ error: 'خطا در دریافت اطلاعات' }, { status: 500 });
  }
}
