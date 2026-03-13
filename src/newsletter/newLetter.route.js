const express = require('express');
const router = express.Router(); // এখানে .Router() যোগ করতে হবে
const { subscribeNewsletter } = require('./newLetter.controller');

// আপনার রাউট: /api/newsletter/newletter (অথবা আপনার মেইন ফাইল অনুযায়ী)
router.post('/news-letter', subscribeNewsletter);

module.exports = router;