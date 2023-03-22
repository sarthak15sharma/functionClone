const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    content: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    tweet: {
        type: Schema.Types.ObjectId,
        ref: 'Tweet'
    }
});

module.exports = mongoose.model('Comment', commentSchema);