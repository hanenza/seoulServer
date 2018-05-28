var express=require('express');
var router=express.Router();
var DButilsAzure = require('./DButils');



//password retrievel (PR)  function 3
router.get('/PasswordRetrievel/:Username/:QuestionID/:Answer', function (req, res) {
    
    let Username=req.params.Username;
    let question=req.params.QuestionID;
    let answer=req.params.Answer;

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
    
    });











module.exports=router;