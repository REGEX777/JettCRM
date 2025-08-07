import mongoose, { mongo } from "mongoose";

const estimateSchema = new mongoose.Schema({
    items: [
        {
            name: String,
            price: Number
        }
    ],
    tax: Number,
    discount: Number,
    discountType: String,
    notes: String,
    user: {type:mongoose.Schema.Types.ObjectId, ref: 'User', required: true},

    status: {type: String, enum: ['Draft', 'Sent']},

    originalTotal: Number,
    totalAfterDiscount: Number,

    // if being sent to a client

    client: {type:mongoose.Schema.Types.ObjectId, ref: 'User', required: true}

}, {timestamps: true})


const Estimate = new mongoose.model('Estimate', estimateSchema);

export default Estimate;