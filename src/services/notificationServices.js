const setNotification = require('../helpers/setNotification');
const Notification = require('../models/Notification');

module.exports.getNotifications = async (userId) => {
  return await Notification.find({ userId }).sort({ createdAt: 'desc' });
};

module.exports.sendNotification = async (req, userId, type, subType) => {
  const data = setNotification(userId, type, subType);
  const newNotification = new Notification(data);
  await newNotification.save();
  const socket = req.app.get('socket');
  socket.emit(`user-notification-${userId}`, newNotification);
  return newNotification;
};

module.exports.deleteNotification = async (type, userId) => {
  await Notification.deleteMany({ userId, type });
  return await Notification.find({ userId });
};
