function switchTab(id, btn) {
  document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.tool-tab').forEach(function(b) { b.classList.remove('active'); });
  document.getElementById('tab-' + id).classList.add('active');
  btn.classList.add('active');
}

function fmtBytes(b) {
  var kb = 1024;
  var mb = 1048576;
  var s = Math.floor(b / kb);
  if (s === 0) return b + ' B';
  if (Math.floor(b / mb) === 0) return (b / kb).toFixed(1) + ' KB';
  return (b / mb).toFixed(2) + ' MB';
}

function onHtmlChange() {
  var v = document.getElementById('htmlInput').value;
  var bytes = new Blob([v]).size;
  document.getElementById('statChars').textContent = v.length + ' chars';
  document.getElementById('statBytes').textContent = fmtBytes(bytes);
  document.getElementById('origInfo').textContent = fmtBytes(bytes);
}

function doMinify() {
  var html = document.getElementById('htmlInput').value;
  if (!html.trim()) {
    document.getElementById('htmlOutput').textContent = 'Paste HTML in the left panel first.';
    return;
  }

  var result = html;
  var reComment  = /<!--[\s\S]*?-->/g;
  var reBetween  = />\s+</g;
  var reBefore   = /\s+>/g;
  var reAfter    = /<\s+/g;
  var reEmptyDQ  = /\s+(?:id|class|style|title|lang|dir|tabindex)=""\s*/g;
  var reEmptySQ  = /\s+(?:id|class|style|title|lang|dir|tabindex)=''\s*/g;
  var reStyle    = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  var reScript   = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  var reType     = /type=["']([^"']+)["']/;

  if (document.getElementById('optComments').checked) {
    result = result.replace(reComment, '');
  }

  if (document.getElementById('optWhitespace').checked) {
    result = result.replace(/\s+/g, ' ');
    result = result.replace(reBetween, '><');
    result = result.replace(reBefore, '>');
    result = result.replace(reAfter, '<');
  }

  if (document.getElementById('optEmptyAttrs').checked) {
    result = result.replace(reEmptyDQ, ' ');
    result = result.replace(reEmptySQ, ' ');
  }

  if (document.getElementById('optCSS').checked) {
    result = result.replace(reStyle, function(match, css) {
      var minCSS = css
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*\{\s*/g, '{')
        .replace(/\s*\}\s*/g, '}')
        .replace(/\s*:\s*/g, ':')
        .replace(/\s*;\s*/g, ';')
        .replace(/;\s*\}/g, '}')
        .trim();
      return '<style>' + minCSS + '</style>';
    });
  }

  if (document.getElementById('optJS').checked) {
    result = result.replace(reScript, function(match, js) {
      var typeMatch = match.match(reType);
      if (typeMatch && typeMatch[1] !== 'text/javascript' && typeMatch[1] !== 'application/javascript') {
        return match;
      }
      var minJS = js
        .replace(/\/\/[^\n]*/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .trim();
      return match.replace(js, minJS);
    });
  }

  result = result.trim();

  var origBytes   = new Blob([html]).size;
  var minBytes    = new Blob([result]).size;
  var saved       = origBytes - minBytes;
  var pct         = origBytes ? Math.round((saved / origBytes) * 100) : 0;
  var gzipBytes   = Math.round(minBytes * 0.25);
  var brotliBytes = Math.round(minBytes * 0.20);

  document.getElementById('htmlOutput').textContent  = result;
  document.getElementById('outInfo').textContent     = fmtBytes(minBytes);
  document.getElementById('origSize').textContent    = fmtBytes(origBytes);
  document.getElementById('minSize').textContent     = fmtBytes(minBytes);
  document.getElementById('savedPct').textContent    = pct + '%';
  document.getElementById('savedBytes').textContent  = fmtBytes(saved);
  document.getElementById('gzipEst').textContent     = '~' + fmtBytes(gzipBytes);
  document.getElementById('brotliEst').textContent   = '~' + fmtBytes(brotliBytes);
  document.getElementById('transferEst').textContent = '~' + fmtBytes(gzipBytes);

  var statsRow = document.getElementById('statsRow');
  statsRow.style.display       = 'flex';
  statsRow.style.flexDirection = 'column';
  statsRow.style.padding       = '16px 18px';
  statsRow.style.borderTop     = '1px solid var(--border)';
}

function doCopyOutput() {
  var text = document.getElementById('htmlOutput').textContent;
  if (!text) return;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  } else {
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

function loadSample() {
  var o = String.fromCharCode(60);
  var c = String.fromCharCode(62);
  var lines = [
    o + '!DOCTYPE html' + c,
    o + 'html lang="en"' + c,
    o + 'head' + c,
    '  ' + o + 'meta charset="UTF-8"' + c,
    '  ' + o + 'title' + c + 'Sample Page' + o + '/title' + c,
    '  ' + o + 'style' + c,
    '    body { font-family: Arial; margin: 0; padding: 20px; }',
    '    h1 { color: #333; font-size: 2rem; }',
    '    .container { max-width: 900px; margin: 0 auto; }',
    '  ' + o + '/style' + c,
    o + '/head' + c,
    o + 'body' + c,
    '',
    '  ' + o + 'div class="container"' + c,
    '    ' + o + 'h1' + c + 'Welcome' + o + '/h1' + c,
    '    ' + o + 'p' + c + 'Sample paragraph.' + o + '/p' + c,
    '    ' + o + 'nav' + c,
    '      ' + o + 'a href="/"' + c + 'Home' + o + '/a' + c,
    '      ' + o + 'a href="/about"' + c + 'About' + o + '/a' + c,
    '    ' + o + '/nav' + c,
    '  ' + o + '/div' + c,
    '',
    o + '/body' + c,
    o + '/html' + c
  ];
  document.getElementById('htmlInput').value = lines.join('\n');
  onHtmlChange();
  doMinify();
}

function doClear() {
  document.getElementById('htmlInput').value        = '';
  document.getElementById('htmlOutput').textContent = '';
  document.getElementById('origInfo').textContent   = '';
  document.getElementById('outInfo').textContent    = '';
  document.getElementById('statChars').textContent  = '0 chars';
  document.getElementById('statBytes').textContent  = '0 B';
  document.getElementById('statsRow').style.display = 'none';
}

function toggleFaq(btn) {
  btn.parentElement.classList.toggle('open');
}

// ============================================
// HTTP COMPRESSION TEST - Agregar a app.js
// ============================================

// Configuración del backend
const BACKEND_URL = ‘html-compression-production.up.railway.app’; // Reemplazar cuando tengas la URL de Railway

// Función principal de testing HTTP
async function testHTTPCompression() {
const urlInput = document.getElementById(‘urlInput’);
const url = urlInput.value.trim();
const testBtn = document.querySelector(’.btn-test’);

// Validación básica
if (!url) {
alert(‘Please enter a URL’);
urlInput.focus();
return;
}

// Validar formato URL
try {
new URL(url);
} catch (e) {
alert(‘Invalid URL format. Use https://example.com’);
return;
}

// UI: mostrar estado loading
testBtn.disabled = true;
testBtn.textContent = ‘Testing…’;
clearHTTPResults();

try {
console.log(‘Testing:’, url);


// Llamar al backend
const response = await fetch(`${BACKEND_URL}/api/test-compression`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ url }),
  timeout: 12000
});

const data = await response.json();

if (!response.ok || !data.success) {
  showHTTPError(data.error || 'Unknown error', data.code);
  return;
}

// Mostrar resultados
displayHTTPResults(data);


} catch (error) {
console.error(‘Test error:’, error);
showHTTPError(
error.message || ‘Failed to test URL. Check the URL and try again.’,
‘NETWORK_ERROR’
);
} finally {
testBtn.disabled = false;
testBtn.textContent = ‘Test Compression’;
}
}

// Mostrar resultados en la UI
function displayHTTPResults(data) {
// Response Headers
document.querySelectorAll(’.hrc-row’).forEach(row => {
const key = row.querySelector(’.hrc-key’).textContent.toLowerCase().replace(/-/g, ‘-’);
const headerKey = key.replace(/\s+/g, ‘-’);
const value = data.headers[headerKey] || data.headers[key] || ‘—’;
const valSpan = row.querySelector(‘span:last-child’);
if (valSpan) {
valSpan.className = ‘’;
valSpan.textContent = value;
valSpan.style.color = ‘var(–ink)’;
}
});

// Compression Analysis
const analysisRows = document.querySelectorAll(’.http-result-card:nth-child(2) .hrc-row’);
if (analysisRows.length >= 5) {
// Row 1: Gzip enabled
updateAnalysisRow(analysisRows[0],
data.compression.gzipEnabled ? ‘✅ Yes’ : ‘❌ No’,
data.compression.gzipEnabled ? ‘var(–green)’ : ‘var(–red)’
);


// Row 2: Brotli enabled
updateAnalysisRow(analysisRows[1],
  data.compression.brotliEnabled ? '✅ Yes' : '❌ No',
  data.compression.brotliEnabled ? 'var(--green)' : 'var(--red)'
);

// Row 3: Compressed size
updateAnalysisRow(analysisRows[2],
  fmtBytes(data.sizes.compressed),
  'var(--ink)'
);

// Row 4: Uncompressed size
updateAnalysisRow(analysisRows[3],
  fmtBytes(data.sizes.uncompressed),
  'var(--ink-muted)'
);

// Row 5: Reduction
const reductionColor = data.sizes.reduction >= 70 ? 'var(--green)' : 
                      data.sizes.reduction >= 50 ? 'var(--orange)' : 'var(--red)';
updateAnalysisRow(analysisRows[4],
  data.sizes.reduction + '%',
  reductionColor
);


}

// Checklist visual
updateCompressionChecklist(data.compression);

// Mostrar recomendaciones si existen
if (data.recommendations && data.recommendations.length > 0) {
displayRecommendations(data.recommendations);
}

// Mostrar stats row si está oculto
const statsRow = document.getElementById(‘statsRow’);
if (statsRow) {
statsRow.style.display = ‘flex’;
}
}

// Helper: actualizar fila de análisis
function updateAnalysisRow(row, value, color) {
const valSpan = row.querySelector(‘span:last-child’);
if (valSpan) {
valSpan.className = ‘’;
valSpan.textContent = value;
valSpan.style.color = color;
}
}

// Mostrar checklist de compresión
function updateCompressionChecklist(compression) {
const checklist = document.querySelector(’.http-checklist’);
if (!checklist) return;

// Aquí puedes actualizar visualmente qué compresiones están habilitadas
const items = checklist.querySelectorAll(’.hcl-item’);
items.forEach(item => {
const icon = item.querySelector(’.hcl-icon’);
if (icon) {
if (item.textContent.includes(‘gzip’) && compression.gzipEnabled) {
icon.textContent = ‘✅’;
icon.style.color = ‘var(–green)’;
} else if (item.textContent.includes(‘Brotli’) && compression.brotliEnabled) {
icon.textContent = ‘✅’;
icon.style.color = ‘var(–green)’;
} else if (item.textContent.includes(‘Accept-Encoding’)) {
icon.textContent = ‘✅’;
icon.style.color = ‘var(–green)’;
}
}
});
}

// Mostrar recomendaciones
function displayRecommendations(recommendations) {
// Crear container si no existe
let recsContainer = document.getElementById(‘recommendationsContainer’);
if (!recsContainer) {
const httpWrap = document.querySelector(’.http-wrap’);
recsContainer = document.createElement(‘div’);
recsContainer.id = ‘recommendationsContainer’;
recsContainer.style.marginTop = ‘24px’;
httpWrap.appendChild(recsContainer);
}

recsContainer.innerHTML = ‘<div style="margin-bottom: 12px; padding: 0 24px;"><span class="section-eyebrow" style="display: block;">// Recommendations</span></div>’;

recommendations.forEach(rec => {
const bgColor = rec.severity === ‘critical’ ? ‘var(–red-bg)’ :
rec.severity === ‘warning’ ? ‘var(–orange-bg)’ :
rec.severity === ‘success’ ? ‘var(–green-bg)’ :
‘var(–accent-dim)’;


const borderColor = rec.severity === 'critical' ? 'var(--red-border)' :
                   rec.severity === 'warning' ? 'var(--orange-border)' :
                   rec.severity === 'success' ? 'var(--green-border)' :
                   'rgba(14,165,233,0.2)';

const textColor = rec.severity === 'critical' ? 'var(--red)' :
                 rec.severity === 'warning' ? 'var(--orange)' :
                 rec.severity === 'success' ? 'var(--green)' :
                 'var(--accent)';

const recEl = document.createElement('div');
recEl.style.cssText = `
  background: ${bgColor};
  border: 1px solid ${borderColor};
  border-radius: 6px;
  padding: 12px 14px;
  margin-bottom: 10px;
  font-size: 13px;
  line-height: 1.6;
  margin-left: 24px;
  margin-right: 24px;
`;
recEl.innerHTML = `
  <strong style="color: ${textColor}; display: block; margin-bottom: 3px;">${rec.message}</strong>
  <span style="color: var(--ink-muted);">${rec.action}</span>
`;
recsContainer.appendChild(recEl);


});
}

// Mostrar error
function showHTTPError(message, code) {
const httpWrap = document.querySelector(’.http-wrap’);

let errorContainer = document.getElementById(‘errorContainer’);
if (!errorContainer) {
errorContainer = document.createElement(‘div’);
errorContainer.id = ‘errorContainer’;
httpWrap.insertBefore(errorContainer, httpWrap.querySelector(’.url-row’).nextSibling);
}

errorContainer.innerHTML = `<div style="background: var(--red-bg); border: 1px solid var(--red-border); border-radius: 6px; padding: 14px 16px; margin-bottom: 20px; color: var(--red);"> <strong style="display: block; margin-bottom: 4px;">❌ Test Failed</strong> <span style="color: var(--ink-muted);">${message}</span> <span style="font-family: var(--mono); font-size: 10px; color: var(--ink-dim); display: block; margin-top: 6px;">[${code}]</span> </div>`;
}

// Limpiar resultados previos
function clearHTTPResults() {
const errorContainer = document.getElementById(‘errorContainer’);
if (errorContainer) errorContainer.innerHTML = ‘’;

const recsContainer = document.getElementById(‘recommendationsContainer’);
if (recsContainer) recsContainer.innerHTML = ‘’;

// Limpiar filas de análisis
document.querySelectorAll(’.hrc-row span:last-child’).forEach(span => {
span.className = ‘hrc-val-placeholder’;
span.textContent = ‘pending’;
span.style.color = ‘’;
});
}

// Conectar el botón en el HTML
// En tu index.html, busca: <button class="btn-test" disabled>Test Compression</button>
// Y reemplaza con:
// <button class="btn-test" onclick="testHTTPCompression()">Test Compression</button>
// Y quita el atributo disabled