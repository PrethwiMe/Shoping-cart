var express = require("express");
var path = require('path');
var { dataInsert } = require('./productActions');
const { error } = require("console");
const { ObjectId } = require("mongodb");

async function addimg(req, res) {
    // Retrieve the uploaded image, if present
    const image = req.files ? req.files.image : null;

    if (image) {
//// Generate a unique identifier for the image
const _id=new ObjectId().toString();

        // Define the path to save the uploaded file
        const uploadPath = path.join(__dirname, '../public/images', _id);

        // Move the uploaded file to the specified path
        image.mv(uploadPath, async (err) => {
            if (err) {
                console.log('Failed to upload image: ' + err.message);
                return res.status(500).send('Failed to upload image');
            }

            // Prepare file metadata for MongoDB
            const fileMetadata = {
                _id: _id,
                mimetype: image.mimetype,
                size: image.size,
                path: uploadPath,
                
            };

            // Combine file metadata with other form data
            const productData = {
                ...req.body,
                image: fileMetadata
            };

            // Insert combined data into MongoDB
            try {
               const d= await dataInsert(productData);
               console.log(d);
               
                res.redirect("/admin/add-products")
            } catch (error) {
                console.log('Error inserting data: ' + error.message);
                res.status(500).send('Error inserting data');
            }
        });
    } else {
        
        res.send("No image  submitted")
    }
}

module.exports={addimg}




