// Importing Necessary Dependencies
const express = require('express')
const app = express()
const ejs = require('ejs')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const mongoose = require('mongoose')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const User = require('./auth/auth')
const flash = require('connect-flash')



// const db_url = 'mongodb://127.0.0.1:27017/anonymous'
const db_url = 'mongodb+srv://Olusola:olusola10000@cluster0-lo248.mongodb.net/anonymous?retryWrites=true&w=majority'

mongoose.connect(db_url, 
    { 
        useNewUrlParser: true, 
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false
    }
)


const port = process.env.PORT || 8000

app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')

app.use(express.json())
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(flash())
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
    res.locals.currentUser = req.user;
    res.locals.error = req.flash('error')
    res.locals.success = req.flash('success')
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
    res.render('signup')
})

// post route for signing up
app.post("/signup", async (req, res) => {
    const newUser = new User({username: req.body.username})
    User.register(newUser, req.body.password, (err, User) => {
        if(err){
            console.log(err);
            req.flash('error', 'An error occurred: ' + err.message)            
            return res.redirect('/signup')
        }
        passport.authenticate('local')(req, res, () => {
            req.flash('success', `Hello ${User.username}!`)                                    
            res.redirect('/profile')
            console.log(User)
        })
    })
})

app.get('/profile', isLoggedIn, async (req,res) => {
    const foundUser = req.user
    res.render('profile', {user: foundUser, host: req.headers.host})
})

// view-messages route
app.get('/messages', isLoggedIn, async(req, res) => {
    await User.findById(req.user._id).populate('anonymousMessage').exec((err, foundUser) => {
        if(err){
            console.log(err)
            req.flash('error', 'An error occurred: ' + err.message)            
            res.redirect('/profile')
        } else {
            res.render('messages', {user: foundUser})
        }
    })        
})


app.get('/login', async (req, res) => {
    // res.render('login')
    res.render('login')
})

app.get('/auth-success', async (req, res) => {
    req.flash('success', 'Successfully logged in as: ' + req.user.username)
    res.redirect('/profile')
})

app.get('/auth-failure', async (req, res) => {
    req.flash('error', 'Incorrect Details, try again')
    res.redirect('/login')
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
    req.flash('success', 'Successfully logged out!')
    res.redirect('/')
})

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash('error', 'Oops, Please Login!')
    res.redirect('/login')
}

// landing page
app.get('/', async (req, res) => {
    res.render('index')
})


app.post('/:id', async (req, res) => {
    const id = req.params.id
    var valid = await mongoose.Types.ObjectId.isValid(id)
    console.log(valid) 
    if(!valid){
        req.flash('error', 'An error occurred')
        return res.redirect('/')
    }   
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
                    res.redirect('/success')
                }
            })
        }    
    })
})

app.get('/success', async (req, res) => {
    res.render('post-post')
})

app.get('/:username', async (req, res) => {
    if(!req.params.username){
        console.log(req.params.username)
        req.flash('error', 'An error occurred')
        return res.redirect('/')
    }
    const toUser = {
        username: req.params.username
    }
    console.log(toUser)
    await User.findOne(toUser, (err, user) => {
        if(err){
            console.log(err)
            req.flash('error', 'Error')
            res.redirect('/')
        } else {
            res.render('post', {user: user})
        }
    })
})

app.get('*', async (req, res) => {
    res.render('404')
})



// Server Starter
app.listen(port, (err) => {
    if(err){
        console.log('An Error Occurred: ', err)
    } 
    return console.log('Server Started....')
})
