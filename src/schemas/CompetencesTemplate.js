/* eslint-disable max-len */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const competencesTemplateSchema = new Schema({
  name: { type: String, required: true },
  forRole: { type: String, required: true },
  competences: [{ type: Schema.ObjectId, ref: 'Competence' }],
  createUserId: { type: Schema.ObjectId, ref: 'User' },
});

module.exports = competencesTemplateSchema;
