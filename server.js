const app = require('./src/app');
const ConnectToDB = require('./src/config/db')
const port = process.env.PORT || 5000;

ConnectToDB();

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
})