const User = require('../models/User');
const Recognition = require('../models/Recognition');
const { RECOGNITION } = require('../constants/notificationTypes');
const { sendNotification } = require('./notificationServices');
const { NEW_RECOGNITION } = require('../constants/notificationSubTypes');

module.exports.getRanking = async () => {
  const ranking = await User.aggregate([
    {
      $project: {
        numberOfRecognitions: { $size: '$recognitions' },
        name: '$name',
        lastname: '$lastname',
      },
    },
    {
      $match: {
        numberOfRecognitions: { $gt: 0 },
      },
    },
  ])
    .sort({ numberOfRecognitions: -1 })
    .limit(10);

  return ranking;
};

module.exports.getRecognitions = async () => {
  return await Recognition.find({})
    .sort({ createdAt: -1 })
    .populate({ path: 'recognizedUserId', select: 'name avatar' })
    .limit(12);
};

module.exports.createRecognition = async (req, res) => {
  const { recognizedUserId, standardReasons } = req.body;
  const createUserId = req.user._id;
  const createUser = await User.findById(createUserId);

  if (createUserId === recognizedUserId) {
    return res
      .status(400)
      .send({ message: 'No podés reconocerte a vos mismo' });
  }

  const recognizedUser = await User.findById(recognizedUserId);
  if (!recognizedUser) {
    return res.status(404).send({
      message: 'El usuario al que querés reconocer no se encuentra registrado',
    });
  }

  const newRecognition = new Recognition({
    createUserId,
    reason: `${req.user.name} ${req.user.lastname} reconoce a ${recognizedUser.name} ${recognizedUser.lastname} por ${standardReasons}.`,
    recognizedUserId,
  });

  await User.findByIdAndUpdate(recognizedUserId, {
    $addToSet: { recognitions: newRecognition },
  });

  await User.findByIdAndUpdate(createUserId, {
    recognitionsMade: createUser.recognitionsMade + 1,
  });

  await newRecognition.save();

  sendNotification(req, recognizedUserId, RECOGNITION, NEW_RECOGNITION);

  const recognitions = await this.getRecognitions();
  return recognitions;
};

module.exports.deleteRecognitions = async () => {
  await Recognition.deleteMany({});
  await User.updateMany({}, { $set: { recognitions: [] } });
};

module.exports.updateRecognition = async (req, res) => {
  const recognitionId = req.params.recognitionId;
  const reactionType = req.body.reactionType;
  const { _id: userId, fullname } = req.user;

  const recognition = await Recognition.findById(recognitionId);
  if (
    recognition.reactions.some(
      (r) => r.userId.toString() === userId && r.type === reactionType
    )
  ) {
    return res.status(400).send({
      message: 'Ya has reaccionado de esa manera a este reconocimiento',
    });
  }

  await Recognition.findByIdAndUpdate(recognitionId, {
    $addToSet: {
      reactions: { type: reactionType, userId, fullname },
    },
  });
};
