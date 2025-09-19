document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const email = urlParams.get('email');

    // Log token and email to verify they are correctly retrieved
    console.log("Token:", token);
    console.log("Email:", email);

    if (!token || !email) {
        alert("Invalid or missing token and/or email.");
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/auth/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, token, newPassword })
        });

        const result = await response.json();
        if (response.ok) {
            alert("Password reset successful!");
        } else {
            alert(result.message || "Error resetting password");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
    }
});
