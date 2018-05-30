
var express = require('express');
var router=express.Router();
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
var util = require('util')
var cors = require('cors');
app.use(cors());
var DButilsAzure = require('./DButils');
var jwt = require('jsonwebtoken');
const superSecret = new Buffer("SecretKey","Base64"); 
var Users=require('./Users');
var Poi=require('./Poi');
var RegisteredUsers=require('./RegisteredUsers');


//middleware that checks that the user has a valid token
app.use('/RegisteredUsers', function(req,res,next){               

    var token=req.body.token || req.query.token || req.headers['token'];
   
    if (token) {
       jwt.verify(token, superSecret, function (err, decoded) {
       if (err) {
       return res.json({ success: false, message: 'Invalid token!' });
       } else {
       var decoded = jwt.decode(token, {complete: true});
       req.decoded= decoded; // decoded.payload , decoded.header
       next();
       }
   });
    }  
    else{
       res.send("Invalid token");
       res.end();
    }
   });





app.use('/Users', Users);
app.use('/Poi', Poi);
app.use('/RegisteredUsers', RegisteredUsers);


var port = 4000;
app.listen(port, function () {
    console.log('Connecting to server'+port);
});
//-------------------------------------------------------------------------------------------------------------------


