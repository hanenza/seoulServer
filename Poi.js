var express=require('express');
var router=express.Router();
var DButilsAzure = require('./DButils');



//gets all points of intersts that are currently in the system  function 20
router.get('/AllPointsOfInterest', function (req, res) {

    DButilsAzure.execQuery("SELECT * FROM [PointsOfInterest]")
    .then(function(result){
      res.send(result);
    })
    .catch(function(err)
    {
        console.log(err)
    
    })

});



//get Points of Interest Info  by ID  function 5
router.get('/PointOfInterestInfo/:POF_id', function (req, res) {
    
    let id=req.params.POF_id;
    let POFdata;
    console.log(id);
    if (!id){
        res.send("Invalid point of interest id ");
        res.end();
    }
    else{
    DButilsAzure.execQuery("SELECT NumberOfViewers,Descreption,Ranking FROM [PointsOfInterest] where ID="+id+"")
    .then(function(result){
        if (result.length==0){
            res.send("This point of interest doesnt exist in the system!");
        }
        else{
        POFdata=result;
        DButilsAzure.execQuery("SELECT TOP 2 ReviewDescription, date FROM [PointOfInterestReview] where POF_id='"+id+"' ORDER BY Date DESC")
        .then(function(result){
         var finalObj = POFdata.concat(result);
            res.send(finalObj);

        })
        .catch(function(err)
        {
            res.send("This point of interest doesnt exist in the system!");
        
        })
    }
    })
    .catch(function(err)
    {
        res.send("This point of interest doesnt exist in the system!");
    
    })
    
    }
});




//returns randomlly 3 POF's that are above rank that equals to minRank (Threshold) function 19
router.get('/ThreeMostPopular/:minRank', function (req, res) {
    
    let minRank=req.params.minRank

    if (!minRank){
        res.send("Invalid rank ");
        res.end();
    }
    else{
    DButilsAzure.execQuery("SELECT TOP 3 * FROM [PointsOfInterest] WHERE Ranking>='"+minRank+"' ORDER BY NEWID() ")
    .then(function(result){
       
        res.send(result)
              
    })
    .catch(function(err)
    {
        console.log(err)
    
    })
    }
});




    //get Points of Interest by name  function 11
    router.get('/SearchByName/:POF_name', function (req, res) {
    
        let name=req.params.POF_name;

        if (!name){
            res.send("Invalid point of interest name ");
            res.end();
        }
        else{

        DButilsAzure.execQuery("SELECT * FROM [PointsOfInterest] where Name='"+name+"'").then(function(result){
            if (result.length>0){
                res.send(result)
            }
            else{
                res.send("This Point Of Interest doesn't exist in the system!")
            }
           
        })
        .catch(function(err)
        {
            res.sendStatus(404);
        
        })
    }
    });
    

//gets all POI's categories  function 6
router.get('/Categories', function (req, res) {
    
    DButilsAzure.execQuery("SELECT * FROM [Catagory]").then(function(result){
        res.send(result)
        console.log(result)
    })
    .catch(function(err)
    {
        console.log(err)
    
    })

});


 //filter POF by Category  function 7
 router.get('/PointOfInterestByCategory/:CategoryID', function (req, res) {
    
    let category=req.params.CategoryID;

    if (!category){
        res.send("Invalid category ");
        res.end();
    }

   else{

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
   }
});


     //view a POF  function 18
     router.get('/viewPointOfInterest/:POF_id', function (req, res) {
            
        let POFid=req.params.POF_id
    
        
        if (!POFid){
            res.send("Invalid point of interest");
            res.end();
        }
    else{
    
        let views=0;
          DButilsAzure.execQuery("SELECT NumberOFViewers FROM [PointsOfInterest]  WHERE ID='"+POFid+"'")
          .then(function(result){
              views=parseInt(result[0].NumberOFViewers)+1;
    
              DButilsAzure.execQuery("UPDATE [PointsOfInterest] SET NumberOFViewers='"+views+"' WHERE ID='"+POFid+"'")
              .then(function(result){
                  res.send("Another viewer has been added to this Point of Interest's viewers!");
                   
              })
            
              .catch(function(err)
              {
                  res.send("Couldn't watch the point of view- Invalid point of view");
              
              })
               
          })
        
          .catch(function(err)
          {
              res.send("false");
          
          })
        }
      });
    
    

module.exports=router;