const express = require('express');
const mongoose = require('mongoose');
const Router = express.Router();
const Vidava = require('../models/vidava');

Router.post('/addVidava', async (req, res) => {
    try {
        if (!req.body.card_name) {
            return res.status(400).json({ message: "card_name is required" });
        }

        const newVidava = new Vidava({
            _id: new mongoose.Types.ObjectId(),
            card_name: req.body.card_name
        });

        const result = await newVidava.save();
        res.status(201).json(result);
        console.log(result);

    } catch (error) {
        res.status(500).json({ message: error.message || "Internal Server Error" });
    }
});

module.exports = Router;
