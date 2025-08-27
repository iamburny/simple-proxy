const axios = require('axios');

async function testDirectRequest() {
  console.log('\n=== TESTING DIRECT REQUEST ===');
  try {
    const response = await axios.get('https://www.autotrader.co.uk/', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
      },
      timeout: 30000,
    });
    console.log(`SUCCESS: ${response.status} ${response.statusText}`);
    console.log(`Response length: ${response.data.length}`);
    console.log('Response headers:', Object.keys(response.headers));
  } catch (error) {
    console.log(
      `ERROR: ${error.response?.status || 'Network'} - ${error.message}`
    );
    if (error.response?.data) {
      console.log('Error response:', error.response.data.substring(0, 200));
    }
  }
}

async function testProxyRequest() {
  console.log('\n=== TESTING PROXY REQUEST ===');
  try {
    const response = await axios.get('https://proxy.burny.uk/proxy', {
      params: {
        url: 'https://www.autotrader.co.uk/',
      },
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        Origin: 'https://www.autotrader.co.uk',
        Referer: 'https://www.autotrader.co.uk',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Dest': 'document',
      },
      timeout: 30000,
    });
    console.log(`SUCCESS: ${response.status} ${response.statusText}`);
    console.log(`Response length: ${JSON.stringify(response.data).length}`);
  } catch (error) {
    console.log(
      `ERROR: ${error.response?.status || 'Network'} - ${error.message}`
    );
    if (error.response?.data) {
      console.log(
        'Error response:',
        JSON.stringify(error.response.data).substring(0, 500)
      );
    }
  }
}

async function main() {
  await testDirectRequest();
  await testProxyRequest();
}

main().catch(console.error);
