const mongoose = require("mongoose");

const OrganizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  organizationHead: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  organizationHeadName: {
    type: String,
    required: true,
  },
  members: [
    {
      id: {
        type: mongoose.Schema.Types.ObjectId,
      },
      name: {
        type: String,
      },
      email: {
        type: String,
        required: true,
      },
      joinedOn: {
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

module.exports = mongoose.model("organization", OrganizationSchema);
