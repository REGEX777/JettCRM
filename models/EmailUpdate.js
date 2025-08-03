import mongoose from "mongoose";

const EmailUpdateSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    newEmail: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true }
})

const EmailUpdate = mongoose.model('EmailUpdate', EmailUpdateSchema)

export default EmailUpdate;