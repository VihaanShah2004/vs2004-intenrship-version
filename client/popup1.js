document.getElementById('submitButton').addEventListener('click', async () => {
    const cardName = document.getElementById('cardNameInput').value;
    const responseMessage = document.getElementById('responseMessage');

    if (!cardName) {
        responseMessage.textContent = "Please enter a card name.";
        responseMessage.style.color = "red";
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/addVidava', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ card_name: cardName })
        });

        const result = await response.json();

        if (response.ok) {
            responseMessage.textContent = "Card added successfully!";
            responseMessage.style.color = "green";
            setTimeout(() => {
                window.location.href = 'bankname.html';
            }, 2000);
        } else {
            responseMessage.textContent = "Error: " + result.message;
            responseMessage.style.color = "red";
        }
    } catch (error) {
        responseMessage.textContent = "An error occurred. Please try again.";
        responseMessage.style.color = "red";
        console.error(error);
    }
});
