import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    title: String, 
    clientId: mongoose.Schema.Types.ObjectId,
    clientEmail: String,
    startDate: Date,
    deadlineDate: Date,
    priority: String,
    description: String,
    budget: Number,
    teamMembers: Array,
    tags: Array,
    fileNames: Array
});

const Project = new mongoose.model('Project', projectSchema);

export default Project;