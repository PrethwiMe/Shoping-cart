var express = require("express")
var path = require('path');
var router = express.Router();
var { viewProducts, deleteProduct, viewOneProduct, updateProduct, orderData, updateDelivery, loginAdmin } = require('../config/productActions')
var { addimg } = require('../config/img');
const { ObjectId } = require("mongodb");
const { log, error } = require("console");
const { getDb } = require("../config/dbconnect");
const session = require("express-session");

function adminCheck(req,res,next){
  if (req.session.adminLoggedIn) {
    console.log("session working");
    
    next()
  }else{
    console.log("session not working");
    
    res.redirect('/admin')

  }
}


router.get('/',async(req,res)=>{
if (req.session.adminLoggedIn) {
  res.redirect('/admin/products')
}
  
  const loginError = req.session.loginError;
  req.session.adminLoggedIn=null;
  console.log("loginError",loginError);
  
  req.session.loginError=null;

  res.render('admin/adminLogin',{loginError})
})

router.post('/adminLogin',async (req,res)=>{
  const user=req.body.email;
  const password=req.body.password
  try {
   const login=await loginAdmin(user,password)

    if (login===true || req.session.adminLoggedIn) {
      req.session.adminLoggedIn=true;
      
      console.log("call before view product");
      const allProducts = await viewProducts();
    res.render('admin/all-products', { allProducts })
    }else{
      req.session.loginError=login
      res.redirect('/admin')
    } 
  } catch (error) {
    res.render(error)
  }
})

router.get('/products',async(req,res)=>{
  const allProducts = await viewProducts();
    res.render('admin/all-products', { allProducts })
})

router.get('/logout',(req,res)=>{
  req.session.adminLoggedIn=false;
  res.redirect("/admin")
})

router.get("/add-products",adminCheck, (req, res) => {
  res.render('admin/add-products')
})
router.post("/add-products", (req, res,) => {
  addimg(req, res)
})
router.get('/delete-product', async (req, res) => {
  const id = req.query.id
  const result = await deleteProduct(id)
  console.log(result);
  res.redirect('/admin')
})
//render edit form
router.get('/edit-products', async (req, res) => {
  const id = req.query.id
  console.log(req.body);

  const productDetails = await viewOneProduct(id)
  res.render('admin/edit-products', { productDetails })
})

//submit edit form
router.post('/edit-products', async (req, res) => {
  const det = req.body
  console.log(req.files);
  const p = req.body
  const result = await updateProduct(det);
/////////////////////////////////////////////////////////////

const imageFile = req.files ? req.files.image : null;
    if (imageFile) {
  
      const id = req.body.imageid.toString()
      const pathofimage = path.join(__dirname, '../public/images', id)
      await imageFile.mv(pathofimage)
      const fileMetadata = {
        _id: id,
        mimetype: imageFile.mimetype,
        size: imageFile.size,
        path: pathofimage,
  
      };
      const productData = {
        ...req.body,
        image: fileMetadata
      };
      const db = getDb();
      const collection = db.collection("allProducts")
  
      const up = await collection.updateOne(
        { _id: new ObjectId(det._id) },
        { $set: { image: fileMetadata } })
    } else {
      console.log("no img");
    }
  res.redirect('/admin')
})

router.get('/orderData',async (req,res)=>{
  const order=await orderData();
  res.render('admin/orderData',{order})
})

router.post('/updateOrderStatus',async (req,res)=>{
  console.log("data",req.body);
  const orderId=req.body.orderId;
  const status=req.body.deliveryStatus;
  const upsts=await updateDelivery(orderId,status)
  if (upsts) {
    res.redirect('/admin/orderData');
  } else {
    // Handle case where status update failed
    res.status(400).send('Failed to update order status');
  }
})

module.exports = router

