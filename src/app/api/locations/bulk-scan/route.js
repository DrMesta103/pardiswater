import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { tokens, warehouseId } = await req.json();
    
    if (!tokens || !tokens.length) {
      return NextResponse.json({ error: 'کد اسکن شده نامعتبر است' }, { status: 400 });
    }

    // 1. Fetch system settings to get level names
    const settingsDb = await prisma.systemSetting.findMany();
    const settings = settingsDb.reduce((acc, setting) => {
      acc[setting.key] = JSON.parse(setting.value);
      return acc;
    }, {});
    
    const locationLevels = settings.location_levels || [];

    let currentParentId = null;
    let currentCode = '';
    let finalWarehouse = warehouseId ? parseInt(warehouseId, 10) : null;

    // 2. Iterate and ensure creation
    for (let i = 0; i < tokens.length; i++) {
      const title = tokens[i];
      currentCode += title.toUpperCase();
      
      const levelName = locationLevels[i] 
        ? (typeof locationLevels[i] === 'string' ? locationLevels[i] : locationLevels[i].name)
        : `سطح ${i + 1}`;

      // Check if this location exists
      let loc = await prisma.location.findUnique({
        where: { code: currentCode }
      });

      if (!loc) {
        // Create it
        loc = await prisma.location.create({
          data: {
            code: currentCode,
            title: title.toUpperCase(),
            type: levelName,
            level: i + 1,
            parentId: currentParentId,
            warehouse: finalWarehouse
          }
        });
      } else {
        // If it exists, update finalWarehouse to match its warehouse for children
        finalWarehouse = loc.warehouse;
      }

      currentParentId = loc.id;
    }

    return NextResponse.json({ success: true, parentId: currentParentId });
  } catch (error) {
    console.error('Bulk scan error:', error);
    return NextResponse.json({ error: 'خطا در ایجاد ساختار قفسه' }, { status: 500 });
  }
}
