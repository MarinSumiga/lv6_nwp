const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: Number,
  finishedWork: String,
  startDate: Date,
  endDate: Date,
  teamMembers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  leader: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  archived: { type: Boolean, default: false },
});

module.exports = mongoose.model("Project", ProjectSchema);
