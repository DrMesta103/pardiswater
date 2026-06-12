import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        countings: true
      }
    });

    const report = users.map(user => {
      const counts = user.countings || [];
      const totalCounted = counts.length;
      
      // Calculate discrepancies (assuming old_count !== new_count)
      const discrepancies = counts.filter(c => c.old_count !== c.new_count).length;
      
      // Calculate total cancelled
      const cancelled = counts.filter(c => c.status === 'CANCELLED').length;

      // Unique shelves visited
      const uniqueShelves = new Set(counts.map(c => c.shelfCode).filter(Boolean)).size;

      return {
        id: user.id,
        name: user.name || user.username,
        totalCounted,
        discrepancies,
        cancelled,
        uniqueShelves,
        accuracy: totalCounted > 0 ? (((totalCounted - discrepancies) / totalCounted) * 100).toFixed(1) : 0
      };
    }).filter(u => u.totalCounted > 0);

    // Sort top performers by totalCounted
    const topPerformers = [...report].sort((a, b) => b.totalCounted - a.totalCounted).slice(0, 5);
    
    // Sort most discrepancies
    const mostDiscrepancies = [...report].sort((a, b) => b.discrepancies - a.discrepancies).slice(0, 5);

    return NextResponse.json({
      topPerformers,
      mostDiscrepancies,
      all: report.sort((a, b) => b.totalCounted - a.totalCounted)
    });
  } catch (error) {
    console.error('Fetch leaderboard error:', error);
    return NextResponse.json({ error: 'خطا در دریافت گزارش' }, { status: 500 });
  }
}
