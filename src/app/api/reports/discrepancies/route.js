import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const warehouse = searchParams.get('warehouse') || '11';

  try {
    // 1. Fetch all countings for this warehouse
    const countings = await prisma.counting.findMany({
      where: { warehouse: Number(warehouse) }
    });

    // 2. Aggregate counts by product_id
    // Wait, some products might be counted multiple times in the SAME shelf (override).
    // The logic should be: for a given (product_id, shelfCode), the latest count is the true count of that shelf.
    // So we group by product_id + shelfCode to find the latest count for that specific shelf.
    // Then we sum the counts for all shelves for that product.
    
    const shelfItemLatest = {}; // key: `${product_id}_${shelfCode}`, value: new_count
    const productNames = {};
    const oldCounts = {}; // What the system expects

    countings.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // Oldest first

    countings.forEach(c => {
      const key = `${c.product_id}_${c.shelfCode || 'NONE'}`;
      shelfItemLatest[key] = c.new_count;
      productNames[c.product_id] = c.product_name;
      // Assume old_count in DB is correct representation of Hesabfa at the time of count
      oldCounts[c.product_id] = c.old_count; 
    });

    // 3. Sum up the shelves for each product
    const aggregatedCounts = {}; // product_id -> total_counted
    const productLocations = {}; // product_id -> [shelves]

    for (const [key, count] of Object.entries(shelfItemLatest)) {
      const [productIdStr, shelfCode] = key.split('_');
      const pId = Number(productIdStr);
      
      if (!aggregatedCounts[pId]) aggregatedCounts[pId] = 0;
      aggregatedCounts[pId] += count;

      if (!productLocations[pId]) productLocations[pId] = [];
      if (shelfCode !== 'NONE' && count > 0) {
        productLocations[pId].push(shelfCode);
      }
    }

    // 4. Build Discrepancy Array
    const discrepancies = [];
    const accurate = [];

    for (const pId of Object.keys(aggregatedCounts)) {
      const totalCounted = aggregatedCounts[pId];
      const systemExpected = oldCounts[pId] || 0;
      const diff = totalCounted - systemExpected;
      
      const record = {
        product_id: pId,
        product_name: productNames[pId],
        system_expected: systemExpected,
        total_counted: totalCounted,
        difference: diff,
        locations: productLocations[pId]
      };

      if (diff === 0) {
        accurate.push(record);
      } else {
        discrepancies.push(record);
      }
    }

    // Sort discrepancies: most missing first (negative diff)
    discrepancies.sort((a, b) => a.difference - b.difference);

    return NextResponse.json({ discrepancies, accurate });

  } catch (error) {
    console.error('Discrepancy Error:', error);
    return NextResponse.json({ error: 'خطا در محاسبه مغایرت‌ها' }, { status: 500 });
  }
}
