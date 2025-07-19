import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: String,
  description: String,
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  assignedTeammates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  clientEmail: String,

  status: { type: String, enum: ['active', 'completed', 'on-hold'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  deadlineDate: { type: Date, default: null },
  tasks: [
    {
      taskname: String,
      taskdescription: String,
      teammates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      deadlineDate: Date
    }
  ]
});


const Project = new mongoose.model('Project', projectSchema);

export default Project;