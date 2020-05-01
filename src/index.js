// Importing Necessary Dependencies
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const User = require('./auth/auth')



const db_url = 'mongodb://127.0.0.1:27017/anonymous'

mongoose.connect(db_url, 
    { 
        useNewUrlParser: true, 
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false
    }
)


const port = process.env.PORT || 8000

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.json())
app.use(require('express-session')({
    secret: 'Anonymous',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize())
app.use(passport.session()) 
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

app.use(async (req, res, next) => {
    res.locals.currentAdmin = req.user;
    // res.locals.error = req.flash('error')
    // res.locals.success = req.flash('success')
    next();
})

const anonSchema = mongoose.Schema({
    anonymous_message: String,
    date: {
        type: Date,
        default: Date.now
    }
})

const Anonymous_Message = mongoose.model('Anonymous_Message', anonSchema)

// User Authentication Routes
app.get("/signup", async (req, res) => {
    res.render('register')
})

app.post("/signup", async (req, res) => {
    const newUser = new User({username: req.body.username})
    User.register(newUser, req.body.password, (err, User) => {
        if(err){
            console.log(err);
            return res.render('register')
        }
        passport.authenticate('local')(req, res, () => {
            res.send('Successful')
            console.log(User)
        })
    })
})


app.get('/login', async (req, res) => {
    // res.render('login')
    res.send('login route reached')
})

app.get('/auth-success', async (req, res) => {
    // req.flash('success', 'Successfully logged in as: ' + req.user.username)
    res.status(200).send('Successfully logged in')
})

app.get('/auth-failure', async (req, res) => {
    // req.flash('error', 'Incorrect Details')
    res.status(400).send('Login Failed')
})

app.post('/login', passport.authenticate('local', 
    {
        successRedirect: '/auth-success', 
        failureRedirect: '/auth-failure'
    }), async (req, res) => {
        // res.send('Successfully Logged In')
})

// logout route

app.get('/logout', async (req, res) => {
    req.logout();
    // req.flash('success', 'Successfully logged out!')
    // res.redirect('/login')
    res.send('Successfully Logged Out')
})

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    // req.flash('error', 'Oops, Please Login!')
    res.send('Please Login')
}


app.post('/:id', async (req, res) => {
    await User.findById(req.params.id, async (err, foundUser) => {
        if(err){
            console.log(err)
            res.status(404).send('An Error Occurred')
        } else {
            Anonymous_Message.create({anonymous_message:req.body.anonymous_message}, (err, anon) => {
                if(err){
                    console.log(err)
                    res.status(400)
                } else {
                    foundUser.anonymousMessage.push(anon)
                    foundUser.save()
                    res.status(201).send(foundUser)
                }
            })
        }
        
    })
})

app.get('/:id', isLoggedIn, async(req, res) => {
    if(req.user._id != req.params.id){
        console.log('Not your profile')
        res.send('Not your profile')
    } else {
        await User.findById(req.params.id).populate('anonymousMessage').exec((err, foundUser) => {
            if(err){
                console.log(err)
            } else {
                res.send(foundUser.anonymousMessage)
            }
        })        
    }
})


// Server Starter
app.listen(port, (err) => {
    if(err){
        console.log('An Error Occurred: ', err)
    } 
    return console.log('Server Started....')
})