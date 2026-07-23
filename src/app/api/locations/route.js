import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get('parentId');
    const code = searchParams.get('code');
    
    if (code) {
      const location = await prisma.location.findFirst({
        where: { code: code.toUpperCase() },
        include: { 
          _count: { select: { countings: true, children: true } },
          parent: {
            include: {
              parent: {
                include: { parent: true }
              }
            }
          }
        }
      });
      return NextResponse.json(location);
    }

    let where = {};
    const level = searchParams.get('level');
    const warehouseId = searchParams.get('warehouseId');
    
    if (warehouseId) {
      where.warehouse = parseInt(warehouseId, 10);
    }
    
    if (level) {
      where.level = parseInt(level, 10);
    } else if (parentId === 'null' || !parentId) {
      where.parentId = null;
    } else {
      where.parentId = parseInt(parentId, 10);
    }

    const locations = await prisma.location.findMany({
      where,
      include: { 
        _count: { select: { countings: true, children: true } },
        parent: {
          include: {
            parent: {
              include: { parent: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json(locations);
  } catch (error) {
    return NextResponse.json({ error: 'خطا در دریافت لیست' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { title, type, parentId, warehouse } = await req.json(); 
    
    if (!title || !type) {
      return NextResponse.json({ error: 'عنوان و نوع سطح الزامی است' }, { status: 400 });
    }

    let code = title.toUpperCase();
    let level = 1;
    let finalWarehouse = warehouse ? parseInt(warehouse, 10) : null;

    if (parentId) {
      const parent = await prisma.location.findUnique({ where: { id: parseInt(parentId, 10) } });
      if (parent) {
        code = parent.code + title.toUpperCase();
        level = parent.level + 1;
        finalWarehouse = parent.warehouse; // Inherit warehouse from parent
      }
    }

    const location = await prisma.location.create({
      data: {
        code,
        title,
        type,
        level,
        parentId: parentId ? parseInt(parentId, 10) : null,
        warehouse: finalWarehouse
      }
    });

    return NextResponse.json({ success: true, location });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') return NextResponse.json({ error: 'کد ترکیبی ایجاد شده تکراری است' }, { status: 400 });
    return NextResponse.json({ error: 'خطا در ثبت' }, { status: 500 });
  }
}
