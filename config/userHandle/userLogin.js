const { getDb } = require("../dbconnect")
const collctionName="userLoginDetails"
const bcrypt = require('bcrypt')


async function loginUser(req){

    const username=req.body.email
    const password=req.body.password
    
    const db=getDb()
    const collection=db.collection(collctionName)

    try {
        const userdata=await collection.findOne({email:username})
        
        if(!userdata) return {error:"user not found"}
        else{
            const match = await bcrypt.compare(password, userdata.password);

            if(match){
                
                
                return {userdata}
                
            }else{
                return {error:"password error"}

            }
            
        }
    } catch (error) {
        return error
    }
      
    
    
}

module.exports={loginUser}