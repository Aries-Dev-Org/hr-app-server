const multer = require('multer');
const multerS3 = require('multer-sharp-s3');
const aws = require('aws-sdk');

const { ASSETS_URL, ASSETS_BUCKET_NAME } = process.env;

const endpoint = new aws.Endpoint(ASSETS_URL);
const s3 = new aws.S3({ endpoint });

const uploadToSpaces = (path) =>
  multer({
    storage: multerS3({
      s3,
      Bucket: ASSETS_BUCKET_NAME,
      resize: {
        width: 250,
        height: 250,
      },
      max: true,
      ACL: 'public-read',
      contentType: (_, __, cb) => {
        cb(null, 'image/jpeg');
      },
      metadata: (_, file, cb) => {
        cb(null, {
          fieldname: file.fieldname,
        });
      },
      Key: (_, file, cb) => {
        const fullPath = `${path}/${file.originalname}`;
        cb(null, fullPath);
      },
    }),
  }).single('image');

module.exports = uploadToSpaces;
