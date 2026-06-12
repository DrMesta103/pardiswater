const axios = require('axios');

async function test() {
  const HESABFA_API_KEY = 'NCuDX3bksHlhXWGIqTvatvme3YTplxdF';
  const HESABFA_TOKEN = '4ddb2fc517f6f6fe6d4b9bdd08fa0df31a564a62e12c4353eb9533ae63447b57ca87c479beb7f02b276929c861dad779';

  try {
    const res = await axios.post('https://api.hesabfa.com/v1/item/getitems', {
      apiKey: HESABFA_API_KEY,
      loginToken: HESABFA_TOKEN,
      queryInfo: { Take: 5, Skip: 0 },
      type: 0
    });
    console.log("getitems List:");
    console.log(JSON.stringify(res.data.Result.List, null, 2));

    if (res.data.Result.List.length > 0) {
        const code = res.data.Result.List[0].Code;
        console.log("Checking quantity for:", code);
        const qRes = await axios.post('https://api.hesabfa.com/v1/item/GetQuantity2', {
            apiKey: HESABFA_API_KEY,
            loginToken: HESABFA_TOKEN,
            codes: [code]
        });
        console.log("GetQuantity2:");
        console.log(JSON.stringify(qRes.data, null, 2));
    }
    process.exit(0);
  } catch(e) {
      console.error(e.response ? e.response.data : e.message);
  }
}

test();
