
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



//gets all points of intersts that are currently in the system  function 26
app.get('/AllPointsOfInterest', function (req, res) {


        DButilsAzure.execQuery("SELECT * FROM [PointsOfInterest]")
        .then(function(result){
          res.send(result);
        })
        .catch(function(err)
        {
            console.log(err)
        
        })
    
    });




//returns randomlly 3 POF's that are above rank 80 function 24
app.get('/ThreeMostPopular/:minRank', function (req, res) {
    
        let minRank=req.params.minRank

        DButilsAzure.execQuery("SELECT TOP 3 * FROM [PointsOfInterest] WHERE Ranking>='"+minRank+"' ORDER BY NEWID()")
        .then(function(result){
           
            res.send(result)
                  
        })
        .catch(function(err)
        {
            console.log(err)
        
        })
    
    });


 //view a POF  function 23
 app.get('/Users/viewPointOfInterest/:POF_id', function (req, res) {
            
    let POFid=req.params.POF_id
    let views=0;
      DButilsAzure.execQuery("SELECT NumberOFViewers FROM [PointsOfInterest]  WHERE ID='"+POFid+"'")
      .then(function(result){
          views=parseInt(result[0].NumberOFViewers)+1;

          DButilsAzure.execQuery("UPDATE [PointsOfInterest] SET NumberOFViewers='"+views+"' WHERE ID='"+POFid+"'")
          .then(function(result){
              res.send("ok");
               
          })
        
          .catch(function(err)
          {
              res.send("false");
          
          })
           
      })
    
      .catch(function(err)
      {
          res.send("false");
      
      })

  });



    //get Points of Interest by name  function 15
 app.get('/Users/SearchByName/:POF_name', function (req, res) {
    
        let name=req.params.POF_name;
        DButilsAzure.execQuery("SELECT * FROM [PointsOfInterest] where Name='"+name+"'").then(function(result){
            res.send(result)
        })
        .catch(function(err)
        {
            console.log(err)
        
        })
    
    });
    



//middleware that checks that the user has a valid token
app.use('/RegisteredUsers', function(req,res,next){

 var token=req.body.token || req.query.token || req.headers['x-access-token'];

 if (token) {
    // verifies secret and checks exp
    jwt.verify(token, superSecret, function (err, decoded) {
    if (err) {
    return res.json({ success: false, message: 'Invalid token!' });
    } else {
    // if everything is good, save to request for use in other routes
    // get the decoded payload and header
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


//login function 1
app.post('/Login', function (req, res) {

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
app.post('/Register', function (req, res) {
    
    let user=req.body;
    let categories=user.Categories;
    let questions=user.Questions;
    let answers=user.Answers;

    var register=true;
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

           //  res.send("Registered succsefuly!");
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



//get Points of Interest Info  by ID  function 5
app.get('/PointOfInterestInfo/:POF_id', function (req, res) {
    
        let id=req.params.POF_id;
        let POFdata;
        
        DButilsAzure.execQuery("SELECT * FROM [PointsOfInterest] where ID="+id+"")
        .then(function(result){
            POFdata=result;
            DButilsAzure.execQuery("SELECT TOP 2 Description, date FROM [PointOfInterestReview] where POF_id='"+id+"' ORDER BY Date DESC")
            .then(function(result){
             var finalObj = POFdata.concat(result);
                res.send(finalObj);

            })
            .catch(function(err)
            {
                console.log(err)
            
            })
        })
        .catch(function(err)
        {
            console.log(err)
        
        })
    
    });
    



//Check if usename exists  function 4
app.get('/Exist/:Username', function (req, res) {
    
        let Username=req.params.Username;
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
    
    });

//get all catagories  function 6
app.get('/Categories', function (req, res) {
    
        let id=req.params.id;
        DButilsAzure.execQuery("SELECT * FROM [Catagory]").then(function(result){
            res.send(result)
            console.log(result)
        })
        .catch(function(err)
        {
            console.log(err)
        
        })
    
    });
   
    
    //returns size of POF of a specific user  function 18
app.get('/UserPointsOfInterest/:Username', function (req, res) {
    
        let Username=req.params.Username;
        DButilsAzure.execQuery("SELECT * FROM [UsersPointOfInterest] where Username='"+Username+"'").then(function(result){
            var size=result.length;
         res.send(size+"");
            
        })
        .catch(function(err)
        {
            console.log(err)
        
        })
    
    });


 //filter POF by Category  function 7
app.get('/Users/PointOfInterestByCategory/:CategoryID', function (req, res) {
    
        let category=req.params.CategoryID;
        DButilsAzure.execQuery("SELECT * FROM [PointsOfInterest] where CatagoryID='"+category+"'").then(function(result){
        if (result.length>0){
         res.send(result);
        }
        else {
            res.sendStatus(404);
        }
            
        })
        .catch(function(err)
        {
            console.log(err)
        
        })
    
    });


//get all POF of a specific user  function 11
app.get('/UserPointsOfInterest/Username/:Username', function (req, res) {
    
    let Username=req.params.Username;
   
        DButilsAzure.execQuery("SELECT * FROM [PointsOfInterest] where ID IN (SELECT POF_id FROM [UsersPointOfInterest] where UserName='"+Username+"')")
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
    
    });



// returns 2 last saved POF by user function 12
app.get('/TwoLastPointsOfInterest/:Username', function (req, res) {
    
    let Username=req.params.Username;
   
        DButilsAzure.execQuery("SELECT * FROM [PointsOfInterest] WHERE ID IN (SELECT TOP 2 POF_id FROM [UsersPointOfInterest] where UserName='"+Username+"' ORDER BY Date DESC)")
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
    
    });


    

    //user gives review regarding a POF  function 21
  app.post('/Users/GiveReview', function (req, res) {
            
       
            let Review=req.body.Review;
            let POFid=req.body.POF_id;
    
            let reviewID=0;
          
                DButilsAzure.execQuery("SELECT TOP 1 ReviewID FROM [PointOfInterestReview] ORDER BY ReviewID DESC")
                .then(function(result){
                    if(result.length>0){
                    var count=JSON.stringify(result);             
                    var x=count.substring(count.indexOf(":")+1, count.indexOf("}"));
                    reviewID=(parseInt(x))+1;
                    }
                    DButilsAzure.execQuery(" INSERT INTO [PointOfInterestReview] VALUES ('"+POFid+"'"+",'"+reviewID+"',GETDATE() ,'"+Review+"')")
                    .then(function(x){ 
                        
                        res.send("true");      
                    })
                    .catch(function(err)
                    {
                       
                        res.send("false");
                    })
                   
                })
                .catch(function(err)
                {
                    res.send("false");
                
                })
                
              
            
            
            });
         
        
 //user ranks a POF  function 22
 app.post('/Users/Rank', function (req, res) {
            
    let Rank=req.body.Rank;
    let POFid=req.body.POF_id;
    let avg=0;
    
        DButilsAzure.execQuery("INSERT INTO [PointOfInterestRank] VALUES ('"+POFid+"','"+Rank+"')")
        .then(function(result){
            
            DButilsAzure.execQuery("SELECT Rank FROM [PointOfInterestRank] where POF_id='"+POFid+"'")
            .then(function(result){ 
             for(var i=0;i<result.length;i++){
                avg=avg+parseInt(result[i].Rank);
             }
             avg=(avg/(result.length))*20;

             DButilsAzure.execQuery("UPDATE [PointsOfInterest] SET Ranking='"+avg+"' where ID='"+POFid+"'")
             .then(function(result){ 
             
                res.send("true");
              
             })
             .catch(function(err)
             {
                 res.send("false");
             
             })
 
            })
            .catch(function(err)
            {
                res.send("false");
            
            })

           
        })
        .catch(function(err)
        {
            res.send("false");
        
        })
        
      
    
    
    });
 

// deletes POF   function 17
app.delete('/Users/DeletePointOfInterest', function (req, res) {
    
    let POFid=req.body.POF_id;
    let Username=req.body.Username;
   
        DButilsAzure.execQuery("DELETE FROM [UsersPointOfInterest] where POF_id='"+POFid+"' AND UserName='"+Username+"'")
        .then(function(result){
              res.send("row was succesfuly deleted");  
        })
        .catch(function(err)
        {
            console.log(err)
        
        })
    
    });


    //user saves a new PoF    function 16
    app.post('/Users/SavePointOfInterest', function (req, res) {
        
        let Username=req.body.Username;
        let POfid=req.body.POF_id;
        
            DButilsAzure.execQuery("INSERT INTO [UsersPointOfInterest] VALUES ('"+Username+"'"+",'"+POfid+"',GETDATE())")
            .then(function(result){
               res.send("true");
            })
            .catch(function(err)
            {
                res.send("false");
            
            })
        
        });





    //get 2 popular point of Interests for a user   function 13
 app.get('/Top2PointsOfInterest/:Username', function (req, res) {
            
    
    let Username=req.params.Username;
    
    let POFs="";
   

      DButilsAzure.execQuery("SELECT TOP 2 catagory_id FROM [UsersCatagories] WHERE Username='"+Username+"' ORDER BY NEWID()")
      .then(function(result){
         let catergory1=result[0].catagory_id;
         let catergory2=result[1].catagory_id;


          DButilsAzure.execQuery("SELECT TOP 1 * FROM [PointsOfInterest] where CatagoryID='"+catergory1+"' ORDER BY Ranking DESC ")
          .then(function(result){
            POFs=result;
            DButilsAzure.execQuery("SELECT TOP 1 * FROM [PointsOfInterest] where CatagoryID='"+catergory2+"' ORDER BY Ranking DESC ")
          .then(function(result){
          
             Pofs=result.concat(POFs)
            
              res.send(Pofs);
              
          })
        
          .catch(function(err)
          {
              res.send("false");
          
          })

          })
        
          .catch(function(err)
          {
              res.send("false2");
          
          })
           
      })
    
      .catch(function(err)
      {
          res.send("false3");
      
      })

  });



  app.post('/Users/OrderPointsOfInterestManually', function (req, res) {
        
    let Username=req.body.Username;
    var x=req.body.x;

    var token = req.body.token;
    var decoded = jwt.decode(token, {complete:true});

      console.log(x[0]);
    //DELETE FROM table WHERE (col1,col2) IN ((1,2),(3,4),(5,6))
       // for (var i=0; i<POF_ids.length; i++){
        let POF_id=POF_ids[i];
        DButilsAzure.execQuery("DELETE FROM [UsersPointOfInterest] WHERE (UserName,POF_id) IN (('"+Username+"','"+POF_id+"'))")
        .then(function(result){
           res.send("true");
        })
        .catch(function(err)
        {
            res.send("false");
        
        })
  //  }
    
    });



app.use('/Users', Users);

var port = 4000;
app.listen(port, function () {
    console.log('Connecting to server'+port);
});
//-------------------------------------------------------------------------------------------------------------------


