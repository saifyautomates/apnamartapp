const http = require('http');

http.get('http://localhost:3000', (res) => {
  let html = '';
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    const iconLinks = html.match(/<link[^>]*icon[^>]*>/gi) || [];
    console.log('Icon links found in HTML:');
    iconLinks.forEach(l => console.log('  ', l));
    const metaTheme = html.match(/<meta[^>]*theme-color[^>]*>/gi) || [];
    console.log('Theme color meta:');
    metaTheme.forEach(m => console.log('  ', m));
  });
});

