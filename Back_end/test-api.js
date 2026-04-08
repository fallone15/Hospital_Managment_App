async function testApi() {
  try {
    // 1. Login as patient
    const loginRes = await fetch('http://localhost:5000/api/auth/login/patient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'm.martin@email.fr',
        code_pin: '1234'
      })
    });
    const loginData = await loginRes.json();
    console.log('Login Response:', loginData);
    
    if (loginData.success) {
      const token = loginData.token;
      
      // 2. Fetch specialties
      const specRes = await fetch('http://localhost:5000/api/rdv/specialites', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const specData = await specRes.json();
      console.log('Specialties Response:', specData);
      
      // 3. Fetch doctors
      const docRes = await fetch('http://localhost:5000/api/rdv/medecins', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const docData = await docRes.json();
      console.log('Doctors Response:', docData);
    }
  } catch (error) {
    console.error('Error message:', error.message);
  }
}

testApi();
