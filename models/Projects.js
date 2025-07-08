import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: String,
  description: String,
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  teamLead: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTeammates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  status: { type: String, enum: ['active', 'completed', 'on-hold'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});


const Project = new mongoose.model('Project', projectSchema);

export default Project;