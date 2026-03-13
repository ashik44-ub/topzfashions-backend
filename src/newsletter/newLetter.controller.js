// controllers/newsletter.controller.js
const Newsletter = require('../newsletter/newLetter.model');

const subscribeNewsletter = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required!" });
        }

        // চেক করুন ইমেইল আগে থেকেই আছে কি না
        const existing = await Newsletter.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: "You are already subscribed!" });
        }

        const newSubscriber = new Newsletter({ email });
        await newSubscriber.save();

        res.status(201).json({ message: "Subscribed Successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Server error, try again later." });
    }
};

module.exports = { subscribeNewsletter };