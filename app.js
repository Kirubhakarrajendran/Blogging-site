//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const lodash = require("lodash");
const mongoose = require("mongoose");
const md5 = require("md5");
const multer = require('multer');
var fs = require('fs');
var path = require('path');
const { Console } = require("console");

const homeStartingContent ="Hi.! Welcome to my blog website. Here you can find interesting blog posts. Home page lists all the blog posts. Blog posts are limited to specific characters count in home page. Full content along with images (if present) can be viewed by clicking on the read more link at the end of all posts. Contact page contains my contact details which include gmail, mobile no., and LinkedIn profile. Finally there is Compose/Delete page which requires authentication to proceed further. Once authenticated, User can add a new blog post, update an existing blog post or delete an existing blog post.";
var login = "Please login to continue to compose page.";

const upload = multer({ dest: 'uploads/' });

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// mongoose.connect("mongodb://localhost:27017/Blog");
mongoose.connect("mongodb+srv://app-user:abc-123@cluster0.rgbdh.mongodb.net/?retryWrites=true&w=majority");
const userSchema = new mongoose.Schema({
  username: String,
  password: String
});
const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  img:
    {
        data: Buffer,
        contentType: String
    }
});
 const User = mongoose.model("User",userSchema);
 const Post = mongoose.model("Post",postSchema);



app.get("/",(req,res)=>{
  Post.find({},function (err,results) {  
    let Posts=[];  
    results.forEach(function(item){
        Posts.push(item);
    });
    res.render("home",{homeContent : homeStartingContent, posts : Posts});
    });
});


app.get("/contact",(req,res)=>{
  res.render("contact");
});

app.get("/compose",(req,res)=>{
  login = "Please login to continue to compose page.";
  res.render("login",{logincontent : login});
});


app.get("/posts/:postTitle",(req,res)=>{
  // posts.forEach(function(publish){
  //   var publishTitle =lodash.lowerCase(publish.title);
  //   var postTitle =lodash.lowerCase(req.params.postTitle);
  //   if(publishTitle===postTitle)
  //   {
  //     res.render("post",{title : publish.title ,publishContent : publish.content});
  //   }
  // });
  Post.findOne({title : req.params.postTitle},function (err,result) {
    if(!err){
      // let Posts=[];
      // Posts.push(result);
      res.render("post",{title : result.title ,publishContent : result.content, img : result.img});
      //console.log(result.img);
    }
  });
});

app.post("/compose", upload.single('image'), (req,res)=>{

  if(req.body.login==="loginpage"){
    const username = req.body.username;
    const password = md5(req.body.password);
    
    User.findOne({username : username},function (err,foundUser) {
        if(err)
        {
            console.log(err);
        }
        else if(foundUser){
          if (foundUser.password===password) {
             res.render("compose");
          }
        }
        else{
          login = "Incorrect username/password.. Please try again.";
          res.render("login",{logincontent : login});
        }
        
    });
  }

  else{
   // console.log(req.file);
   if(req.body.button==="Publish/Update"){

    Post.find({title : req.body.publishTitle},function(err,res){
      if(err)
      {
        console.log(err);
      }
      else if(res.length === 0){
        var data_val = null;
        if(req.file!=null){
          data_val=fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename));
        }
        var publish = new Post({ 
          title : req.body.publishTitle,
          content : req.body.publishContent,
          img: {
            data: data_val,
            contentType: 'image/png'
          }
        });
        publish.save((err, doc) => {
          if (err)
               console.log('Error during record insertion : ' + err);
          
        });
      }
      else{
        if(req.file!=null){
          var data_val=fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename));
          Post.findOneAndUpdate({title : req.body.publishTitle},{content:req.body.publishContent,img:{data:data_val,contentType: 'image/png'}}, function(err){
            if(err){
              console.log(err);
            }
            
          });
        }  
        else{
          Post.findOneAndUpdate({title : req.body.publishTitle},{content:req.body.publishContent}, function(err){
            if(err){
              console.log(err);
            }
            
          });
        }
      }
    });
   
   }
   else{
    Post.findOneAndDelete({title:req.body.publishTitle}, function(err,res){
        if(err)
        {
          console.log(err);
        }
        
    });
   }
   res.redirect("/");
  }
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
