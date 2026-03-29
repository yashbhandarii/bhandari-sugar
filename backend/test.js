const axios = require('axios');
const fs = require('fs');

async function run() {
    try {
        const res = await axios.get('http://localhost:5000/api/reports/download?type=day&date=2026-03-24', {
            responseType: 'arraybuffer'
            // no auth header, so wait, downloads require auth!
        });
        fs.writeFileSync('test.pdf', res.data);
        console.log('Downloaded', res.data.length, 'bytes');
    } catch (e) {
        console.error(e.message);
    }
}
run();
