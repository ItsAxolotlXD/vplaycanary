import FormData from 'form-data';
import fs from 'fs';
import https from 'https';

const form = new FormData();
form.append('reqtype', 'fileupload');
form.append('fileToUpload', fs.createReadStream('src/assets/maintenance.mp4'));

const options = {
  hostname: 'catbox.moe',
  port: 443,
  path: '/user/api.php',
  method: 'POST',
  headers: form.getHeaders()
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('Upload Result:', data));
});

req.on('error', (e) => console.error(e));
form.pipe(req);
