import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouse');

    const unknowns = await prisma.count.findMany({
      where: {
        product_id: {
          startsWith: 'UNKNOWN_'
        },
        ...(warehouseId && { warehouse_id: Number(warehouseId) })
      },
      include: {
        user: {
          select: { name: true, username: true }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return NextResponse.json({ unknowns });
  } catch (error) {
    console.error('Unknowns API Error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
