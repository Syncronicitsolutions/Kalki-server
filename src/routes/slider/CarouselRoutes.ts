import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import multer from 'multer';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import CarouselModel from '../../db/models/slider/CarouselModel';
import sharp from 'sharp';

dotenv.config();

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.BUCKET_REGION || !process.env.BUCKET_NAME) {
  throw new Error('Missing AWS configuration in .env file');
}

const s3 = new S3Client({
  region: process.env.BUCKET_REGION.trim(),
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// ✅ Multer setup with better file type validation
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed.'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const CarouselRoutes = express.Router();

// ✅ POST: Upload Carousel Image
CarouselRoutes.post('/carouselUpload', upload.array('images', 10), async (req: any, res: any) => {
  try {
    const { title, description, button_text, button_link } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      const webpBuffer = await sharp(file.buffer).webp({ quality: 80 }).toBuffer();

      const timestamp = Date.now();
      const fileName = file.originalname.replace(/\.[^/.]+$/, '');
      const key = `carousel/${timestamp}_${fileName}.webp`;

      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.BUCKET_NAME!,
          Key: key,
          Body: webpBuffer,
          ContentType: 'image/webp',
         
        })
      );

      const imageUrl = `https://${process.env.BUCKET_NAME}.s3.${process.env.BUCKET_REGION}.amazonaws.com/${key}`;
      uploadedUrls.push(imageUrl);
    }

    const newCarousel = await CarouselModel.create({
      title,
      description,
      button_text,
      button_link,
      image_url: uploadedUrls,
    });

    return res.status(201).json({
      message: 'Carousel created successfully',
      data: newCarousel,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({
      error: 'Something went wrong',
      details: error.message,
    });
  }
});

// ✅ GET: All Carousels
CarouselRoutes.get('/carousels', async (_req: any, res: any) => {
  try {
    const carousels = await CarouselModel.findAll();
    return res.status(200).json({ data: carousels });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch carousels', details: error.message });
  }
});

// ✅ GET: One Carousel by ID
CarouselRoutes.get('/carousels/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const carousel = await CarouselModel.findByPk(id);
    if (!carousel) return res.status(404).json({ error: 'Carousel not found' });
    return res.status(200).json({ data: carousel });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch carousel', details: error.message });
  }
});

// ✅ DELETE: Carousel by ID
CarouselRoutes.delete('/carousels/:id', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const carousel = await CarouselModel.findByPk(id);
    if (!carousel) return res.status(404).json({ error: 'Carousel not found' });

    await carousel.destroy();
    return res.status(200).json({ message: 'Carousel deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete carousel', details: error.message });
  }
});

// ✅ Global Multer error handler middleware
CarouselRoutes.use((err: any, _req: any, res: any, _next: NextFunction) => {
  if (err instanceof multer.MulterError || err.message.includes('Invalid file type')) {
    return res.status(400).json({ error: err.message });
  }
  return res.status(500).json({ error: 'Unexpected error', details: err.message });
});

export default CarouselRoutes;
