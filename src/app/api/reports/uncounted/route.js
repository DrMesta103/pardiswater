import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import axios from 'axios';

const HESABFA_API_KEY = process.env.HESABFA_API_KEY || 'NCuDX3bksHlhXWGIqTvatvme3YTplxdF';
const HESABFA_TOKEN = process.env.HESABFA_TOKEN || '4ddb2fc517f6f6fe6d4b9bdd08fa0df31a564a62e12c4353eb9533ae63447b57ca87c479beb7f02b276929c861dad779';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const warehouse = searchParams.get('warehouse') || '11';

  try {
    // 1. Fetch countings
    const countings = await prisma.counting.findMany({
      where: { warehouse: Number(warehouse), status: { not: 'CANCELLED' } }
    });
    
    // Get distinct product IDs that were counted
    const countedProductIds = new Set(countings.map(c => Number(c.product_id)));

    // 2. Fetch all products from Hesabfa
    const res = await axios.post('https://api.hesabfa.com/v1/item/getitems', {
      apiKey: HESABFA_API_KEY,
      loginToken: HESABFA_TOKEN,
      queryInfo: { Take: 2000, Skip: 0 },
      type: 0
    });

    const hesabfaItems = res.data?.Result?.List || [];

    // 3. Filter items that have Stock > 0 but are not in countedProductIds
    const uncounted = hesabfaItems.filter(item => {
      // Check if not counted
      if (countedProductIds.has(item.Code)) return false;
      
      // Check if it has stock (assuming item.Stock or finding via another property, some accounts use item.Stock)
      // Since getitems might not return Stock per warehouse, we assume if Stock > 0 it should have been counted.
      const stock = Number(item.Stock) || 0;
      return stock > 0;
    });

    return NextResponse.json({ uncounted });

  } catch (error) {
    console.error('Uncounted Error:', error);
    return NextResponse.json({ error: 'خطا در محاسبه کالاهای شمارش نشده' }, { status: 500 });
  }
}
