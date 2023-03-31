const mongoose = require("mongoose");

const ProjectSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  url: {
    type: String,
  },
  projectHead: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  projectHeadName: {
    type: String,
    required: true,
  },
  deadline: {
    type: String,
  },
  clients: [
    {
      id: {
        type: mongoose.Schema.Types.ObjectId,
      },
      name: {
        type: String,
      },
      role: {
        type: String,
      },
      email: {
        type: String,
      },
      projectRole: {
        type: String,
      },
      addedOn: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  companyPeople: [
    {
      id: {
        type: mongoose.Schema.Types.ObjectId,
      },
      name: {
        type: String,
      },
      role: {
        type: String,
      },
      projectRole: {
        type: String,
      },
      email: {
        type: String,
      },
      addedOn: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdOn: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("project", ProjectSchema);
