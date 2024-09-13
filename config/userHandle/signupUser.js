const { getDb } = require("../dbconnect")
var {productActions}=require("../productActions")
const bcrypt = require('bcrypt')
const collctionName="userLoginDetails"




async function addUser(req,res) {
  const hash= await bcrypt.hash(req.body.password, 10)

  const newUser={
   ...req.body,
   password:hash
  }

   try {
    const db= getDb();

    const collection= await db.collection(collctionName);
    const checkExisitigUser= req.body.email
    const userEmail=await collection.findOne({email:checkExisitigUser})
    if(userEmail){
      //"user exist"
      return false;

    }else{
      await collection.insertOne(newUser)
    //"user added"
      return true

    }
      
   } catch (error) {
    console.log(error);
    const fail="user added failed"
  
   }
}

module.exports={addUser}