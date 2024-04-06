const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userProfileSchema = new Schema({
  label: { type: String, required: true },
  name: { type: String, required: true },
  permissions: [{ type: String, required: true }],
  forRoles: [{ type: String, required: true }],
});

module.exports = mongoose.model('UserProfile', userProfileSchema);
