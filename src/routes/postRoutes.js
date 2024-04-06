/* eslint-disable indent */
const postRoutes = require('express').Router();
const Channel = require('../models/Channel');
const Post = require('../models/Post');
const {
  getPosts,
  updatePostReactions,
  getChannels,
  updateChannelSubscribers,
} = require('../services/postServices');

// Obtener todos los posts (de a x)
postRoutes.get('/', async (req, res) => {
  const { limit } = req.query;
  const posts = await getPosts(req.user, limit);
  const channels = await getChannels();
  res.status(200).send({ posts, channels });
});

// Obtener todos los canales
// postRoutes.get('/channel', async (_, res) => {
//   const channels = await getChannels();
//   res.status(200).send({ channels });
// });

// Crear un canal
postRoutes.post('/channel', async (req, res) => {
  const newChannel = new Channel(req.body);
  await newChannel.save();
  const channels = await getChannels();
  res.status(201).send({
    message: 'El Canal se creó correctamente.',
    payload: { channels },
  });
});

// Crear un post
postRoutes.post('/', async (req, res) => {
  const { limit } = req.query;
  const newPost = new Post(req.body);
  await newPost.save();
  const posts = await getPosts(req.user, limit);
  res.status(201).send({
    message: 'El Post se creó correctamente.',
    payload: { posts },
  });
});

// Editar un canal
postRoutes.put('/channel/:channelId', async (req, res) => {
  const { channelId } = req.params;
  const { usersIds } = req.body;
  const { action } = req.query;

  await updateChannelSubscribers(action, usersIds, channelId);

  const posts = await getPosts(req.user);
  const channels = await getChannels();

  res.status(201).send({
    message: `Los usuarios han sido ${
      action === 'add-users' ? 'agregados' : 'eliminados'
    } correctamente`,
    payload: { posts, channels },
  });
});

// Agregar un comentario a un post
postRoutes.post('/comment/:postId', async (req, res) => {
  const { postId } = req.params;
  const { limit } = req.query;

  await Post.findByIdAndUpdate(postId, { $addToSet: { comments: req.body } });
  const posts = await getPosts(req.user, limit);

  res.status(201).send({ payload: { posts } });
});

// Agregar un like a un post
// postRoutes.post('/like/:postId', async (req, res) => {
//   const { postId } = req.params;
//   const { limit } = req.query;

//   if (req.body.liked) {
//     delete req.body.liked;
//     await Post.findByIdAndUpdate(postId, { $addToSet: { likes: req.body } });
//   } else {
//     await Post.findByIdAndUpdate(postId, {
//       $pull: { likes: { userId: req.body.userId } },
//     });
//   }
//   const posts = await getPosts(limit);

//   res.status(201).send({ payload: { posts } });
// });

// Agregar una reacción a un post
postRoutes.put('/reaction/:postId', async (req, res) => {
  const { limit } = req.query;
  await updatePostReactions(req, res);
  const posts = await getPosts(req.user, limit);
  res.status(201).send({ payload: { posts } });
});

// Eliminar un post
// postRoutes.post('/:postId', async (req, res) => {
//   const { postId } = req.params;
//   const { limit } = req.query;

//   Post.deleteOne(postId);
//   const posts = await getPosts(limit);

//   res.status(201).send({ payload: { posts } });
// });

// Obtener un post
// postRoutes.get('/:postId', async (req, res) => {
//   const { postId } = req.params;
//   const post = await Post.findOne(postId).populate('channel');
//   const channels = await getChannels();

//   res.status(200).send({ post, channels });
// });

module.exports = postRoutes;
