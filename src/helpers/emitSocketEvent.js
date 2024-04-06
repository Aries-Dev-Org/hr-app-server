module.exports.emitSocketEvent = (req, eventName) => {
  const socket = req.app.get('socket');
  socket.emit(eventName);
};
