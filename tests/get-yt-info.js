const https = require('https');
const fs = require('fs');

https.get('https://www.youtube.com/watch?v=P5rkkl18nb0', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9'
  }
}, (res) => {
  let html = '';
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    fs.writeFileSync('tests/yt-page.html', html);
    const shortDescMatch = html.match(/"shortDescription":"(.*?)"/s);
    if (shortDescMatch) {
      console.log('--- Short Description ---');
      console.log(JSON.parse('"' + shortDescMatch[1] + '"'));
    }
    
    // Look for initial data with videoDetails
    const detailsMatch = html.match(/"videoDetails":\{"videoId":"P5rkkl18nb0".*?"title":"(.*?)"/);
    if (detailsMatch) {
      console.log('--- Title ---', detailsMatch[1]);
    }
  });
}).on('error', err => console.error(err));

