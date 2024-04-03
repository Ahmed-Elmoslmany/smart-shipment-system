const multer = require("multer");
const appError = require("./appError");

exports.fileValidation = {
  images: ["image/png", "image/jpg", "image/jpeg"],
};

exports.uploadFileCloud = () => {

  const storage = multer.diskStorage({});

  const fileFilter = (req, file, cb) => {
    if (!this.fileValidation.images.includes(file.mimetype)) {
      return cb(new appError("Please upload image", 300), false);
    }
    cb(null, true);
  };

  const multerUpload = multer({storage, fileFilter});

  return multerUpload
};
