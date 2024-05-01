const multer = require("multer");
const appError = require("./appError");



exports.uploadFileCloud = () => {

  const storage = multer.diskStorage({});



  const multerUpload = multer({storage: storage});

  return multerUpload
};
