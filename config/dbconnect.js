var { MongoClient } = require('mongodb')
const express = require("express")

const url = 'mongodb+srv://prethwicoc:<db_password>@cluster0.hreof.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const dbname = 'sample';
let db;

const client = new MongoClient(url)

async function connectDB() {

    try {
        await client.connect();
        console.log("connected to Database");

        db = client.db(dbname);


    } catch (error) {
        console.log("connection failed");

        console.log("error" + error);


    }
}

function getDb() {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db;
}

module.exports = { connectDB, getDb };
