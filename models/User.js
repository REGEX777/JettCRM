import mongoose from "mongoose";

const teamMembershipSchema = new mongoose.Schema({
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  role: { type: String },
  department: { type: String }
}, { _id: false });

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true },
  password:  {
    type: String,
    required: function () {
      return !this.googleId;
    }
  },
  createdAt: { type: Date, default: Date.now },
  acceptedTos: Boolean,
  admin: Boolean,
  googleId: String,

  teamOwnerOf: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  teamMemberOf: [teamMembershipSchema],
  clientOf: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }]
});

const User = mongoose.model('User', userSchema);

export default User;
