import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    phone: Number,
    role: String,
    department: String,
    age: Number,
    joinDate: String,
    salary: String,
    notes: String,
    status: String,
    teamOwner: mongoose.Schema.Types.ObjectId
})

const Team = new mongoose.model("teamMember", teamSchema)

export default Team;