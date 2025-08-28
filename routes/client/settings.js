import express from 'express';
import path from 'path';
import fs from 'fs/promises'; 
import { v4 as uuidv4 } from 'uuid'; 
import sharp from 'sharp';
import crypto from 'crypto';

import { uploadProfilePic } from '../../utils/profileUpload.js';

// Model Import
import User from '../../models/User.js';
import EmailUpdate from '../../models/EmailUpdate.js';

const router = express.Router();

// function to delete old pfp

const deleteOldProfileImage = async (imagePath) => {
  if (!imagePath || imagePath.includes('/images/default-profile.jpg')) return;
  
  try {
    const fullPath = path.join(process.cwd(), 'public', imagePath);
    await fs.unlink(fullPath);
  } catch (err) {
    console.error('Error deleting old profile image:', err);
  }
};


router.get('/', async (req, res) => {
  try {
    const headerText = "Settings"
    const backBtnLink = '/dashboard'
    res.render('settings/settings', {headerText, backBtnLink});
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading settings.');
  }
});

// profiele delete route
router.get('/profilePicture/delete', async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).send('Unauthorized');
    }

    user.profilePicture = '/default/default.jpg';
    await user.save();
    
    req.flash('success', 'Successfully Deleted Your Profile Picture')
    res.redirect('/settings'); 
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});
// pls work please
router.post('/personal', uploadProfilePic.single('profileImage'), async (req, res) => {
  const user = req.user;
  const { firstName, lastName } = req.body;

 try {
    const updates = {
      firstName,
      lastName,
    };

    if (req.file) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
      await fs.mkdir(uploadDir, { recursive: true });

      const filename = `profile-${uuidv4()}.jpg`;
      const filepath = path.join(uploadDir, filename);
      const relativePath = path.join('/uploads', 'profiles', filename);

      // savew storage
      await sharp(req.file.buffer)
        .resize({
          width: 256,
          height: 256,
          fit: sharp.fit.cover,
          position: sharp.strategy.entropy,
        })
        .jpeg({
          quality: 80,
          mozjpeg: true,
        })
        .toFile(filepath);

      if (user.profileImage && !user.profileImage.includes('/images/default-profile.jpg')) {
        await deleteOldProfileImage(user.profileImage);
      }

      updates.profilePicture = relativePath;
    }

    await User.findByIdAndUpdate(user._id, updates);

    req.flash('success', 'Profile updated successfully!');
    res.redirect('/settings');
  } catch (err) {
    console.error('Profile update error:', err);

    let errorMessage = 'Failed to update profile';
    if (err.code === 'LIMIT_FILE_SIZE') {
      errorMessage = 'Image must be smaller than 2MB';
    } else if (err.message.includes('allowed')) {
      errorMessage = 'Only JPG, JPEG, and PNG images are allowed!';
    }

    req.flash('error', errorMessage);
    res.redirect('/settings');
  }
});


// email change roiute
router.post('/email/update', async (req, res)=>{
  const user = req.user;
  const newEmail = req.body.newEmail;

  try{
    if (!newEmail || !newEmail.includes('@')) {
      req.flash('error', 'Invalid email address');
      return res.redirect('/settings');
    }

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (user.lastEmailChange && user.lastEmailChange > oneWeekAgo) {
      req.flash('error', 'Email can only be changed once per weak');
      return res.redirect('/settings');
    }

    await EmailUpdate.deleteMany({ userId: user._id });
  
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minute


    await EmailUpdate.create({
      userId: user._id,
      newEmail,
      token,
      expiresAt
    })

    // email thingy will go hereeee

    const verificationLink = `https://jettcrm.thesmartscribe.com/email/verify/${token}`

    console.log(verificationLink)

    req.flash('success', 'Verification Link Sent to Your New Email')
    res.redirect('/settings')
  }catch(err){
    console.log(err)
    res.status(500).send('Internal Server Error')
  }
})


router.post('/business/update', async (req, res)=>{
  try{
    const user = await User.findOne({_id: req.user._id});

    if(!user){
      req.flash('error', 'Invalid Session')
      return res.redirect('/settings')
    }


    if (req.body.businessName && req.body.businessName.trim() !== '') {
      user.businessName = req.body.businessName;
    }

    if (req.body.businessAddress && req.body.businessAddress.trim() !== '') {
      user.businessAddress = req.body.businessAddress;
    }

    if (req.body.businessEmail && req.body.businessEmail.trim() !== '') {
      user.businessEmail = req.body.businessEmail;
    }

    await user.save();

    req.flash('success', "Business information updartes successfully!")
    res.redirect('/settings')
  }catch(err){
    console.log(err)
    res.status(500).send('Internal Server Error')
  }
})

export default router;