//allow people to comment on tweets

const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const Tweet = require('./models/tweet');
const methodOverride = require('method-override');
const session = require('express-session');
const passport = require('passport');
const localStrategy = require('passport-local');
const User = require('./models/user');
const {isLoggedIn} = require('./middleware');
const Comment = require('./models/comment');

//connect to mongo database
async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/Clone');
    console.log('connected to Database');
}

//catch any errors while connecting and display them 
main().catch(e => console.log(e));

//to use ejs templating
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
//to set path for the directory in which webpages are stored
app.set('views', path.join(__dirname, 'views'));


app.use(express.urlencoded({extended: true}));
app.use(express.json());
//to use public directory for linking stylesheet and scripts
app.use(express.static(path.join(__dirname, 'public')));
//to use method override 
app.use(methodOverride('_method'));

//session definition 
const config = {
    secret: 'CloneTwitter',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

//using the config variable defined for express sessions
app.use(session(config));

//using passportjs to integrate login 
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
})

app.get('/login', (req, res) => {
    res.render('pages/login');
})

app.get('/register', (req, res) => {
    res.render('pages/register');
})

app.post('/register', async (req, res) => {
    const {username, email, password} = req.body;
    const user = new User({username, email});
    const registeredUser = await User.register(user, password);
    req.login(registeredUser, err => {
        if (err) console.log(err);
        res.redirect('/profile');
    })
})

app.post('/login', passport.authenticate('local', {failureMessage: true, failureRedirect: '/login'}), (req, res) => {
    console.log('Succesfully logged in');
    res.redirect('/homepage');
});

app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/homepage');
    })
})

app.get('/profile', isLoggedIn, async (req, res) => {
    const user = await User.findById(req.user.id).populate('tweets');
    res.render('pages/profile', {user});
})

app.get('/homepage', async (req, res) => {
    const tweets = await Tweet.find({}).populate('author').populate('comments');
    res.render('pages/explore', {tweets});
})

app.post('/homepage', async (req, res) => {
    const tweet = new Tweet(req.body);
    tweet.author = req.user;
    await tweet.save();
    const user = await User.findById(req.user.id);
    user.tweets.push(tweet);
    await user.save();
    res.redirect('/profile');
})

app.post('/homepage/:id', isLoggedIn, async (req, res) => {
    const {id} = req.params;
    const comment = new Comment(req.body);
    const tweet = await Tweet.findById(id);
    comment.tweet = tweet;
    comment.author = req.user;
    tweet.comments.push(comment);
    req.user.comments.push(comment);
    comment.save();
    tweet.save();
    req.user.save();
    res.redirect('/homepage');
})
 
app.delete('/homepage/:id/:commentID', async (req, res) => {
    const {id, commentID} = req.params;
    await Comment.findByIdAndDelete(commentID);
    const tweet = await Tweet.findByIdAndUpdate(id, {$pull: {comments: commentID}}).populate('author');
    await User.findByIdAndUpdate(tweet.author.id, {$pull: {comments: commentID}});
    res.redirect('/homepage');
})

app.delete('/homepage/:id', async (req, res) => {
    const {id} = req.params;
    const tweet = await Tweet.findById(id).populate('author');
    await User.findByIdAndUpdate(tweet.author.id, {$pull: {tweets: id}})
    await tweet.deleteOne();
    res.redirect('/profile');
})

app.listen(8000, (req, res) => {
    console.log('listening to port');
})