import mongoose, { mongo } from "mongoose";

const inviteSchema = new mongoose.Schema({
  email: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  type: { type: String, enum: ['team', 'client'], required: true },

  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },  
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }, 
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  teamRole: { type: String },
  department: { type: String },

  accepted: { type: Boolean, default: false },
  linkedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now, expires: '7d' }
});


const Invite = new mongoose.model('Invite', inviteSchema);

export default Invite;