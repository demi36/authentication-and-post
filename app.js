const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
require('dotenv').config()
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose');

const port = process.env.PORT||8080
const secret = process.env.SECRET
const app = express()

app.use(express.static("public"))
app.set('view engine','ejs')
app.use(bodyParser.urlencoded({
    extended:true
}))

app.use(session({
    secret:"secreteon jumbelone",
    resave:false,
    saveUninitialized:false
}))

app.use(passport.initialize())
app.use(passport.session())

var url =process.env.MONGO_URI
mongoose.connect(url)

const userSchema = new mongoose.Schema({ //this is bject create from mongoose schema
    email:String,
    password:String,
    secret:String,
})

userSchema.plugin(passportLocalMongoose)
const User = new mongoose.model("User",userSchema)

passport.use(User.createStrategy());
// Alternatively: passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/',(req,res)=>{
    res.render("home")
})
app.get('/login',(req,res)=>{
    res.render("login")
})
app.get("/register",(req,res)=>{
    res.render("register") 
})

app.get('/secrets',(req,res)=>{
    // intially we didnt' have any secrete route thsts why we wrote this
    

        User.find({"secret":{$ne:null}},(err,foundUsers)=>{//look throug secret feild and wich are not null

            if(err){
                console.log(err)
            }else{
                if(foundUsers){
                    res.render('secrets',{usersWithSecrets:foundUsers})
                }
            }
        })
  
})
// logout section
app.get('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });
//   submist section
app.get('/submit',(req,res)=>{
    if(req.isAuthenticated()){
        res.render("submit")
    }else{
        res.redirect("/login")
    }
})
// post routing for submit section
app.post('/submit',(req,res)=>{
    const submiteedSecret = req.body.secret//this secreate came from input name
    const newSubmitted= {$set:{submiteedSecret:secret}}
    //save to belonged user
  User.findById(req.user.id,(err,foundUser)=>{
    if(err){
        console.log(err)
    }else{
        if(foundUser){
            foundUser.secret =submiteedSecret
            foundUser.save(()=>{
                res.redirect("/secrets")
            })
        }
    }
  })
})


// register section

app.post("/register",(req,res)=>{
    User.register({username:req.body.username},req.body.password,(err,user)=>{
        if(err){
            console.log(err)
            res.redirect("/register")
        }else{
            passport.authenticate('local')(req,res,function(){
                res.redirect("/secrets")
            })
        }
    })
})

// login route
app.post("/login",(req,res)=>{
   const user = new User ({
    username:req.body.username,
    password:req.body.password
   })
//  below came from passprt js
 req.login(user,(err)=>{
    if(err){
        console.log(err)
    }else{
        passport.authenticate("local")(req,res,function(){
            res.redirect("/secrets")
        })
    }
 })
})

app.listen(port,()=>{
    console.log(`your app runnig in ${port}`)
})