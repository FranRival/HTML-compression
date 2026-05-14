const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: [
    'https://htmlcompressionchecker.top',
    'http://htmlcompressionchecker.top',
    'http://localhost:3000',
    'http://localhost:5500'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));

// Servir archivos estáticos (index.html, app.js, etc)
app.use(express.static(path.join(__dirname)));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API: HTTP Compression Test
app.post('/api/test-compression', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ 
      success: false,
      error: 'URL is required',
      code: 'MISSING_URL'
    });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol');
    }
  } catch (e) {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid URL format. Use https://example.com',
      code: 'INVALID_URL',
      url
    });
  }

  try {
    console.log(`[${new Date().toISOString()}] Testing: ${url}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent': 'HTML-Compression-Checker/1.0'
      },
      signal: controller.signal,
      redirect: 'follow'
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).json({ 
        success: false,
        error: `Server returned HTTP ${response.status}`,
        code: 'HTTP_ERROR',
        url,
        status: response.status
      });
    }

    const contentEncoding = response.headers.get('content-encoding');
    const contentLength = response.headers.get('content-length');
    const contentType = response.headers.get('content-type');
    const cacheControl = response.headers.get('cache-control');
    const vary = response.headers.get('vary');
    const server = response.headers.get('server');

    const body = await response.text();
    const uncompressedSize = Buffer.byteLength(body, 'utf8');
    const compressedSize = contentLength ? parseInt(contentLength) : uncompressedSize;

    const reduction = uncompressedSize > 0 
      ? Math.round(((uncompressedSize - compressedSize) / uncompressedSize) * 100)
      : 0;

    const compressionRatio = compressedSize > 0 
      ? (uncompressedSize / compressedSize).toFixed(2) + 'x'
      : 'N/A';

    let compressionType = 'none';
    if (contentEncoding) {
      if (contentEncoding.includes('br')) compressionType = 'brotli';
      else if (contentEncoding.includes('gzip')) compressionType = 'gzip';
      else if (contentEncoding.includes('deflate')) compressionType = 'deflate';
    }

    const gzipEstimate = Math.round(uncompressedSize * 0.25);
    const brotliEstimate = Math.round(uncompressedSize * 0.20);

    console.log(`[${new Date().toISOString()}] Success: ${url} - Compression: ${compressionType}`);

    return res.json({
      success: true,
      url,
      compression: {
        enabled: compressionType !== 'none',
        type: compressionType,
        gzipEnabled: compressionType === 'gzip' || (contentEncoding && contentEncoding.includes('gzip')) || false,
        brotliEnabled: compressionType === 'brotli' || (contentEncoding && contentEncoding.includes('br')) || false,
        deflateEnabled: compressionType === 'deflate' || (contentEncoding && contentEncoding.includes('deflate')) || false
      },
      sizes: {
        uncompressed: uncompressedSize,
        compressed: compressedSize,
        reduction: reduction,
        ratio: compressionRatio,
        gzipEstimate: gzipEstimate,
        brotliEstimate: brotliEstimate
      },
      headers: {
        'content-encoding': contentEncoding || 'none',
        'content-type': contentType || 'unknown',
        'content-length': contentLength || 'not provided',
        'cache-control': cacheControl || 'not set',
        'vary': vary || 'not set',
        'server': server || 'not provided'
      },
      recommendations: generateRecommendations(compressionType, reduction, uncompressedSize)
    });

  } catch (error) {
    console.error(`Error testing ${url}:`, error.message);

    let errorCode = 'UNKNOWN_ERROR';
    let errorMessage = error.message;

    if (error.message.includes('ENOTFOUND') || error.code === 'ENOTFOUND') {
      errorCode = 'DOMAIN_NOT_FOUND';
      errorMessage = 'Domain not found or DNS resolution failed';
    } else if (error.message.includes('AbortError') || error.name === 'AbortError') {
      errorCode = 'TIMEOUT';
      errorMessage = 'Request timed out (10 seconds)';
    }

    return res.status(500).json({
      success: false,
      error: errorMessage,
      code: errorCode,
      url,
      hint: 'Make sure the URL is correct and the site is reachable'
    });
  }
});

function generateRecommendations(compressionType, reduction, size) {
  const recs = [];

  if (compressionType === 'none') {
    recs.push({
      severity: 'critical',
      message: 'Compression is not enabled',
      action: 'Enable gzip or brotli compression on your server'
    });
  } else if (compressionType === 'gzip') {
    recs.push({
      severity: 'info',
      message: 'Using gzip compression',
      action: 'Consider upgrading to brotli for 10-20% better compression'
    });
  } else if (compressionType === 'brotli') {
    recs.push({
      severity: 'success',
      message: 'Using brotli compression',
      action: 'Excellent choice! Brotli provides optimal compression.'
    });
  }

  if (reduction < 50) {
    recs.push({
      severity: 'warning',
      message: 'Compression reduction is low (' + reduction + '%)',
      action: 'Consider minifying HTML, CSS, and JavaScript first'
    });
  }

  if (size > 500000) {
    recs.push({
      severity: 'warning',
      message: 'Page size is large (' + (size / 1024 / 1024).toFixed(2) + ' MB)',
      action: 'Optimize images, lazy-load content, and minify assets'
    });
  }

  if (reduction >= 70) {
    recs.push({
      severity: 'success',
      message: 'Excellent compression ratio (' + reduction + '%)',
      action: 'Your compression settings are well-configured'
    });
  }

  return recs;
}

app.listen(PORT, () => {
  console.log(`🚀 HTML Compression Test running on port ${PORT}`);
});