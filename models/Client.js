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
    notes: String,
    status: String,
    projects: Number,
    ID: String,
        belongsTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // or your user model name
        required: true
    }
})

const Client = new mongoose.model('Client', clientSchema);

export default Client;