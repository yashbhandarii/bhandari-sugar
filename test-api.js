// Quick test script to verify inventory-purchases API
const testUrl = 'http://localhost:3000/api/inventory-purchases';

console.log('Testing inventory-purchases API...');
console.log('GET', testUrl);

fetch(testUrl)
    .then(res => {
        console.log('Status:', res.status);
        return res.json();
    })
    .then(data => {
        console.log('Success! Data:', data);
    })
    .catch(err => {
        console.error('Error:', err.message);
    });
