/* eslint-disable indent */
const Channel = require('../models/Channel');
const Post = require('../models/Post');

// Si soy Super Admin, devuelve todos, sino solo los posts de los canales en los que estoy suscripto, o los de canales de interes gral
module.exports.getPosts = async (user, limit = 10) => {
  const userChannels = await Channel.find({
    $or: [{ subscribers: { $in: [user._id] } }, { generalInterest: true }],
  });
  const userChannelsIds = userChannels.map((uc) => uc._id);

  const condition = /* user.isSuperAdmin
    ? {}
    :  */ {
    channel: { $in: userChannelsIds },
  };

  return await Post.find(condition)
    .populate('createUserId')
    .populate('channel')
    .limit(limit)
    .sort({ createdAt: 'desc' });
};

module.exports.getChannels = async () => {
  return await Channel.find({})
    .populate({
      path: 'subscribers',
      select: '_id fullname avatar generalInterest',
    })
    .sort({ name: 'asc' });
};

module.exports.updateChannelSubscribers = async (
  action,
  usersIds,
  channelId
) => {
  const condition =
    action === 'add-users'
      ? {
          $addToSet: { subscribers: usersIds },
        }
      : { $pull: { subscribers: { $in: usersIds } } };

  return await Channel.findByIdAndUpdate(channelId, condition);
};

module.exports.updatePostReactions = async (req, res) => {
  const { postId } = req.params;
  const { emoji, unified } = req.body;
  const { _id, fullname } = req.user;

  const post = await Post.findById(postId);
  if (
    post.reactions.some(
      (r) => r.userId.toString() === _id && r.unified === unified
    )
  ) {
    return res.status(400).send({
      message: 'Ya has reaccionado de esa manera a este reconocimiento',
    });
  }

  await Post.findByIdAndUpdate(postId, {
    $addToSet: { reactions: { emoji, unified, userId: _id, fullname } },
  });
};
