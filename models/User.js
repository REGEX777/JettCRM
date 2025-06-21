import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: function () {
            return !this.googleId;
        }
    },
    accountCreation:{
        type: Date,
        required: true
    },
    acceptedTos: Boolean,
    admin: Boolean,
    googleId: String
})


const User = new mongoose.model('User', userSchema);

export default User;