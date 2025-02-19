const { MongoClient } = require('mongodb');

const url = 'mongodb+srv://prethwicoc:aRAGL0wNX0I4Es16@cluster0.hreof.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const dbname = 'sample';

let db;

const client = new MongoClient(url, {
    tls: true, // Ensures TLS encryption
    tlsAllowInvalidCertificates: false, // Ensures only valid SSL certificates
    connectTimeoutMS: 10000, // Prevents long connection hangs
    serverSelectionTimeoutMS: 10000, // Avoids infinite connection attempts
    socketTimeoutMS: 20000, // Increases timeout for reliability
    retryWrites: true, // Ensures safe write operations
    useNewUrlParser: true, // MongoDB v3 compatibility (ignored in v4+)
    useUnifiedTopology: true // Deprecated but safe to keep
});

async function connectDB() {
    try {
        await client.connect();
        console.log("✅ Connected to Database");
        db = client.db(dbname);
    } catch (error) {
        console.error("❌ Connection failed:", error);
        process.exit(1); // Force exit to prevent server running without DB
    }
}

function getDb() {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db;
}

module.exports = { connectDB, getDb };
