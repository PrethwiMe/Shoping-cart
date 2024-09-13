var express = require("express")
var path = require('path');
var router = express.Router();
var { viewProducts, deleteProduct, viewOneProduct, updateProduct } = require('../config/productActions')
var { addimg } = require('../config/img');
const { ObjectId } = require("mongodb");
const { log } = require("console");
const { getDb } = require("../config/dbconnect");


router.get('/', async (req, res) => {
  try {
    const allProducts = await viewProducts();
    res.render('admin/all-products', { allProducts })
  } catch (error) {
    res.status(500).send("data fetch error" + error)
  }
})
router.get("/add-products", (req, res) => {
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

module.exports = router

