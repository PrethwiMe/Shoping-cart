var express = require("express")
var { getDb } = require('./dbconnect')
const path = require('path');
const { log } = require("console");
const { ObjectId } = require("mongodb");
const { stringify } = require("querystring");
const productCollection = "allProducts"
const cart = "cart"

async function dataInsert(data) {

    try {
        const db = getDb(); // Get the database object
        const newDocument = data;// Get the document from the request body 
        const inserDetails = await db.collection(productCollection).insertOne(newDocument); // Insert the document
        console.log("pushed");
        // console.log(inserDetails);   
    } catch (error) {
        res.status(500).send('Error inserting document');
    }
}

async function viewProducts() {
    try {
        const db = getDb();
        const collection = db.collection(productCollection);
        const docs = await collection.find({}).toArray();
        return docs;
    } catch (error) {
        console.error("Error fetching products:", error); // Log error details
        throw error; // Re-throw error to be caught in the route handler
    }
}


async function deleteProduct(id) {
    try {

        const db = getDb();
        console.log("try afterdb:" + id);
        const uniqueid = new ObjectId(id)
        console.log('Attempting to delete product with ID:', uniqueid);
        const deletedProduct = await db.collection(productCollection).deleteOne({ _id: uniqueid })
        return deleteProduct
    } catch (error) {
        return { error: "delete action not working" }
    }
}

async function viewOneProduct(id) {

    try {
        const db = getDb()
        const objid = new ObjectId(id)
        const collection = db.collection(productCollection)
        const doc = await collection.findOne({ _id: objid })
        return doc;
    } catch (error) {
        console.log("error:" + error)
    }
}

async function updateProduct(req) {
    console.log("function update");

    try {
        const db = getDb()
        const objid = new ObjectId(req._id)
        const collection = db.collection(productCollection)
        const filter = { _id: objid }
        console.log("catagory" + req.Category);

        const Details = { $set: { product: req.product, Price: req.Price, category: req.Category, description: req.Category } }
        const updateDetails = collection.updateOne(filter, Details);

        return updateDetails;
    } catch (error) {
        console.log("error:" + error)
    }
}

async function addToCart(idUser, idProduct) {
    try {
        const userId = new ObjectId(idUser);
        const productId = new ObjectId(idProduct);
        const db = getDb();

        const productobj={
            item:productId,
            quantity:1
        }

        // Find the user's cart
        const cartUser = await db.collection(cart).findOne({ user: userId });

        if (cartUser) {
            // Check the product is already in the cart or not
            const productInCart = cartUser.product.find((p) => p.item.equals(productId));

            if (productInCart) {
                // console.log("Product is already in the cart.");
                await db.collection(cart).updateOne(
                    {user:userId,"product.item":productId},
                    {$inc: {"product.$.quantity":1}} 
                 )
                 console.log("incremented");
                 

            } else {
                // Add product to the existing cart
                await db.collection(cart).updateOne(
                    { user: userId },
                    { $push: { product: productobj } }
                );
                console.log("Product added to cart.");

                
            }
        } else {
            // Create a new cart and add the product
            const newCart = {
                user: userId,
                product: [productobj]
            };

            await db.collection(cart).insertOne(newCart);
            console.log("New cart created and product added.");
        }
    } catch (error) {
        console.error("An error occurred:", error);
    }
}


//fetch cart from database and used pipeline aggretion
async function viewCart(IdOfUser) {
    const userId = new ObjectId(IdOfUser)
    const db = getDb();

    const cartColletion = await db.collection(cart)

    if (!ObjectId.isValid(IdOfUser)) {
        throw new Error('Invalid cart ID');
    }


    console.log('User ID:', userId);

    const pipeline = [
        { $match: { user: userId } },    // Match documents in 'cart' collection for the given user ID
        { $unwind: '$product' },         // Unwind the 'product' field (assuming it's an array; otherwise, skip this)
        {
            $lookup: {
                from: 'allProducts',    // Updated collection name to join with
                localField: 'product.item',  // Field from 'cart' collection (product IDs)
                foreignField: '_id',    // Field from 'allProducts' collection (product IDs)
                as: 'productDetails'    // Field to add to the output documents
            }
        },
        { $unwind: '$productDetails' },   // Unwind the 'productDetails' array to get individual product documents
        {
            $project: {
                _id: 0,
                user: 1,
                'productDetails._id': 1,  // Include product ID
                'productDetails.product': 1, // Include product name
                'productDetails.category': 1, // Include product category
                'productDetails.Price': 1, // Include product price
                'productDetails.description': 1, // Include product description
                'productDetails.image': 1, // Include product image metadata
                'product.item':1,
                'product.quantity':1
            }
        }
    ];



    const documents = await cartColletion.aggregate(pipeline).toArray();
    // console.log('Aggregation Results:', documents);
    // console.log(documents);
    
    // console.log('working object');
    
    

    return documents;
}
//count to cart
async function countItems(userId) {
    const user = new ObjectId(userId)
    const db = getDb();
    const cartColletion = await db.collection(cart).findOne({ user: user })
    console.log(cartColletion);
    
    if(cartColletion===null ){
        
        console.log("empty cart");
        return 0
        
    }else{
        const len = cartColletion.product
        const number = len.length
        return number
    }

   
}
module.exports = { dataInsert, viewProducts, deleteProduct, viewOneProduct, updateProduct, addToCart, viewCart, countItems }