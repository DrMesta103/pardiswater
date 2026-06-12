import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const thresholdDays = parseInt(url.searchParams.get('days')) || 10;
    
    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - thresholdDays);

    // Get all locations
    const locations = await prisma.location.findMany({
      select: {
        id: true,
        code: true,
        warehouse: true,
        floor: true,
        region: true,
        sector: true
      }
    });

    // Get the most recent counting date for each location
    // Prisma group by or finding max date per shelf
    const latestCounts = await prisma.counting.groupBy({
      by: ['shelfCode'],
      _max: {
        createdAt: true
      }
    });

    const countMap = new Map();
    latestCounts.forEach(c => {
      countMap.set(c.shelfCode, c._max.createdAt);
    });

    // Filter locations that have either NEVER been counted, or the latest count is older than cutoff
    const uncounted = locations.filter(loc => {
      const lastCountDate = countMap.get(loc.code);
      if (!lastCountDate) return true; // Never counted
      return new Date(lastCountDate) < cutoffDate;
    });

    return NextResponse.json({ uncounted });
  } catch (error) {
    console.error('Fetch uncounted error:', error);
    return NextResponse.json({ error: 'خطا در دریافت لیست قفسه‌ها' }, { status: 500 });
  }
}
