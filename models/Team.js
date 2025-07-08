import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
  name: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  createdAt: { type: Date, default: Date.now },
});


const Team = new mongoose.model("Team", teamSchema)

export default Team;