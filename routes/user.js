var express = require('express');
var router = express.Router();
var path = require("path")
var { viewProducts, addToCart, viewCart,countItems, changeQuantity, removeProductFromCart, total, getCart, placeOrder, viewMyOrders } = require("../config/productActions");
const { addUser } = require('../config/userHandle/signupUser');
const { loginUser } = require('../config/userHandle/userLogin');
const session = require('express-session');

router.use(express.urlencoded({ extended: true }));

//session login
const verifylogin=(req,res,next)=>{
  if(req.session.loggedIn && req.session)
    next();
  else
  res.redirect('/login')
}
//render index page
router.get('/', async (req, res) => {
  try {
      let sessiondata = req.session.user;
      let numberOfItems = 0;

      if (sessiondata) {
          numberOfItems = await countItems(req.session.user._id);
          
          
      } else {
          console.log("Session data is null");
      }

      const allProducts = await viewProducts();
      res.render('layout/user', { sessiondata, allProducts, numberOfItems });
  } catch (error) {
      console.error("Data fetch error:", error); // Log error details for debugging
      res.status(500).send("Data fetch error: " + error.message);
  }
});

//render signup page
router.get('/signup', async (req, res) => {
  try {
    res.render('layout/signup')
  } catch (error) {
    console.log(error)
  }
})
//user adding post methode
router.post("/signup", async (req, res) => {
  try {
    
    const success = await addUser(req);
   if(success){
    res.status(201).json({ message: 'User added successfully' });

   }else{
    res.status(409).json({ message: 'User already exists' });
   }
  } catch (error) {
    res.status(500).json({ message: 'An error occurred while adding the user' });

    console.log(error)
  }

})
//render login, session used
router.get('/login',  (req, res)=> {


  if (req.session.user) {
    res.redirect('/')
  }else{
    res.render('layout/login',{"loginError":req.session.loginError});
    req.session.loginError=false
  }
    
  })
//login-password, post methode and session
router.post("/login",async (req,res)=>{

  try {
    const result=await loginUser(req)

    if (result.error) {
      console.log(result.error);

      req.session.loginError=result.error;
      res.redirect('/login')
    }

    req.session.user=result.userdata
    
    req.session.loggedIn=true
    res.redirect('/')
    
  } catch (error) {
    console.log(error);
    
  }
 
})
//logout session destroyed
router.get('/logout',(req,res)=>{
  req.session.destroy();
  res.redirect('/')
})
//view cart
router.get('/cart',verifylogin,async (req,res) => {
  const userId=req.session.user._id
  let sessiondata=req.session.user
  const userforammount=req.session.user._id
  const details=await viewCart(userId)
  const totalamount=await total(userforammount)
  
  
  if (totalamount===0) {
    console.log("empty cart");
   res.render('layout/emptyCart',sessiondata)
    
  }else{
  res.render('layout/cart',{details,sessiondata,totalamount})
}
  
})

//add to cart products
router.get('/go-to-cart',verifylogin,async(req,res)=>{
  
  const result=await addToCart(req.session.user._id,req.query.id,req.session.user.name)
  
  res.json({status:true})
})

//qunatity change

router.post('/change-quantity',async(req,res)=>{
  
  const { cartId, productId, count } = req.body;
 const result=await changeQuantity(req.body)
 res.json({count:result})
   
})
router.get("/remove-item",verifylogin,async (req,res)=>{
  
  const cartId=req.query.id
  const productId=req.query.product
  
  
const result=  await removeProductFromCart(cartId,productId)
  res.json({status:true})
})

router.get('/place-order',verifylogin,async(req,res)=>{
  const userId=req.session.user._id
  
await total(userId).then(response=>{
  
  res.render('layout/placeOrder',{response,userId})
})
})

router.post("/submit-order",verifylogin,async(req,res)=>{

  const userId=req.body.userId
  const userDetails=req.body
  //userDetails have userID
  const amt=await total(userId)
 const cartForOrder= await getCart(userId)
const orderplaceApi=await placeOrder(cartForOrder,userDetails,amt);
console.log("oder place");

 res.redirect("/place-Order")
})

router.get('/myOrders',verifylogin,async (req,res) => {

  const result=await viewMyOrders(req.session.user._id)
  console.log("userId",req.session.user._id);
    
  res.render("layout/myOrders",{result})
  
})




module.exports = router;



