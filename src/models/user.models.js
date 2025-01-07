import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema= new mongoose.Schema({
    username:{
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        trim: true,
        index: true
    },
    email:{
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        trim: true,
    },
    fullname:{
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar:{
        type: String,
        required: true,
    },
    coverImage:{
        type: String,
    },
    watchHistory:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    password:{
        type: String,
        required: [true, "Password is required"]
    },
    refreshToken:{
        type: String
    }
}, {timestamps: true})

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();
    this.password=bcrypt.hash(this.password, 10)
    next()
})
// Manually typed methods so isPasswordCorrect is an custom defined method
userSchema.methods.isPasswordCorrect= async function (password) {
    return await bcrypt.compare(password, this.password)
}

// Generating Access Token
userSchema.methods.generateAccessToken=function () {
    return jwt.sign(
        {
            _id: this._id,
            fullname:this.fullname,
            email: this.email,
            username: this.username
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: ACCESS_TOKEN_EXPIRY
        }
)
}

// Generating Refresh Token
userSchema.methods.generateRefreshToken=function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: REFRESH_TOKEN_EXPIRY
        }
)
}

export const User= mongoose.model("User", userSchema)