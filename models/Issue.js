const mongoose = require("mongoose");

const IssueSchema = mongoose.Schema({
  shortSummary: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  reporterName: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    required: true,
  },
  estimateInHours: {
    type: Number,
    default: 0,
  },
  assignees: [
    {
      id: {
        type: mongoose.Schema.Types.ObjectId,
      },
      name: {
        type: String,
      },

      projectRole: {
        type: String,
      },
      email: {
        type: String,
      },
    },
  ],
  createdOn: {
    type: Date,
    default: Date.now,
  },
  updatedOn: {
    type: Date,
  },
  closedOn: {
    type: Date,
  },

  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  status: {
    type: String,
    default: "Backlog",
  },
  comments: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      projectRole: {
        type: String,
      },
      commentBody: {
        type: String,
        required: true,
      },
      postedOn: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

module.exports = mongoose.model("issue", IssueSchema);
