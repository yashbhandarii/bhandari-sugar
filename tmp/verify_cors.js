const testRegex = /^https:\/\/.*\.vercel\.app$/;

console.log('Testing Regex: /^https:\\/\\/.*\\.vercel\.app$/');
const originsToTest = [
    'https://bhandari-sugar.vercel.app',
    'https://bhandari-sugar.vercel.app/',
    'https://preview-123.vercel.app',
    'http://localhost:3000',
    'https://google.com'
];

originsToTest.forEach(o => {
    const isMatched = testRegex.test(o);
    const explicitlyAllowed = o === 'https://bhandari-sugar.vercel.app';
    console.log(`Origin: ${o.padEnd(40)} | Regex Match: ${isMatched.toString().padEnd(10)} | Explicitly Allowed: ${explicitlyAllowed}`);
});

// Mocking the origin callback logic from server.js
const checkOrigin = (origin) => {
    if (!origin) return true;
    const isAllowed =
        origin === 'http://localhost:3000' ||
        /^http:\/\/192\.168\.\d+\.\d+:3000$/.test(origin) ||
        /^https:\/\/.*\.vercel\.app$/.test(origin) ||
        origin === 'https://bhandari-sugar.vercel.app' ||
        (false && origin === 'some_env_url'); // MOCKED env var

    return isAllowed;
};

console.log('\nTesting checkOrigin function logic:');
originsToTest.forEach(o => {
    console.log(`Origin: ${o.padEnd(40)} | Allowed: ${checkOrigin(o)}`);
});
