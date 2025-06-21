import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
    clientName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    businessName: {
        type: String
    },
    phoneNumber: {
        type: Number
    },
    address: {
        type: String
    },
    website: String,
    notes: String
})

const Client = new mongoose.model('Client', clientSchema);

export default Client;