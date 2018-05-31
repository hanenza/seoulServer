var express=require('express');
var router=express.Router();
var DButilsAzure = require('./DButils');
var jwt = require('jsonwebtoken');
const superSecret = new Buffer("SecretKey","Base64"); 
var xml2js = require('xml2js');

//password retrievel (PR)  function 3
router.post('/PasswordRetrievel', function (req, res) {
    
    let Username=req.body.Username;
    let question=req.body.QuestionID;
    let answer=req.body.Answer;  
   
    if (!Username || !question || !answer){
        res.send("Invalid Usename or question or answer");
        res.end();
    }
    else{
        DButilsAzure.execQuery("SELECT Password FROM [Users] where Username IN (SELECT UserName FROM [UserQuestions] where UserName='"+Username+"' AND QuestionID="+question+" AND answer='"+answer+"')")
        .then(function(result){
            if (result.length > 0) {
            res.send(result)
            }
            else {
            res.sendStatus(404);
            }   
        })
        .catch(function(err)
        {
            console.log(err)
        
        })
    }
    });



//Check if usename exists  function 4
router.get('/Exist/:Username', function (req, res) {
    
    let Username=req.params.Username;
     
    if (!Username){
        res.send("Invalid Usename ");
        res.end();
    }
    else{

    DButilsAzure.execQuery("SELECT * FROM [Users] where Username='"+Username+"'").then(function(result){
        if (result.length>0){
            res.send("TRUE");
        }
        else{
            res.send("FALSE");
        }
        
    })
    .catch(function(err)
    {
        console.log(err)
    
    })
}
});

router.get('/getCountries', function (req,res) {

    var XMLPath = "countries.xml";
    var parser = new xml2js.Parser();
    fs.readFile(XMLPath,function(err,data){
        parser.parseString(data,function(err,result){
            res.send(result.Countries.Country);

        });
    });

});

 //login function 1
router.post('/Login', function (req, res) {

    let user=req.body;
    if(!user){
        res.send("login failure");
        res.end();
    }
    else{

        var payload = {
            userName: user.Username,
            password: user.Password
            }
           
            
            var token = jwt.sign(payload, superSecret, {
            expiresIn: "1d" // expires in 24 hours
            });
            

        
    DButilsAzure.execQuery("SELECT * FROM [Users] WHERE Username='"+user.Username+"'")
        .then(function(result) {
            if (result.length == 0){
                return Promise.reject('Wrong Username');
            }
            else if (!(result[0].Password === user.Password)) {
               
                return Promise.reject('Wrong Password');
            }
          
            res.json({
                success: true,
                message: 'Logged in!',
                token: token
            });
                           

        })
      
        .catch(result=>res.send("" +result));


    }

});


//register   function 2 
router.post('/Register', function (req, res) {
    
    let user=req.body;
    let categories=user.Categories;
    let questions=user.Questions;
    let answers=user.Answers;
    var register=true;
    var abc = /^[A-Za-z]+$/;
    var letters = /((^[0-9]+[a-z]+)|(^[a-z]+[0-9]+))+[0-9a-z]+$/i; 
    if(!user.UserName.match(abc)){
        register=false;
        res.send("Username can cosist only of letters, not numbers");
        res.end();
    }
    if(!user.Password.match(letters)){
        register=false;
        res.send("Password needs to contain letters AND numbers");
        res.end();
     }
    if (user.UserName.length<3 || user.UserName.length>8){
        register=false;
        res.send("Username's number of letters is between 3 and 8 only");
        res.end();
    }
 /* if(!checkCountry(country)){
        register=false;
        res.send("Country doesn't exist please give an exist country");
        res.end();
    }*/
    if (user.Password.length<5 ||user.Password.length>10){
        register=false;
        res.send("Password's length is between 5 and 10 only");
        res.end();
    }

    if (!user){
        register=false;
        res.send("Invalid User");
        res.end();
    }

    if (categories.length<2){
        register=false;
        res.send("User needs atleast 2 categories!");
        res.end();
    }

    if (questions.length<2 || questions.length!=answers.length){
        register=false;
        res.send("User needs to answer atleast 2 questions!");
        res.end();
    }

    if (register==true){
        DButilsAzure.execQuery("SELECT * FROM [Users] where Username='"+user.UserName+"'")
        .then(function(result){
            if (result.length>0){                
                res.send("The username already exists in the system!");
                res.end();
            }
            
        })
        .then(function(ans) {
            DButilsAzure.execQuery("INSERT INTO [Users] VALUES ('"+user.UserName+"'"+",'"+user.FirstName+"','"+user.LastName+"','"+user.Password+"','"+user.City+"','"+user.Country+"','"+user.Email+"')")
            .then(function(result){
                  
            })
            .catch(function(err)
            {
                console.log(err)
            
            })
        .then(function(ans) {
            let sql=addFavoriteCategories(user.UserName, categories)+"";
            DButilsAzure.execQuery(sql+"")
            .then(function(ans) {
                })
            .catch(function(err)
             {
                    
                res.send("Registeration failed");
                
             })
            })
            .catch(function(err)
            {
                res.send("Registeration failed");            
            }) 
           
        })
        .then(function(result){
            let sql=addUserQuestionsAnswers(user.UserName, questions, answers)+"";
            DButilsAzure.execQuery(sql+"")
            .then(function(result) {

                res.send("Registered succsefuly!");
                   })
            .catch(function(err)
                {
                       
                   res.send("Registeration failed");
                   
                })
            
        })
        .catch(function(err)
        {
            res.send("Registeration failed");
        
        })
    
    }
    });
    


    function addFavoriteCategories(Username, categories)
{

    let sql = "INSERT into [UsersCatagories] (Username, catagory_id) values";
    for(var i = 0; i < categories.length; i++)
    {
        sql += "('" + Username + "', '" + categories[i] + "'),";
    }
    sql = sql.substring(0,sql.length-1);
    return sql;
};


function addUserQuestionsAnswers(Username, questions, answers)
{

    let sql = "INSERT into [UserQuestions] (QuestionID, UserName, answer) values";
    for(var i = 0; i < questions.length; i++)
    {
        sql += "('" + questions[i] + "', '" + Username + "','"+answers[i]+"'),";
    }
    sql = sql.substring(0,sql.length-1);
    return sql;
};

/*$(document).ready(function() {
    $.get('countries.xml', function(d) {
         myMap = new Map();
        $(d).find('Country').each(function() {
            var $Country = $(this);
            var id = $Country.find('ID').text();
            var name = $Country.find('Name').text();
           myMap.set(id,name);
        }) ;
    });

});*/
 /*function checkCountry(country){
     
     for(var i=0;i<myMap.length;i++){
         if(country===myMap.get(i-1)){
             return true;
         }
     }
     return false;
 }
 */

module.exports=router;