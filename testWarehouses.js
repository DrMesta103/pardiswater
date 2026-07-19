const axios = require('axios');
async function test() {
  const HESABFA_API_KEY = 'NCuDX3bksHlhXWGIqTvatvme3YTplxdF';
  const HESABFA_TOKEN = '4ddb2fc517f6f6fe6d4b9bdd08fa0df31a564a62e12c4353eb9533ae63447b57ca87c479beb7f02b276929c861dad779';

  try {
    const res = await axios.post('https://api.hesabfa.com/v1/setting/GetSettings', {
      apiKey: HESABFA_API_KEY,
      loginToken: HESABFA_TOKEN,
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch(e) {
      console.error(e.response ? e.response.data : e.message);
  }
}
test();
