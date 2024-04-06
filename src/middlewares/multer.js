const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    req.url === '/uploadAvatar'
      ? cb(null, 'public/images/avatar')
      : cb(null, 'public/images/benefit');
  },
  filename: (req, file, cb) => cb(null, Date.now() + file.originalname),
});

const upload = multer({
  storage,
  limits: { fileSize: 1000000 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      cb(null, true);
    } else {
      const error = new Error();
      error.status = 400;
      error.message = 'El formato de la imágen no es aceptado. (jpeg jpg png)';
      cb(error, false);
    }
  },
}).single('avatar');

module.exports = upload;
