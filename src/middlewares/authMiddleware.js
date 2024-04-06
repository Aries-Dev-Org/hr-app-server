const jwt = require('jsonwebtoken');

module.exports.verifyTokenLink = (req, res, next) => {
  const { token } = req.body;
  jwt.verify(token, process.env.JWT_SEED, (err, user) => {
    if (err && err.name === 'TokenExpiredError')
      return res.status(403).send({ message: 'El link ha expirado' });
    if (err) return res.status(403).send({ message: 'Token inválido' });
    req.userId = user._id;
    next();
  });
};

module.exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (token) {
    jwt.verify(token, process.env.JWT_SEED, (err, user) => {
      if (err)
        return res
          .status(401)
          .send({ message: 'Token inválido. Acceso denegado.' });
      req.user = user;
      next();
    });
  } else {
    return res
      .status(401)
      .send({ message: 'La operación requiere autenticación.' });
  }
};

module.exports.verifySuperAdmin = (req, res, next) => {
  if (req.user.isSuperAdmin) {
    next();
  } else {
    return res
      .status(401)
      .send({ message: 'No estás autorizado para realizar esta acción' });
  }
};

module.exports.verifyAdmin = (req, res, next) => {
  if (req.user.isAdmin) {
    next();
  } else {
    return res
      .status(403)
      .send({ message: 'No estás autorizado para realizar esta acción.' });
  }
};
