const fs = require('fs');
let code = fs.readFileSync('c:/Bhandari Sugar/backend/controllers/report.controller.js', 'utf8');

const target = `            // Flatten aging data for PDF
            const items = [];
            Object.keys(agingData.by_bucket).forEach(bucket => {
                items.push({
                    bucket: bucket,
                    total: agingData.by_bucket[bucket].total,
                    count: agingData.by_bucket[bucket].count,
                    items: agingData.by_bucket[bucket].data
                });
            });
            data = items;`;

const replacement = `            // Flatten aging data into a single array for PDF
            let flatItems = [];
            Object.keys(agingData.by_bucket).forEach(bucket => {
                flatItems = flatItems.concat(agingData.by_bucket[bucket].data);
            });
            data = flatItems;`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('c:/Bhandari Sugar/backend/controllers/report.controller.js', code);
    console.log("Replaced successfully via exact string match.");
} else {
    // Try Regex
    const regex = /\/\/\s*Flatten aging data for PDF[\s\S]*?data = items;/;
    if (regex.test(code)) {
        code = code.replace(regex, replacement);
        fs.writeFileSync('c:/Bhandari Sugar/backend/controllers/report.controller.js', code);
        console.log("Replaced successfully via RegExp.");
    } else {
        console.log("Target not found!");
    }
}
