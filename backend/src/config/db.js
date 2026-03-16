const mongoose = require('mongoose');

async function ConnectToDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('DB Connected ✅');
    } catch (err) {
        console.error('Error Connecting to DB ❌', err.message);
        process.exit(1);
    }

    mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected');
    });
}

module.exports = ConnectToDB;