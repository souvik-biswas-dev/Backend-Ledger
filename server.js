const mongoose = require('mongoose');
const app = require('./src/app');
const ConnectToDB = require('./src/config/db');

const port = process.env.PORT || 5000;

async function startServer() {
    await ConnectToDB();

    const server = app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
        console.log(`\n${signal} received. Shutting down gracefully...`);
        server.close(async () => {
            await mongoose.connection.close();
            console.log('Server closed');
            process.exit(0);
        });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();