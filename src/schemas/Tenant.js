const mongoose = require('mongoose');
const { validTenantStatus } = require('./enums');
const Schema = mongoose.Schema;

const tenantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    subDomain: { type: String, required: true, trim: true },
    dbURI: { type: String, required: true },
    status: { type: String, default: 'active', enum: validTenantStatus },
  },
  {
    timestamps: true,
  }
);

module.exports = tenantSchema;
