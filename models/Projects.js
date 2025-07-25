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
  budget: Number,
  tasks: [
    {
      taskname: String,
      taskdescription: String,
      teammates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      deadlineDate: Date,
      status: {
        type: String,
        enum: ['working', 'completed', 'pending approval'],
        default: 'working'
      },
      approvalLink: String
    }
  ],
  updates: [
    {
      title: String,
      uType: { type: String, enum: ['milestone', 'progress', 'note'] },
      icon: { type: String, enum: ['paintbrush', 'code', 'clipboard', 'file', 'comments'] },
      details: String,
      relatedLinks: [
        {
          linkTitle: String,
          link: String
        }
      ],
      status: {type: String, default: null},
      createdAt: { type: Date, default: Date.now },
      feedbacks: [{
        comment: String,
        createdAt: { type: Date, default: Date.now }
      }]
    }
  ]
});

const Project = new mongoose.model('Project', projectSchema);

export default Project;