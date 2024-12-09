import mongoose, { Schema } from "mongoose"

const usersSchema = new mongoose.Schema({
    identifier: {
        type: String,
        // required: true,
        unique: true
    },
    role: {
        type: String,
        required: true,
        default: "user" 
    },
    fullName: {
        type: String,
        requried: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
    },
    phoneNumber: {
        type: String,
    },
    planType:  {
        type: String,
        
    },
    profilePic:  {
        type: String,
        default: null 
    },
    address: { 
        type: String,
        default: null 
    },
}, { timestamps: true })

export const usersModel = mongoose.model("users", usersSchema)
