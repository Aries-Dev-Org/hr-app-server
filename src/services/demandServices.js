const {
  DEMAND_DONE,
  DEMAND_MODIFIED,
  NEW_DEMAND,
} = require('../constants/notificationSubTypes');
const { DEMAND } = require('../constants/notificationTypes');
const Demand = require('../models/Demand');
const { sendNotification } = require('./notificationServices');

module.exports.getDemands = async (userId) => {
  return await Demand.find({
    $or: [{ toUserId: userId }, { createUserId: userId }],
  })
    .populate({ path: 'toUserId', select: 'name lastname email avatar' })
    .populate({ path: 'createUserId', select: 'name lastname email avatar' })
    .sort({ priority: -1 });
};

module.exports.createDemand = async (req, data) => {
  const newDemand = new Demand(data);
  await newDemand.save();

  sendNotification(req, req.body.toUserId, DEMAND, NEW_DEMAND);

  return await this.getDemands(data.createUserId);
};

module.exports.updateDemand = async (req, demandId, data, userId) => {
  const updatedDemand = await Demand.findByIdAndUpdate(demandId, data, {
    new: true,
  });

  // Las notificaciones se enviaran solo si no es una solicitud autoasignada
  if (updatedDemand.toUserId !== req.user._id) {
    if (updatedDemand.state === 'done') {
      // Cuando es completada se le manda notificacion al que la creo
      sendNotification(req, updatedDemand.createUserId, DEMAND, DEMAND_DONE);
    } else {
      // Cuando es cualquier otra modificacion se le manda notificacion para el que fue creada
      sendNotification(req, updatedDemand.toUserId, DEMAND, DEMAND_MODIFIED);
    }
  }

  return await this.getDemands(userId);
};

module.exports.addNewComment = async (req, demandId, data) => {
  const commentedDemand = await Demand.findByIdAndUpdate(
    demandId,
    {
      $addToSet: { comments: data },
    },
    { new: true }
  );

  const userIdToNotify =
    commentedDemand.createUserId.toString() === data.userId
      ? commentedDemand.toUserId
      : commentedDemand.createUserId;

  sendNotification(req, userIdToNotify, DEMAND, DEMAND_MODIFIED);

  return await this.getDemands(req.user._id);
};

module.exports.demandSeen = async (demandId, userId) => {
  const updateQuery = {
    $set: {
      modifications: null,
      'comments.$[comment].read': true,
    },
  };

  const options = {
    arrayFilters: [{ 'comment.userId': { $ne: userId } }],
  };

  await Demand.updateOne({ _id: demandId }, updateQuery, options);

  return await this.getDemands(userId);
};

module.exports.deleteDemand = async (demandId, userId) => {
  await Demand.deleteOne({ _id: demandId });

  return await this.getDemands(userId);
};
