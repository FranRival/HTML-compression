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