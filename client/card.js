document.getElementById("submitButton").addEventListener("click", function() {
    // Get the response message element
    const responseMessage = document.getElementById("responseMessage");
    
    // Set the success message
    responseMessage.textContent = "Card Type added";
    responseMessage.style.color = "green";

    // Wait for 1 second and then redirect to cardtype.html
    setTimeout(() => {
        window.location.href = "goat.html";
    }, 2000); // 1 second delay
});
