document.getElementById("submitButton").addEventListener("click", function() {
    // Get the input field and response message element
    const cardNameInput = document.getElementById("cardNameInput").value.trim().toLowerCase();
    const responseMessage = document.getElementById("responseMessage");

    if (cardNameInput === "no" || cardNameInput === "no more" || cardNameInput === "no more cards") {
        responseMessage.textContent = "Thank you so much!!";
        responseMessage.style.color = "green";
        setTimeout (() => {
            window.location.href = "end.html";
        }  , 2000)
    } else {
        // Display success message for other inputs
        responseMessage.textContent = "Bank name added";
        responseMessage.style.color = "green";

        // Optional: Clear the input field
        document.getElementById("cardNameInput").value = "";

        // Wait for 2 seconds before clearing the message
        setTimeout(() => {
            responseMessage.textContent = "";
        }, 2000); // 2 seconds delay
    }
});
