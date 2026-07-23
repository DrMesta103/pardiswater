import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = JSON.parse(setting.value);
      return acc;
    }, {});
    
    // Default settings if not exists
    if (settingsMap['blind_counting'] === undefined) {
      settingsMap['blind_counting'] = false;
    }
    if (settingsMap['correction_roles'] === undefined) {
      settingsMap['correction_roles'] = ['ADMIN', 'SUPERVISOR'];
    }
    if (settingsMap['shelf_assignment_rotation_cycles'] === undefined) {
      settingsMap['shelf_assignment_rotation_cycles'] = 2;
    }
    if (settingsMap['warehouses'] === undefined) {
      settingsMap['warehouses'] = [
        { id: '11', name: 'انبار مرکزی' },
        { id: '13', name: 'انبار فروشگاه' },
        { id: '14', name: 'انبار کارگاه شارژ' },
        { id: '15', name: 'انبار کارگاه تعمیرات' }
      ];
    }
    
    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error('Settings error:', error);
    return NextResponse.json({ error: 'خطا در دریافت تنظیمات' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    
    // Process each key-value pair
    for (const [key, value] of Object.entries(data)) {
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value: JSON.stringify(value) },
        create: { key, value: JSON.stringify(value) },
      });
    }

    return NextResponse.json({ message: 'تنظیمات با موفقیت ذخیره شد' });
  } catch (error) {
    console.error('Settings save error:', error);
    return NextResponse.json({ error: 'خطا در ذخیره تنظیمات' }, { status: 500 });
  }
}
