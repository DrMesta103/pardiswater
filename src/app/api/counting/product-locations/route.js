import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('product_id');
  const warehouse = searchParams.get('warehouse');
  const currentShelf = searchParams.get('current_shelf');

  if (!productId || !warehouse) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    const locations = await prisma.counting.findMany({
      where: { 
        product_id: productId, 
        warehouse: Number(warehouse),
        shelfCode: { not: currentShelf || undefined }
      },
      distinct: ['shelfCode'],
      select: { shelfCode: true }
    });

    const otherShelves = locations.map(l => l.shelfCode).filter(Boolean);
    return NextResponse.json({ shelves: otherShelves });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error fetching locations' }, { status: 500 });
  }
}
