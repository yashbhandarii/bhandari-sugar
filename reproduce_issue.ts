
// Remove import, use native fetch
// import fetch from 'node-fetch';

async function testCreatePurchase() {
    try {
        console.log('Sending request to http://localhost:3000/api/inventory-purchases');
        const response = await fetch('http://localhost:3000/api/inventory-purchases', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                date: new Date().toISOString().split('T')[0],
                categoryId: 1,
                godownId: 1,
                quantity: 10,
                ratePerQuintal: 3500,
                notes: 'Test purchase reproduction',
            }),
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Response:', text);
    } catch (error) {
        console.error('Error:', error);
    }
}

testCreatePurchase();
