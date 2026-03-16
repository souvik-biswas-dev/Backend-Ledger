const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required : [true, "Email is required"],
        trim : true,
        lowercase : true,
        match : [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please fill a valid email address"],
        unique : [true, "email already exists"]
    },
    name : {
        type : String,
        required : [true, "Name is Required"],
    },
    password: {
        type : String,
        required : [true, "Password is Required"],
        length : [6, "Password should contain more than 6 characters"],
        select: false
    }
},{
    timestamps: true
})  

userSchema.pre("save", async function(next){
    if(!this.isModified("password")){
        return
    }
    const hash = await bcrypt.hash(this.password, 15);
    this.password = hash;
    return
})

userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}

const userModel = mongoose.model("user", userSchema)

module.exports = userModel;