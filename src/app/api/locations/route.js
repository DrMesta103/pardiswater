import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      include: { _count: { select: { countings: true } } },
      orderBy: [{ floor: 'asc' }, { region: 'asc' }, { sector: 'asc' }, { row: 'asc' }]
    });
    return NextResponse.json(locations);
  } catch (error) {
    return NextResponse.json({ error: 'خطا در دریافت لیست انبارها' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { code } = await req.json(); // "C2F2"
    
    // Pattern validation (e.g., C2F2 -> 1 Char, 1 Num, 1 Char, 1 Num)
    const regex = /^([A-Za-z]+)(\d+)([A-Za-z]+)(\d+)$/;
    const match = code.toUpperCase().match(regex);

    if (!match) {
      return NextResponse.json({ error: 'فرمت کد قفسه نامعتبر است. مثال صحیح: C2F2' }, { status: 400 });
    }

    const [, floor, regionStr, sector, rowStr] = match;
    const region = parseInt(regionStr, 10);
    const row = parseInt(rowStr, 10);

    const location = await prisma.location.upsert({
      where: { code: code.toUpperCase() },
      update: {}, // if exists, do nothing or update timestamps
      create: {
        code: code.toUpperCase(),
        floor,
        region,
        sector,
        row
      }
    });

    return NextResponse.json({ success: true, location });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'خطا در ثبت قفسه' }, { status: 500 });
  }
}
