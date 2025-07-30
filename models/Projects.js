import mongoose from 'mongoose';


const expenseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, required: true },
  description: { type: String, default: '' },
  invoicePath: { type: String, default: null },
  links: [ 
    {
      title: String,
      link: String
    }
   ]
}, { timestamps: true });


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
      uType: { type: String, enum: ['milestone', 'progress', 'note', 'alert'] },
      icon: { type: String, enum: ['paintbrush', 'code', 'clipboard', 'file', 'comments', 'exclamation', 'calendar'] },
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
  ],
  expenses: [expenseSchema] 
});

const Project = new mongoose.model('Project', projectSchema);

export default Project;