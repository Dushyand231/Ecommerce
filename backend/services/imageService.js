const fs = require('fs');
const path = require('path');

const cloudinary = require('cloudinary').v2;
const { uploadDir } = require('../utils/upload');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function isCloudinaryConfigured() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

async function uploadImage(file, folder = 'shopsphere') {
  if (!file) return null;
  if (isCloudinaryConfigured()) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      transformation: [{ width: 1000, crop: 'limit' }],
    });
    fs.unlink(file.path, () => {});
    return result.secure_url;
  }
  return `/uploads/${file.filename}`;
}

async function deleteImage(url) {
  if (!url) return;
  if (isCloudinaryConfigured() && url.includes('res.cloudinary.com')) {
    const publicId = url.split('/').slice(-1)[0].split('.')[0];
    await cloudinary.uploader.destroy(`shopsphere/${publicId}`).catch(() => {});
    return;
  }
  if (url.startsWith('/uploads/')) {
    const filePath = path.join(uploadDir, path.basename(url));
    fs.unlink(filePath, () => {});
  }
}

module.exports = { uploadImage, deleteImage, isCloudinaryConfigured };