const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const { upload, uploadBufferToCloudinary } = require('../services/uploadService');

// POST /api/admin/upload  (field name: "image")
router.post('/', adminAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }
    const url = await uploadBufferToCloudinary(req.file.buffer, 'adevosx');
    res.json({ success: true, url });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
