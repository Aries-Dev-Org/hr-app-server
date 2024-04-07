const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const configSchema = new Schema(
  {
    viewDemands: { type: Boolean, default: true },
    viewBenefits: { type: Boolean, default: true },
    viewSearches: { type: Boolean, default: true },
    viewReport: { type: Boolean, default: true },
    viewNineBox: { type: Boolean, default: true },
    viewStatistics: { type: Boolean, default: true },
    pendingTask: { type: Object, default: null },
  },
  {
    timestamps: true,
  }
);

module.exports = configSchema;
