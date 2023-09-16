var multer = require("multer");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

var filefilter = function (req, file, cb) {
  if (file.originalname.match(/\.(png|jpeg|jpg)$/)) {
    return cb(null, true);
  } else {
    return cb(new Error("in image only image is allowed"));
  }
};
var upload = multer({
  storage: storage,
  limits: {
    filesize: 1024 * 1024 * 5,
  },
  fileFilter: filefilter,
});

module.exports = upload;
