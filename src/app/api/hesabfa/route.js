import { NextResponse } from 'next/server';
import axios from 'axios';

const HESABFA_API_KEY = process.env.HESABFA_API_KEY || 'NCuDX3bksHlhXWGIqTvatvme3YTplxdF';
const HESABFA_TOKEN = process.env.HESABFA_TOKEN || '4ddb2fc517f6f6fe6d4b9bdd08fa0df31a564a62e12c4353eb9533ae63447b57ca87c479beb7f02b276929c861dad779';

export async function POST(req) {
  try {
    const { code, type } = await req.json();

    if (type === 'name') {
      const res = await axios.post('https://api.hesabfa.com/v1/item/get', {
        apiKey: HESABFA_API_KEY,
        loginToken: HESABFA_TOKEN,
        code: Number(code)
      });
      return NextResponse.json(res.data);
    } 
    
    if (type === 'quantity') {
      const res = await axios.post('https://api.hesabfa.com/v1/item/GetQuantity2', {
        apiKey: HESABFA_API_KEY,
        loginToken: HESABFA_TOKEN,
        codes: [Number(code)]
      });
      return NextResponse.json(res.data);
    }

    if (type === 'all') {
      let allItems = [];
      let skip = 0;
      const take = 1000;
      
      while (true) {
        const res = await axios.post('https://api.hesabfa.com/v1/item/getitems', {
          apiKey: HESABFA_API_KEY,
          loginToken: HESABFA_TOKEN,
          queryInfo: { Take: take, Skip: skip },
          type: 0
        });
        
        const list = res.data?.Result?.List || [];
        if (list.length === 0) break;
        
        allItems = allItems.concat(list);
        skip += take;
      }
      
      return NextResponse.json({ Result: { List: allItems } });
    }

    if (type === 'warehouses') {
      const res = await axios.post('https://api.hesabfa.com/v1/setting/getWarehouses', {
        apiKey: HESABFA_API_KEY,
        loginToken: HESABFA_TOKEN
      });
      return NextResponse.json(res.data);
    }

    return NextResponse.json({ error: 'نوع درخواست نامعتبر است' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'خطا در ارتباط با حسابفا' }, { status: 500 });
  }
}
