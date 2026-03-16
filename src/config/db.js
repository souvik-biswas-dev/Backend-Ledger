const mongoose = require('mongoose');

function ConnectToDB(){
    mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("DB Connected ✅");
    })
    .catch(err => {
        console.log("Error Connecting to DB ❌");
        process.exit(1);
    })
}

module.exports = ConnectToDB;