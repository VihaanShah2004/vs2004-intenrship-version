// script.js

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM fully loaded and parsed"); // Log to check if the DOM is fully loaded

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.querySelector('.login-btn');

    if (loginButton) {
        loginButton.addEventListener('click', async function() {
            const email = emailInput.value;
            const password = passwordInput.value;

            const data = {
                email: email,
                password: password
            };

            try {
                const response = await fetch('http://localhost:3000/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log("Login Result:", result); 
                    document.getElementById('message').textContent = "Login successful! Welcome to VIDAVA AI.";
                    document.getElementById('message').style.color = "green"; 

                    // Add a 2-second delay before redirecting to popup1.html
                    setTimeout(() => {
                        window.location.href = 'popup1.html';
                    }, 2000); // 2000 ms = 2 seconds
                } else {
                    const error = await response.json();
                    alert('Login failed: ' + error.message); // Show error alert if login fails
                    document.getElementById('message').textContent = error.message || "Login failed. Please try again.";
                    document.getElementById('message').style.color = "red"; // Display error message on page
                }
            } catch (err) {
                console.error('Error:', err); // Log any errors encountered
                document.getElementById('message').textContent = "An error occurred. Please try again later.";
                document.getElementById('message').style.color = "red";
            }
        });
    } else {
        console.error("Login button not found.");
    }


    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        // Toggle the icon
        // this.classList.toggle('fa-eye');
        togglePassword.classList.toggle('fa-eye-slash');
    });
});
