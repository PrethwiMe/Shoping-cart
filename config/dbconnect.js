const { MongoClient } = require('mongodb');

const url = 'mongodb+srv://prethwicoc:aRAGL0wNX0I4Es16@cluster0.hreof.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&tls=true';
const dbname = 'sample';

let db;
const client = new MongoClient(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    tls: true  // Force TLS 1.2+
});

async function connectDB() {
    try {
        await client.connect();
        console.log("✅ Connected to Database");
        db = client.db(dbname);
    } catch (error) {
        console.error("❌ Connection failed:", error);
    }
}

function getDb() {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db;
}

module.exports = { connectDB, getDb };
