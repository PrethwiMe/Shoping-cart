const mongoose = require("mongoose");

const url = 'mongodb+srv://prethwicoc:aRAGL0wNX0I4Es16@cluster0.hreof.mongodb.net/sample?retryWrites=true&w=majority&appName=Cluster0&tls=true';

let db = null; // Store the database reference

async function connectDB() {
    try {
        await mongoose.connect(url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("✅ Connected to MongoDB using Mongoose");

        db = mongoose.connection; // Assign the database connection

    } catch (error) {
        console.error("❌ MongoDB Connection Failed:", error);
        process.exit(1); // Exit process if DB connection fails
    }
}

function getDb() {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db;
}

module.exports = { connectDB, getDb };