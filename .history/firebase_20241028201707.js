// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCTZA8mjUR7iwAbHX4B3uCm4EL_UlNTY1Y",  
    authDomain: "vidava-ai.firebaseapp.com",
    projectId: "vidava-ai",
    storageBucket: "vidava-ai.appspot.com",
    messagingSenderId: "821970446529",
    appId: "1:821970446529:web:d66ef5cd19e340e7020c40",
    measurementId: "G-3BR679FW1P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("Firebase app initialized: ", app);

const db = getFirestore(app);

// Function to save card name to Firestore
const saveCardName = async (cardName) => {
    try {
        const docRef = await addDoc(collection(db, "card_info"), {
            name: cardName
        });
        console.log("Document written with ID: ", docRef.id);
        alert("Data submitted!");
    } catch (e) {
        console.error("Error adding document: ", e);
    }
};


// Event listener for the submit button
document.getElementById("submitButton").addEventListener("click", () => {
    const cardName = document.getElementById("cardNameInput").value;
    if (cardName) {
        saveCardName(cardName);
        // Optionally clear the input field
        document.getElementById("cardNameInput").value = '';
    } else {
        alert("Please enter a card name.");
    }
});

var credential = firebase.auth.GoogleAuthProvider.credential(null, token);
firebase.auth().signInWithCredential(credential);