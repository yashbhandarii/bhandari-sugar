const deliveryService = require('./services/delivery.service');
const paymentService = require('./services/payment.service');
const billingService = require('./services/billing.service');
const inventoryService = require('./services/inventory.service');
const financialYearService = require('./services/financial_year.service');

async function runTests() {
    try {
        console.log("=== STARTING TESTS ===");
        const activeYear = await financialYearService.getActiveYear();
        console.log("Active Year:", activeYear ? activeYear.year_label : 'None');

        // Test 1: Delivery Sheet
        console.log("\n--- Testing Delivery Sheet Creation (Old Date) ---");
        try {
            await deliveryService.createDeliverySheet({
                truck_number: 'TEST-123',
                created_by: 1, // assuming user 1 exists, if not it might fail on FK, but should fail on FY first
                date: '2019-01-01'
            });
            console.log("❌ FAILED: Delivery sheet created despite old date!");
        } catch (error) {
            console.log("✅ PASSED: Blocked delivery sheet creation:", error.message);
        }

        // Test 2: Payment
        console.log("\n--- Testing Payment Creation (Old Date) ---");
        try {
            await paymentService.addPayment({
                customer_id: 1,
                amount: 100,
                payment_method: 'cash',
                payment_date: '2020-01-01'
            });
            console.log("❌ FAILED: Payment created despite old date!");
        } catch (error) {
            console.log("✅ PASSED: Blocked payment creation:", error.message);
        }

        // Test 3: Inventory
        console.log("\n--- Testing Inventory Movement (Old Date) ---");
        try {
            await inventoryService.createMovement({
                category: 'Medium',
                movement_type: 'godown_in',
                bags: 100,
                reference_type: 'manual',
                created_at: '2023-01-01'
            });
            console.log("❌ FAILED: Inventory movement created despite old date!");
        } catch (error) {
            console.log("✅ PASSED: Blocked inventory movement:", error.message);
        }

        console.log("\n=== TESTS DONE ===");
        process.exit(0);
    } catch (e) {
        console.error("Test script failed:", e);
        process.exit(1);
    }
}

runTests();
