// Wait for the DOM to fully load
document.addEventListener("DOMContentLoaded", function() {
    // Get references to the input fields and register button
    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');
    const registerButton = document.querySelector('.register-btn');
    const messageElement = document.getElementById('message'); // Reference to the message element

    // Add event listener for the register button
    registerButton.addEventListener('click', async function() {
        // Get the values from the input fields
        const email = emailInput.value;
        const password = passwordInput.value;

        // Prepare the data to send
        const data = {
            email: email,
            password: password
        };

        try {
            // Send POST request to the API
            const response = await fetch('http://localhost:3000/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            // Check if the response is okay
            if (response.ok) {
                const result = await response.json();
                messageElement.textContent = 'Registration successful!'; // Show success message
                messageElement.style.color = 'green'; // Set message color to green
                console.log(result); // Log the response or perform further actions

                // Add a 2-second delay before redirecting to popup1.html
                setTimeout(() => {
                    window.location.href = 'popup1.html';
                }, 2000); // 2000 ms = 2 seconds
            } else {
                const error = await response.json();
                messageElement.textContent = 'Registration failed: ' + error.message; // Show error message
                messageElement.style.color = 'red'; // Set message color to red
            }
        } catch (err) {
            console.error('Error:', err);
            messageElement.textContent = 'An error occurred. Please try again.'; // Show network error message
            messageElement.style.color = 'red'; // Set message color to red
        }
    });

    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        // Toggle the icon
        // this.classList.toggle('fa-eye');
        togglePassword.classList.toggle('fa-eye-slash');
    });
});
