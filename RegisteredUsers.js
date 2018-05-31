var express=require('express');
var router=express.Router();
var DButilsAzure = require('./DButils');
var jwt = require('jsonwebtoken');
const superSecret = new Buffer("SecretKey","Base64"); 




// returns 2 recent saved POF by user function 9          
router.get('/TwoRecentPointsOfInterest', function (req, res) {
    
    var token = req.headers['token'];
    var decoded=jwt.decode(token, {complete:true});   
    let Username=decoded.payload.userName;

   
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



    //get 2 popular point of Interests for a user   function 10                
 router.get('/Top2PointsOfInterest', function (req, res) {
            
    
    var token = req.headers['token'];
    var decoded=jwt.decode(token, {complete:true});   
    let Username=decoded.payload.userName;
    
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



 //user gives review regarding a POF  function 16     
 router.post('/GiveReview', function (req, res) {
            
    let Review=req.body.Review;
    let POFid=req.body.POF_id;

    if (!Review || !POFid){
        res.send("Invalid Review or Point ID!");
        res.end();
    }

else{
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
        
    }

    });
 

 //user ranks a POF  function 17
 router.post('/GiveRank', function (req, res) {
            
    let Rank=req.body.Rank;
    let POFid=req.body.POF_id;

   if (!Rank || !POFid){
    res.send("Invalid Rank or Point ID");
    res.end();
   }
 else  if (Rank<1 || Rank>5){
    res.send("Rank needs to be between 1 and 5");
    res.end();
   }
else{

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
    }         
    });
 


// deletes POF   function 13          
router.delete('/DeletePointOfInterest', function (req, res) {
    

    let token=req.body.token;
    var decoded=jwt.decode(token, {complete:true});   
    let Username=decoded.payload.userName;

    let POFid=req.body.POF_id;
   
    if (!POFid){
        res.send("Invalid Point of Interest");
        res.end();
    }
    else {
    
        DButilsAzure.execQuery("DELETE FROM [UsersPointOfInterest] where POF_id='"+POFid+"' AND UserName='"+Username+"'")
        .then(function(result){
              res.send("row was succesfuly deleted");  
        })
        .catch(function(err)
        {
            res.sendStatus(403);
        
        })
    }
    });


//user saves a new PoF    function 12
router.post('/SavePointOfInterest', function (req, res) {
    
    let token=req.body.token;
    var decoded=jwt.decode(token, {complete:true});   
    let Username=decoded.payload.userName;

    let POfid=req.body.POF_id;

    if (!POfid){
        res.send("Invalid Point of Interest");
        res.end();
    }
    else{

    let lastPosition;
    
        DButilsAzure.execQuery("SELECT top 1 Position FROM [UsersPointOfInterest] WHERE Username='"+Username+"' ORDER BY Position DESC")
        .then(function(result){
           lastPosition=parseInt(result[0].Position);
           lastPosition=lastPosition+1;
           let sql="INSERT INTO [UsersPointOfInterest] VALUES ('"+Username+"'"+",'"+POfid+"',GETDATE(),'"+lastPosition+"')";
           DButilsAzure.execQuery(sql)
           .then(function(result){
              res.send("Point of Interest saved!");
              
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
    }
    });


  //user decided the POI's order on his list  function 15
    router.post('/OrderPointsOfInterestManually', function (req, res) {
        
    var token = req.body.token;
    var decoded=jwt.decode(token, {complete:true});   
    let Username=decoded.payload.userName;

    let POF_ids=req.body.POF_ids;
 

    if (!POF_ids){
        res.send("Invalid Point of Interest");
        res.end();
    }
    else{
            let sql=deleteUserPointsOfInterest(Username,POF_ids);
            DButilsAzure.execQuery(sql)
            .then(function(result){
   
               let sql=addUserPointsOfInterest(Username,POF_ids);
               DButilsAzure.execQuery(sql)
               .then(function(result){
                 res.send("Changed order!")
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
        }
        
        });
    

  //makes a sql that helps deleting a username's poi
        function deleteUserPointsOfInterest(Username, POF_ids)
        {
  
            let sql = "DELETE FROM [UsersPointOfInterest] WHERE ";
            for(var i = 0; i < POF_ids.length; i++)
            {
                sql += "(UserName='" + Username + "'AND POF_id='" + POF_ids[i]  + "') OR";
            }
            sql = sql.substring(0,sql.length-2);
            
            return sql;
        };

        function addUserPointsOfInterest(Username, POF_ids)
        {
           
            let sql = "INSERT into [UsersPointOfInterest]  values";
            for(var i = 0; i < POF_ids.length; i++)
            {
                sql += "('" + Username + "', '" + POF_ids[i]  + "',GETDATE(),'"+i+"'),";
            }
            sql = sql.substring(0,sql.length-1);
            return sql;
        };



   //returns amount of POF's of a specific user  function 14        
   router.get('/PointsOfInterestsAmount', function (req, res) {
    
    var token = req.headers['token'];
    var decoded=jwt.decode(token, {complete:true});   
    let Username=decoded.payload.userName;

    DButilsAzure.execQuery("SELECT * FROM [UsersPointOfInterest] where Username='"+Username+"'").then(function(result){
     var size=result.length;
     if (size>0){
     res.send(Username+" Currently has "+size+" Points of Interests saved");
     }
     else {
         res.send(Username+" doesnt have any Points of interests saved")
     }
        
    })
    .catch(function(err)
    {
        console.log(err)
    
    })

});


//get all POF of a specific user in the order he had it  function 8                      
router.get('/OrderedPointsOfInterest', function (req, res) {
     
    var token = req.headers['token'];
    var decoded=jwt.decode(token, {complete:true});   
    let Username=decoded.payload.userName;
    let toReturn=[];

    DButilsAzure.execQuery("SELECT PointsOfInterest.Name, PointsOfInterest.NumberOFViewers, PointsOfInterest.Descreption, PointsOfInterest.Ranking, PointsOfInterest.Picture, PointsOfInterest.CatagoryID FROM PointsOfInterest INNER JOIN UsersPointOfInterest ON PointsOfInterest.ID=UsersPointOfInterest.POF_id WHERE UsersPointOfInterest.UserName='"+Username+"' ORDER BY Position  ASC ")
    .then(function(result){
        let POF_ids=result;
        res.send(result);
    })
    .catch(function(err)
    {
        console.log(err)
    
    })

});



//get all POF of a specific user  function   21              
router.get('/UserPointsOfInterest', function (req, res) {

    var token = req.headers['token'];
    var decoded=jwt.decode(token, {complete:true});   
    let Username=decoded.payload.userName;

    DButilsAzure.execQuery("SELECT Name, NumberOFViewers, Descreption, Ranking, Picture, CatagoryID FROM PointsOfInterest where ID IN (SELECT POF_id FROM [UsersPointOfInterest] where UserName='"+Username+"')")
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


module.exports=router;