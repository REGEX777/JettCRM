import multer from 'multer';
import path from 'path';

const profileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpg', 'image/jpeg', 'image/png'];
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  const isAllowedExt = ['.jpg', '.jpeg', '.png'].includes(extname);
  const isAllowedMime = allowedTypes.includes(mimetype);

  if (isAllowedExt && isAllowedMime) {
    return cb(null, true);
  }
  cb(new Error('Only JPG, JPEG, and PNG images are alloed!'), false);
};

export const uploadProfilePic = multer({
  storage: multer.memoryStorage(),
  fileFilter: profileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2 mb
});