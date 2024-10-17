var express = require("express")
var { getDb } = require('./dbconnect')
const path = require('path');
const { log, count, error, time } = require("console");
const { ObjectId } = require("mongodb");
const { stringify } = require("querystring");
const { pipeline } = require("stream");
const Razorpay = require("razorpay");
const { rejects } = require("assert");

const productCollection = "allProducts"
const cart = "cart"


var instance = new Razorpay({
    key_id: 'rzp_test_sNKny4TYn0ZBL4',
    key_secret: 'Gp2XdJiQXWIa1HEyyHyh8kKA',
  });
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
        const collection = db.collection("allProducts");
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

        const productobj = {
            item: productId,
            quantity: 1
        }

        // Find the user's cart
        const cartUser = await db.collection(cart).findOne({ user: userId });

        if (cartUser) {
            // Check the product is already in the cart or not
            const productInCart = cartUser.product.find((p) => p.item.equals(productId));

            if (productInCart) {
                // console.log("Product is already in the cart.");
                await db.collection(cart).updateOne(
                    { user: userId, "product.item": productId },
                    { $inc: { "product.$.quantity": 1 } }
                )



            } else {
                // Add product to the existing cart
                await db.collection(cart).updateOne(
                    { user: userId },
                    { $push: { product: productobj } }
                );


            }
        } else {
            // Create a new cart and add the product
            const newCart = {
                user: userId,
                product: [productobj]
            };

            await db.collection(cart).insertOne(newCart);
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
                _id: 1,
                user: 1,
                'productDetails._id': 1,  // Include product ID
                'productDetails.product': 1, // Include product name
                'productDetails.category': 1, // Include product category
                'productDetails.Price': 1, // Include product price
                'productDetails.description': 1, // Include product description
                'productDetails.image': 1, // Include product image metadata
                'product.item': 1,
                'product.quantity': 1
            }
        }
    ];

    const documents = await cartColletion.aggregate(pipeline).toArray();

    return documents;
}
//count to cart
async function countItems(userId) {
    const user = new ObjectId(userId)
    const db = getDb();
    const cartColletion = await db.collection(cart).findOne({ user: user })
    if (cartColletion === null) {

        console.log("empty cart");
        return 0

    } else {
        const len = cartColletion.product
        const number = len.length
        return number
    }
}
async function removeProductFromCart(cId, pId) {

    const cartId = new ObjectId(cId)
    const productId = new ObjectId(pId)
    const db = await getDb();
    const cartCollection = await db.collection('cart').updateOne(
        { _id: cartId },
        { $pull: { product: { item: productId } } }
    )

    return cartCollection;

}
// change quantity
async function changeQuantity(req) {
    const cartId = new ObjectId(req.cartId)
    const productId = new ObjectId(req.productId)
    const count = parseInt(req.count)
    console.log("count", count);

    const db = await getDb();

    const cart = await db.collection('cart').findOne({ _id: cartId });//checking cart

    const chkproduct = cart.product.find(itemobj => itemobj.item.equals(productId));//finding product

    if (chkproduct) {
        const currentQuantity = (await db.collection('cart').findOne({ _id: cartId, "product.item": productId }, { projection: { "product.$": 1 } })).product[0].quantity;

        if (currentQuantity === 1 && count === -1) {
            

            await removeProductFromCart(cartId, productId);
            console.log("product removed", currentQuantity);

        } else {
            const cartCollection = await db.collection('cart').updateOne({ _id: cartId, "product.item": productId },
                {
                    $inc: { "product.$.quantity": count }
                }
            )


            const newQuantity = (await db.collection('cart').findOne({ _id: cartId, "product.item": productId }, { projection: { "product.$": 1 } })).product[0].quantity;
            return newQuantity;
        }
    } else {
        console.log("else lasr block");
    }
}
//total ammount
async function total(userId) {
   

    userId = new ObjectId(userId)

    const db = getDb();
    const collectionForTotal = db.collection(cart)

    const pipeline = [
        { $match: { user: userId } },
        { $unwind: '$product' },
        {
            $lookup: {
                from: 'allProducts',
                localField: 'product.item',
                foreignField: '_id',
                as: 'productDetails'
            }
        },
        { $unwind: '$productDetails' },
        {
            $project: {
                _id: 1,
                user: 1,
                'productDetails._id': 1,  // Include product ID
                'productDetails.product': 1, // Include product name
                'productDetails.category': 1, // Include product category
                'productDetails.Price': {
                    $toDouble: { $ifNull: ['$productDetails.Price', 0] }  // Convert Price to double, default to 0 if null
                },
                'productDetails.description': 1, // Include product description
                'productDetails.image': 1, // Include product image metadata
                'product.item': 1,
                'product.quantity': {
                    $toInt: { $ifNull: ['$product.quantity', 0] }  // Convert quantity to int, default to 0 if null
                }
            }
        },
        {
            $group: {
                _id: null,
                total: {
                    $sum: {
                        $multiply: ['$product.quantity', '$productDetails.Price']
                    }
                }
            }
        }

    ]
    const totalamount = await collectionForTotal.aggregate(pipeline).toArray();
    if (!totalamount.length) {
        

        return 0
    } else {
       

        return totalamount[0].total
    }
}

//fetch cart for order

async function getCart(userId) { 
    const db=await getDb();
    const cartOrder=await db.collection(cart).findOne({user:new ObjectId(userId)})
    return cartOrder
}

async function placeOrder(cartForOrder,userDetails,amt) {
   
    const now = new Date();
const formattedDate = now.toLocaleString(); // Local date and time
console.log(formattedDate);
    const status=userDetails.paymentMethod==='cod-placed'?'Cod-Placed':'pending'
    
    const orderObj={
        userId:cartForOrder.user,
        products:cartForOrder.product,
    fullName:userDetails.fullName,
    phone:userDetails.phone,
    address:userDetails.address,
    city:userDetails.city,
    postalCode:userDetails.postalCode,
    paymentStatus:status,
    deliveryStatus:'pending',
    totalamount:amt,
    time:formattedDate
}
    const db=getDb();
    const orderCollection=await db.collection('Order').insertOne(orderObj)

   const deleteCart=await db.collection(cart).deleteOne({user:new ObjectId(cartForOrder.user)})

    return orderCollection
}

async function viewMyOrders(userId) {
  const user=new ObjectId(userId);
    const db=getDb();
    const orderCollection=await db.collection('Order')//.find({userId:user}).toArray();
    
    const pipeline = [
        { $match: { userId: user } },    // Match orders by the given userId
        { $unwind: '$products' },         // Unwind the 'products' array to access each product in the order
        {
          $lookup: {
            from: 'allProducts',           // Lookup from the 'allProducts' collection
            localField: 'products.item',   // Match on the 'products.item' field (ObjectId of the product)
            foreignField: '_id',           // Join with the '_id' field in 'allProducts'
            as: 'OrderDetails'             // Alias for the joined product details
          }
        },
        { $unwind: '$OrderDetails' },     // Unwind the 'OrderDetails' array to get individual product details
        {
          $project: {
            _id: 1,                       // Include order ID
            fullName: 1,                  // Include customer name
            phone: 1,                     // Include phone number
            address: 1,                   // Include address
            city: 1,                      // Include city
            postalCode: 1,                // Include postal code
            paymentStatus: 1,                    // Include order status
            deliveryStatus:1,
            totalamount: 1,               // Include total amount
            time:1,
            'OrderDetails.product': 1,    // Include product name from 'allProducts'
            'OrderDetails.category': 1,   // Include product category from 'allProducts'
            'OrderDetails.Price': 1,      // Include product price from 'allProducts'
            'OrderDetails.image': 1,      // Include product image from 'allProducts'
            'products.quantity': 1        // Include product quantity from 'Order'
          }
        },
        {
          $group: {
            _id: '$_id',                  // Group by order ID
            fullName: { $first: '$fullName' },
            phone: { $first: '$phone' },
            address: { $first: '$address' },
            city: { $first: '$city' },
            postalCode: { $first: '$postalCode' },
            paymentStatus: { $first: '$paymentStatus' },
            deliveryStatus:{$first:'$deliveryStatus'},
            totalamount: { $first: '$totalamount' },
            time:{$first:'$time'},
            products: { $push: {
                product: '$OrderDetails.product',
                category: '$OrderDetails.category',
                price: '$OrderDetails.Price',
                image: '$OrderDetails.image',
                quantity: '$products.quantity'
              }
            } // Collect all products in an array
          }
        }
      ];

  const result = await orderCollection.aggregate(pipeline).toArray();
  
    return result
}
async function payOnlineApi(orderId,amt,userDetails){
    return new Promise((resolve,reject)=>{
        var options = {
            amount: amt*100,  // amount in the smallest currency unit
            currency: "INR",
            receipt: orderId
          };
          instance.orders.create(options, function(err, order) {
            if (err) {
              console.log(err);
              
            }else if(order){
              
              resolve(order)
          }
          });
    })

}

 function updateOrderStatus(orderId, status) {
  
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDb();
      const orderCollection = await db.collection("Order").updateOne(
        { _id: new ObjectId(orderId) }, // You can add more conditions if needed
        { $set: { paymentStatus: status } }
      );
      
      resolve(orderCollection);
    } catch (err) {
      reject(err);
    }
  });
}
async function cancelOrder(orderId) {
    return new Promise(async(resolve,reject)=>{
        const db=await getDb();
        const collection=await db.collection("Order").deleteOne({_id: new ObjectId(orderId)})
        resolve(collection)
    })
    

    
}
///////////////////////// admin 
async function orderData() {
    const db = await getDb();

    const pipeline = [
        {
            $match: { paymentStatus: { $in: ['placed', 'Cod-Placed'] }} 
        },
        { $unwind: '$products' },         // Unwind the 'products' array to access each product in the order
        {
            $lookup: {
                from: 'allProducts',       // Lookup from the 'allProducts' collection
                localField: 'products.item', // Match on the 'products.item' field (ObjectId of the product)
                foreignField: '_id',       // Join with the '_id' field in 'allProducts'
                as: 'OrderDetails'         // Alias for the joined product details
            }
        },
        { $unwind: '$OrderDetails' },     // Unwind the 'OrderDetails' array to get individual product details
        {
            $project: {
                _id: 1,                   // Include order ID
                fullName: 1,              // Include customer name
                phone: 1,                 // Include phone number
                address: 1,               // Include address
                city: 1,                  // Include city
                postalCode: 1,            // Include postal code
                paymentStatus: 1,                // Include order status
                deliveryStatus:1,
                totalamount: 1,           // Include total amount
                time: 1,                  // Include order time
                'OrderDetails.product': 1, // Include product name from 'allProducts'
                'OrderDetails.category': 1, // Include product category from 'allProducts'
                'OrderDetails.Price': 1,   // Include product price from 'allProducts'
                'OrderDetails.image': 1,   // Include product image from 'allProducts'
                'products.quantity': 1      // Include product quantity from 'Order'
            }
        },
        {
            $group: {
                _id: '$_id',              // Group by order ID
                fullName: { $first: '$fullName' },
                phone: { $first: '$phone' },
                address: { $first: '$address' },
                city: { $first: '$city' },
                postalCode: { $first: '$postalCode' },
                paymentStatus: { $first: '$paymentStatus' },
                deliveryStatus:{$first:'$deliveryStatus'},
                totalamount: { $first: '$totalamount' },
                time: { $first: '$time' },
                products: { $push: {
                    product: '$OrderDetails.product',
                    category: '$OrderDetails.category',
                    price: '$OrderDetails.Price',
                    image: '$OrderDetails.image',
                    quantity: '$products.quantity'
                }} // Collect all products in an array
            }
        }
    ];

    const orders = await db.collection('Order').aggregate(pipeline).toArray(); 
    return orders; 


}


async function updateDelivery(orderId,status) {
console.log('datas',orderId,status)
    const filter={_id:new ObjectId(orderId)}
    const updateDocument={
        $set:{ deliveryStatus:status}
    }
    const db=await getDb();
    const sts=await db.collection('Order').updateOne(filter,updateDocument)
    return sts
}

async function loginAdmin(user,password) {
    const db=await getDb();
    const login=await db.collection("admin").findOne({admin:user})
    if (login) {
        if (login.password===password) {
            return true;   
        }else{
            return "password error"
        }   
    }else{
        return "admin Not Found"
    }}

module.exports = { dataInsert, viewProducts, deleteProduct, viewOneProduct, updateProduct, addToCart, viewCart,
     countItems, changeQuantity, removeProductFromCart, total,getCart,placeOrder,viewMyOrders,payOnlineApi,updateOrderStatus,cancelOrder,
     orderData,updateDelivery,loginAdmin}