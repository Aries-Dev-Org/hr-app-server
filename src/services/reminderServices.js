const { emitSocketEvent } = require('../helpers/emitSocketEvent');
const Reminder = require('../models/Reminder');

module.exports.getReminders = async () => {
  return await Reminder.find({}).sort({ date: 1 });
};

module.exports.createReminder = async (req, data) => {
  const newReminder = new Reminder(data);
  await newReminder.save();
  emitSocketEvent(req, 'comunication-created');
  return this.getReminders();
};
