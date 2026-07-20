import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const shelfCode = searchParams.get('shelfCode');
    const warehouse = searchParams.get('warehouse');
    const userId = searchParams.get('userId');

    if (!shelfCode || !warehouse) {
      return NextResponse.json({ error: 'اطلاعات کامل نیست' }, { status: 400 });
    }

    const where = {
      shelfCode: shelfCode.toUpperCase(),
      warehouse: Number(warehouse),
      status: 'PENDING' // Assuming PENDING means it is part of an active session
    };
    
    if (userId) {
      where.user_id = Number(userId);
    }

    const history = await prisma.counting.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // Map to the format the UI expects: { code: product_id, name: product_name, count: new_count, id: database_id }
    const formatted = history.map(h => ({
      id: h.id,
      code: h.product_id,
      name: h.product_name,
      count: h.new_count
    }));

    return NextResponse.json({ history: formatted });
  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json({ error: 'خطا در دریافت تاریخچه' }, { status: 500 });
  }
}
