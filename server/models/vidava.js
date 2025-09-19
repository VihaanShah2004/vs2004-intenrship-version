const mongoose = require('mongoose');
const vidavaSchema = new mongoose.Schema({
    _id: mongoose.Schema.ObjectId,
    card_name: {
        type: String,
        required: true
    }
},
    { collection: "cards_info", versionKey: false });

const Vidava = mongoose.model('Vidava', vidavaSchema); // Changed to 'Vidava'
module.exports = Vidava;
