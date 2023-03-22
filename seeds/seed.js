const mongoose = require('mongoose');
const Tweet = require('../models/tweet');
const User = require('../models/user');

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/Clone');
    console.log("Database Seeded !");
}

main().catch(e => console.log(e));

const tweets = [
    'this is the first tweet',
    'this is the second tweet',
    'this is a random tweet',
    'this is another random tweet',
    'this will be the last tweet'
];

const users = [
    'Sarthak',
    'Darsh',
    'Upamanyu',
    'Ansh',
    'Arnav'
];

const sample = array => array[Math.floor(Math.random() * array.length)];

const seedTweets = async() => {
    await Tweet.deleteMany({});
    for(let i = 0; i < 5; i++){
        const tweet = new Tweet({
            tweet: `${tweets[i]}`,
            author: `${users[i]}`
        })
        tweet.save();
    }
}

seedTweets().catch(e => console.log(e));