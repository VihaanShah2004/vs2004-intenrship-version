document.addEventListener("DOMContentLoaded", () => {
    const button = document.querySelector(".login-btn");
    const messageDiv = document.getElementById("message");

    button.addEventListener("click", async () => {
        const email = document.getElementById("email").value;

        if (!email) {
            messageDiv.textContent = "Please enter your email address.";
            messageDiv.style.color = "red";
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                const data = await response.json();
                messageDiv.textContent = data.message || "Check your email for the reset password link!";
                messageDiv.style.color = "green";
            } else {
                const errorData = await response.json();
                messageDiv.textContent = errorData.message || "An error occurred. Please try again.";
                messageDiv.style.color = "red";
            }
        } catch (error) {
            messageDiv.textContent = "Network error. Please try again later.";
            messageDiv.style.color = "red";
        }
    });
});
