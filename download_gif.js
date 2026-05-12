const https = require('https');
const fs = require('fs');

https.get('https://tenor.com/view/pikachu-running-pokemon-pika-gif-15385062', (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    const match = data.match(/<meta property="og:image" content="(https:\/\/[^"]+\.gif)"/);
    if(match) {
      https.get(match[1], (gifRes) => {
        const file = fs.createWriteStream('./public/loading.gif');
        gifRes.pipe(file);
        file.on('finish', () => {
          console.log('GIF Pikachu berhasil didownload!');
          fs.unlinkSync('./download_gif.js'); // Bersihkan script setelah selesai
        });
      });
    } else {
      console.log('Gagal menemukan link GIF');
    }
  });
}).on('error', console.error);
