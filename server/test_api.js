async function test() {
    try {
        // 1. Login
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin',
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();

        if (!loginRes.ok) {
            throw new Error('Login failed: ' + JSON.stringify(loginData));
        }

        const token = loginData.token;
        console.log('Login successful, token obtained.');

        // 2. Get Staff
        const staffRes = await fetch('http://localhost:3000/api/admin/staff', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const text = await staffRes.text();
        try {
            const staffData = JSON.parse(text);
            console.log('Staff API Response:', JSON.stringify(staffData, null, 2));
        } catch (e) {
            console.log('Staff API Response (Text):', text);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

test();
