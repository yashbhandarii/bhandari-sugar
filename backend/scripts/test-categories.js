
async function testCategories() {
    const API_URL = 'http://localhost:5000/api/categories';

    try {
        console.log('--- Testing Category APIs ---');

        // 1. GET Categories
        console.log('\n1. GET /api/categories');
        let res = await fetch(API_URL);
        let data = await res.json();
        console.log('Response:', data);
        const initialCount = data.length;

        // 2. POST Category
        console.log('\n2. POST /api/categories');
        const newCategory = { name: 'Test Category', default_weight: 50.0 };
        res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCategory)
        });
        // Check if response is ok
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`POST failed: ${err}`);
        }
        data = await res.json();
        console.log('Created:', data);
        const newId = data.id;

        // 3. GET Categories again
        console.log('\n3. GET /api/categories (Verify creation)');
        res = await fetch(API_URL);
        data = await res.json();
        console.log('Count:', data.length);
        if (data.length !== initialCount + 1) console.error('FAILED: Count mismatch');
        else console.log('PASSED: Category added');

        // 4. DELETE Category
        console.log(`\n4. DELETE /api/categories/${newId}`);
        await fetch(`${API_URL}/${newId}`, { method: 'DELETE' });
        console.log('Deleted successfully');

        // 5. GET Categories final check
        console.log('\n5. GET /api/categories (Verify deletion)');
        res = await fetch(API_URL);
        data = await res.json();
        console.log('Count:', data.length);
        if (data.length !== initialCount) console.error('FAILED: Count mismatch after delete');
        else console.log('PASSED: Category deleted');

    } catch (err) {
        console.error('Test Failed:', err);
    }
}

testCategories();
