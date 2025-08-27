const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 80;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.raw({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Debug endpoint to see what headers we're sending
app.all('/debug', (req, res) => {
  res.json({
    method: req.method,
    headers: req.headers,
    query: req.query,
    body: req.body,
    timestamp: new Date().toISOString(),
  });
});

// Main proxy endpoint
app.all('/proxy', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        error: 'Missing URL parameter. Use /proxy?url=<target_url>',
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid URL format',
      });
    }

    // Prepare request configuration
    const config = {
      method: req.method,
      url: url,
      headers: { ...req.headers },
      timeout: 60000, // 60 seconds timeout for AutoTrader
    };

    // Remove host and other headers that shouldn't be forwarded
    delete config.headers.host;
    delete config.headers['content-length'];

        // AutoTrader-specific debugging and minimal handling
    if (url.includes('autotrader.co.uk')) {
      console.log('🔍 AutoTrader request detected');
      console.log('URL:', url);
      console.log('User-Agent:', config.headers['user-agent']);
      console.log('Origin:', config.headers.origin);
      
      // Add minimal browser-like headers (only the essential ones)
      try {
        if (!config.headers['user-agent'] || config.headers['user-agent'].includes('curl')) {
          config.headers['user-agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
          console.log('✅ Added browser User-Agent');
        }
        
        // Only add Origin if it's missing and we're making a POST request
        if (req.method === 'POST' && !config.headers.origin) {
          config.headers.origin = 'https://www.autotrader.co.uk';
          console.log('✅ Added Origin header for POST request');
        }
        
        console.log('🚀 Proceeding with AutoTrader request...');
      } catch (error) {
        console.error('⚠️ Error in AutoTrader processing:', error.message);
      }
    }

    // Add request body for POST, PUT, PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())) {
      config.data = req.body;
    }

    // Add query parameters (excluding the 'url' parameter)
    const queryParams = { ...req.query };
    delete queryParams.url;

    if (Object.keys(queryParams).length > 0) {
      config.params = queryParams;
    }

    console.log(`\n=== PROXY REQUEST START ===`);
    console.log(`${req.method} ${url}`);
    console.log(
      'Original request headers:',
      JSON.stringify(req.headers, null, 2)
    );
    console.log(
      'Final config headers:',
      JSON.stringify(config.headers, null, 2)
    );

    if (req.body && Object.keys(req.body).length > 0) {
      console.log(
        'Request body:',
        JSON.stringify(req.body, null, 2).substring(0, 500)
      );
    }

    // Make the proxied request
    console.log(`Making axios request to: ${config.url}`);
    const response = await axios(config);
    console.log(`Axios request successful: ${response.status}`);

    console.log(`Response status: ${response.status} ${response.statusText}`);
    console.log('Response headers:', JSON.stringify(response.headers, null, 2));
    console.log(
      `Response data length: ${JSON.stringify(response.data).length}`
    );
    console.log('=== PROXY REQUEST END ===\n');

    // Forward response headers (excluding some that shouldn't be forwarded)
    const headersToExclude = [
      'content-length', // Let Express handle this
      'transfer-encoding', // Let Express handle this
      'connection',
      'keep-alive',
      'server', // Don't expose target server info
    ];

    Object.keys(response.headers).forEach((key) => {
      if (!headersToExclude.includes(key.toLowerCase())) {
        res.set(key, response.headers[key]);
      }
    });

    // Return the response
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('\n=== PROXY ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Request URL:', url);

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response status:', error.response.status);
      console.error(
        'Error response headers:',
        JSON.stringify(error.response.headers, null, 2)
      );
      console.error(
        'Error response data:',
        JSON.stringify(error.response.data).substring(0, 500)
      );
      
      // Special logging for AutoTrader errors
      if (url.includes('autotrader.co.uk')) {
        console.error('🚨 AUTOTRADER ERROR DETAILS:');
        console.error('Request method:', req.method);
        console.error('Final URL:', url);
        console.error('Request headers sent:', JSON.stringify(config.headers, null, 2));
        console.error('CloudFlare Ray ID:', error.response.headers['cf-ray']);
        console.error('Server response:', error.response.headers['server']);
      }
      
      console.error('=== PROXY ERROR END ===\n');

      res.status(error.response.status).json({
        error: 'Proxy request failed',
        status: error.response.status,
        message: error.response.data || error.message,
      });
    } else if (error.request) {
      // The request was made but no response was received
      res.status(503).json({
        error: 'Service unavailable',
        message: 'No response received from target server',
      });
    } else {
      // Something happened in setting up the request
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
});

// Catch-all for other routes
app.all('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'Use /proxy?url=<target_url> to proxy requests',
    examples: {
      GET: '/proxy?url=https://api.github.com/users/octocat',
      POST: '/proxy?url=https://httpbin.org/post',
    },
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(
    `Proxy endpoint: http://localhost:${PORT}/proxy?url=<target_url>`
  );
});
