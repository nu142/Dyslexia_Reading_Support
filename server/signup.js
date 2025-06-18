document.getElementById('signup-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const fullname = document.getElementById('fullname');
  const username = document.getElementById('username');
  const email = document.getElementById('email');
  const dob = document.getElementById('dob');
  const password = document.getElementById('password');

  const errors = [];
  if (fullname.value.trim().length < 2) errors.push('Full name must be at least 2 characters.');
  if (!/^[a-zA-Z0-9_]{4,20}$/.test(username.value.trim())) errors.push('Invalid username.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) errors.push('Invalid email address.');
  if (new Date(dob.value) > new Date()) errors.push('Date of birth cannot be in the future.');
  if (password.value.length < 8) errors.push('Password must be at least 8 characters.');

  if (errors.length) {
    alert(errors.join('\n'));
    return;
  }

  try {
    const response = await fetch('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullname: fullname.value.trim(),
        username: username.value.trim(),
        email: email.value.trim(),
        dob: dob.value.trim(),
        password: password.value,
      }),
    });

    const result = await response.json();
    if (response.ok) {
      alert('Signup successful!');
      window.location.href = 'login.html';
    } else {
      alert(result.message || 'Signup failed.');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred. Please try again.');
  }
});
