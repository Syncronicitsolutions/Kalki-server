import express, { Request, Response } from "express";
import TemplesModel from "../../db/models/temples/TemplesModel";
import dotenv from "dotenv";
import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import TempleImagesModel from "../../db/models/temples/TempleImagesModel";
// import TemplePujaMappingModel from "../../db/models/temples/TemplePujaMappingModel";
import { models } from "../../db/Sequelize-models-aliases";
import TemplePujaMappingModel from "../../db/models/temples/TemplePujaMappingModel";

dotenv.config();

if (
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY ||
  !process.env.BUCKET_REGION ||
  !process.env.BUCKET_NAME
) {
  throw new Error("Missing necessary AWS configuration in .env file");
}

// Initialize S3 client
const s3 = new S3Client({
  region: process.env.BUCKET_REGION.trim(),
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Define custom file type to include location URL
interface CustomFile extends Express.Multer.File {
  location: string;
}

// Set up multer storage configuration with S3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.BUCKET_NAME as string,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `temple_media/${uniqueSuffix}_${file.originalname}`);
    },
  }),
});

const createTemple = express.Router();

// POST endpoint to create temple
// createTemple.post(
//   "/createTemple",
//   upload.fields([
//     { name: "temple_thumbnail", maxCount: 1 },
//     { name: "temple_media", maxCount: 10 },
//   ]),
//   async (req: any, res: any) => {
//     console.log(req.body)
//     try {
//       const {
//         temple_name,
//         temple_location,
//         temple_description,
//         phone_number,
//         email,
//         website,
//         opening_hours,
//         latitude,
//         longitude,
//         history,
//         facilities,
//         festivals,
//       } = req.body;

//       // Check for required fields
//       if (
//         !temple_name ||
//         !temple_location ||
//         !temple_description ||
//         !phone_number ||
//         !email ||
//         !latitude ||
//         !longitude
//       ) {
//         return res.status(400).json({ message: "Missing required fields" });
//       }

//       // Process uploaded files correctly
//       const temple_thumbnail = req.files?.temple_thumbnail
//         ? (req.files.temple_thumbnail[0] as CustomFile).location
//         : null;
//       const uploadedFiles = (req.files?.temple_media as CustomFile[]) || [];

//       // Store all images and videos as an array
//       const image_urls = uploadedFiles
//         .filter((file) => file.mimetype.startsWith("image/"))
//         .map((file) => file.location);
//       const video_urls = uploadedFiles
//         .filter((file) => file.mimetype.startsWith("video/"))
//         .map((file) => file.location);

//       // Parse optional fields (facilities, festivals, opening hours)
//       const parsedOpeningHours = opening_hours ? opening_hours : ""; // Don't parse it, just store it as a string
//       const parsedFacilities = facilities ? JSON.parse(facilities) : [];
//       const parsedFestivals = festivals ? JSON.parse(festivals) : [];

//       // Save the temple data in the TemplesModel
//       const temple = await TemplesModel.create({
//         temple_name,
//         temple_location,
//         temple_description,
//         phone_number,
//         email,
//         website,
//         opening_hours: parsedOpeningHours,
//         latitude,
//         longitude,
//         temple_thumbnail,
//         temple_images_url: image_urls.length > 0 ? image_urls : null,
//         temple_video_url: video_urls.length > 0 ? video_urls : null,
//         history,
//         facilities: parsedFacilities,
//         festivals: parsedFestivals,
//         status: "active", // Assuming 'active' as a default status
//       });

//       // If there are images or videos, save them in the TempleImagesModel
//       if (image_urls.length > 0 || video_urls.length > 0) {
//         await TempleImagesModel.create({
//           temple_id: temple.temple_id, // Foreign key to TemplesModel
//           image_urls,
//           video_urls,
//         });
//       }
// // Log the success response to terminal
// console.log("Temple created successfully:", temple);
//       // Return success response
//       return res
//         .status(201)
//         .json({ message: "Temple created successfully", data: temple });
//     } catch (error: any) {
//       console.error("Error creating temple:", error);
//       return res
//         .status(500)
//         .json({ error: "Database error", details: error.message });
//     }
//   }
// );

// createTemple.post(
//   "/createTemple",
//   upload.fields([
//     { name: "temple_thumbnail", maxCount: 1 },
//     { name: "temple_media", maxCount: 10 },
//   ]),
//   async (req: any, res: any) => {
//     try {
//       const {
//         temple_name,
//         temple_location,
//         temple_description,
//         phone_number,
//         email,
//         website,
//         opening_hours,
//         latitude,
//         longitude,
//         history,
//         facilities,
//         festivals,
//         puja_ids
//       } = req.body;

//       if (
//         !temple_name || !temple_location || !temple_description ||
//         !phone_number || !email || !latitude || !longitude
//       ) {
//         return res.status(400).json({ message: "Missing required fields" });
//       }

//       // File uploads
//       const temple_thumbnail = req.files?.temple_thumbnail
//         ? req.files.temple_thumbnail[0].location
//         : null;

//       const uploadedFiles = req.files?.temple_media || [];

//       const image_urls = uploadedFiles
//         .filter((file: any) => file.mimetype.startsWith("image/"))
//         .map((file: any) => file.location);

//       const video_urls = uploadedFiles
//         .filter((file: any) => file.mimetype.startsWith("video/"))
//         .map((file: any) => file.location);

//       // Parse fields
//       const parsedFacilities = facilities ? JSON.parse(facilities) : [];
//       const parsedFestivals = festivals ? JSON.parse(festivals) : [];
//       const parsedPujaIds = puja_ids ? JSON.parse(puja_ids) : [];

//       // Save temple
//       const temple = await TemplesModel.create({
//         temple_name,
//         temple_location,
//         temple_description,
//         phone_number,
//         email,
//         website,
//         opening_hours,
//         latitude,
//         longitude,
//         history,
//         facilities: parsedFacilities,
//         festivals: parsedFestivals,
//         temple_thumbnail,
//         temple_images_url: image_urls.length ? image_urls : null,
//         temple_video_url: video_urls.length ? video_urls : null,
//         status: "active"
//       });

//       // Save images/videos in separate model
//       if (image_urls.length || video_urls.length) {
//         await TempleImagesModel.create({
//           temple_id: temple.temple_id,
//           image_urls,
//           video_urls,
//         });
//       }

//       // Save puja_ids in mapping table
//       if (parsedPujaIds.length > 0) {
//         const mappings = parsedPujaIds.map((puja_id: string) => ({
//           temple_id: temple.temple_id,
//           puja_id,
//         }));

//         console.log("Mappings to insert:", mappings);
//         await TemplePujaMappingModel.bulkCreate(mappings);

//       }

//       console.log("Temple created successfully:", temple);
//       return res.status(201).json({
//         message: "Temple created successfully",
//         data: temple,
//       });
//     } catch (error: any) {
//       console.error("Error creating temple:", error);
//       return res.status(500).json({
//         error: "Database error",
//         details: error.message,
//       });
//     }
//   }
// );

createTemple.post(
  "/createTemple",
  upload.fields([
    { name: "temple_thumbnail", maxCount: 1 },
    { name: "temple_media", maxCount: 10 },
  ]),
  async (req: any, res: any) => {
    try {
      const {
        temple_name,
        temple_location,
        temple_description,
        phone_number,
        email,
        website,
        opening_hours,
        latitude,
        longitude,
        history,
        facilities,
        festivals,
        puja_ids
      } = req.body;

      // ✅ Required field check
      if (
        !temple_name || !temple_location || !temple_description ||
        !phone_number || !email || !latitude || !longitude
      ) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // ✅ File uploads
      const temple_thumbnail = req.files?.temple_thumbnail
        ? req.files.temple_thumbnail[0].location
        : null;

      const uploadedFiles = req.files?.temple_media || [];

      const image_urls = uploadedFiles
        .filter((file: any) => file.mimetype.startsWith("image/"))
        .map((file: any) => file.location);

      const video_urls = uploadedFiles
        .filter((file: any) => file.mimetype.startsWith("video/"))
        .map((file: any) => file.location);

      // ✅ Parse optional fields
      const parsedFacilities = facilities ? JSON.parse(facilities) : [];
      const parsedFestivals = festivals ? JSON.parse(festivals) : [];
      const parsedPujaIds = puja_ids ? JSON.parse(puja_ids) : [];

      console.log("📦 Parsed Puja IDs:", parsedPujaIds);

      // ✅ Save temple
      const temple = await TemplesModel.create({
        temple_name,
        temple_location,
        temple_description,
        phone_number,
        email,
        website,
        opening_hours,
        latitude,
        longitude,
        history,
        facilities: parsedFacilities,
        festivals: parsedFestivals,
        temple_thumbnail,
        temple_images_url: image_urls.length ? image_urls : null,
        temple_video_url: video_urls.length ? video_urls : null,
        status: "active"
      });

      console.log("✅ Temple created with ID:", temple.temple_id);

      // ✅ Save media
      if (image_urls.length || video_urls.length) {
        await TempleImagesModel.create({
          temple_id: temple.temple_id,
          image_urls,
          video_urls,
        });
        console.log("🖼️ Temple media saved.");
      }

      // ✅ Save puja mappings
      if (parsedPujaIds.length > 0) {
        const mappings = parsedPujaIds.map((puja_id: string) => ({
          temple_id: Number(temple.temple_id), // ✅ Ensure number type
          puja_id,
        }));

        console.log("📌 Mappings to insert:", mappings);

        try {
          await TemplePujaMappingModel.bulkCreate(mappings, {
            ignoreDuplicates: true,
          });
          console.log("✅ Mappings inserted successfully");
        } catch (mapError) {
          console.error("❌ Error inserting mappings:", mapError);
          return res.status(500).json({
            error: "Failed to insert puja mappings",
            details: (mapError as Error).message,
          });
        }
      } else {
        console.log("⚠️ No Puja IDs provided. Skipping mapping.");
      }

      return res.status(201).json({
        message: "Temple created successfully",
        data: temple,
      });
    } catch (error: any) {
      console.error("❌ Error creating temple:", error);
      return res.status(500).json({
        error: "Database error",
        details: error.message,
        stack: error.stack, // ⚠️ include temporarily for full trace
      });
    }
  }
);



// createTemple.put(
//   "/updateTemple/:id",
//   upload.fields([
//     { name: "temple_thumbnail", maxCount: 1 },
//     { name: "temple_media", maxCount: 10 },
//   ]),
//   async (req: any, res: any) => {
//     try {
//       const {
//         temple_name,
//         temple_location,
//         temple_description,
//         phone_number,
//         email,
//         website,
//         opening_hours,
//         latitude,
//         longitude,
//         history,
//         facilities,
//         festivals,
//       } = req.body;

//       // Check for required fields
//       if (
//         !temple_name ||
//         !temple_location ||
//         !temple_description ||
//         !phone_number ||
//         !email ||
//         !latitude ||
//         !longitude
//       ) {
//         return res.status(400).json({ message: "Missing required fields" });
//       }

//       // Fetch the existing temple by ID
//       const temple = await TemplesModel.findOne({
//         where: { temple_id: req.params.id },
//       });
//       if (!temple) {
//         return res.status(404).json({ message: "Temple not found" });
//       }

//       // Process uploaded files correctly
//       const temple_thumbnail = req.files?.temple_thumbnail
//         ? (req.files.temple_thumbnail[0] as CustomFile).location
//         : temple.temple_thumbnail;
//       const uploadedFiles = (req.files?.temple_media as CustomFile[]) || [];

//       // Store all images and videos as an array
//       const image_urls = uploadedFiles
//         .filter((file) => file.mimetype.startsWith("image/"))
//         .map((file) => file.location);
//       const video_urls = uploadedFiles
//         .filter((file) => file.mimetype.startsWith("video/"))
//         .map((file) => file.location);

//       // Parse optional fields (facilities, festivals, opening hours)
//       const parsedOpeningHours = opening_hours
//         ? opening_hours
//         : temple.opening_hours; // Default to existing opening hours if not provided
//       const parsedFacilities = facilities
//         ? JSON.parse(facilities)
//         : temple.facilities;
//       const parsedFestivals = festivals
//         ? JSON.parse(festivals)
//         : temple.festivals;

//       // Update the temple data in the TemplesModel
//       await temple.update({
//         temple_name,
//         temple_location,
//         temple_description,
//         phone_number,
//         email,
//         website,
//         opening_hours: parsedOpeningHours,
//         latitude,
//         longitude,
//         temple_thumbnail,
//         history,
//         facilities: parsedFacilities,
//         festivals: parsedFestivals,
//         status: "active", // Assuming 'active' as a default status
//       });

//       // If there are new images or videos, update them in the TempleImagesModel
//       if (image_urls.length > 0 || video_urls.length > 0) {
//         // Ensure temple_images_url and temple_video_url fields are arrays of strings
//         await TempleImagesModel.upsert({
//           temple_id: temple.temple_id, // Foreign key to TemplesModel
//           image_urls: image_urls.length > 0 ? image_urls : [], // Use empty array if no images
//           video_urls: video_urls.length > 0 ? video_urls : [], // Use empty array if no videos
//         });
//       }

//       // Return success response
//       return res
//         .status(200)
//         .json({ message: "Temple updated successfully", data: temple });
//     } catch (error: any) {
//       console.error("Error updating temple:", error);
//       return res
//         .status(500)
//         .json({ error: "Database error", details: error.message });
//     }
//   }
// );

// Define the 'getAllTemples' route without authentication middleware

createTemple.put(
  "/updateTemple/:id",
  upload.fields([
    { name: "temple_thumbnail", maxCount: 1 },
    { name: "temple_media", maxCount: 10 },
  ]),
  async (req: any, res: any) => {
    try {
      const {
        temple_name,
        temple_location,
        temple_description,
        phone_number,
        email,
        website,
        opening_hours,
        latitude,
        longitude,
        history,
        facilities,
        festivals,
        puja_ids,
      } = req.body;

      // Validate required fields
      if (
        !temple_name || !temple_location || !temple_description ||
        !phone_number || !email || !latitude || !longitude
      ) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Find existing temple
      const temple = await TemplesModel.findByPk(req.params.id);
      if (!temple) {
        return res.status(404).json({ message: "Temple not found" });
      }

      // Parse optional fields
      const parsedFacilities = facilities ? JSON.parse(facilities) : temple.facilities;
      const parsedFestivals = festivals ? JSON.parse(festivals) : temple.festivals;
      const parsedPujaIds = puja_ids ? JSON.parse(puja_ids) : [];

      // Upload media
      const temple_thumbnail = req.files?.temple_thumbnail
        ? req.files.temple_thumbnail[0].location
        : temple.temple_thumbnail;

      const uploadedFiles = req.files?.temple_media || [];

      const image_urls = uploadedFiles
        .filter((file: any) => file.mimetype.startsWith("image/"))
        .map((file: any) => file.location);

      const video_urls = uploadedFiles
        .filter((file: any) => file.mimetype.startsWith("video/"))
        .map((file: any) => file.location);

      // Update temple
      await temple.update({
        temple_name,
        temple_location,
        temple_description,
        phone_number,
        email,
        website,
        opening_hours,
        latitude,
        longitude,
        history,
        facilities: parsedFacilities,
        festivals: parsedFestivals,
        temple_thumbnail,
        status: "active",
        // Do not update temple_images_url or video_url here directly
      });

      // Update media if new media is uploaded
      if (image_urls.length || video_urls.length) {
        await TempleImagesModel.upsert({
          temple_id: temple.temple_id,
          image_urls,
          video_urls,
        });
      }

      // Update puja mappings
      if (Array.isArray(parsedPujaIds)) {
        // Remove old mappings
        await TemplePujaMappingModel.destroy({
          where: { temple_id: temple.temple_id },
        });

        // Add new mappings
        const newMappings = parsedPujaIds.map((puja_id: string) => ({
          temple_id: temple.temple_id, // Convert temple_id to string
          puja_id,
        }));

        await TemplePujaMappingModel.bulkCreate(newMappings);
      }

      return res.status(200).json({
        message: "Temple updated successfully",
        data: temple,
      });
    } catch (error: any) {
      console.error("Error updating temple:", error);
      return res.status(500).json({
        error: "Database error",
        details: error.message,
      });
    }
  }
);


createTemple.get('/getAllTemples', async (req: any, res: any) => {
    try {
        const temples = await TemplesModel.findAll();  // Fetch all temples from the database
        return res.status(200).json({ message: 'Temples fetched successfully', data: temples });
    } catch (error: any) {
        console.error('Error fetching temples:', error);
        return res.status(500).json({ error: 'Database error', details: error.message });
    }
});

createTemple.get("/temple/:id", async (req: any, res: any) => {
  try {
    const { id } = req.params;

    // 1. Fetch temple
    const temple = await TemplesModel.findByPk(id, {
      attributes: {
        exclude: ["createdAt", "updatedAt"]
      }
    });

    if (!temple) {
      return res.status(404).json({ message: "Temple not found" });
    }

    // 2. Fetch associated images/videos from TempleImagesModel
    const media = await TempleImagesModel.findOne({
      where: { temple_id: temple.temple_id },
      attributes: ["image_urls", "video_urls"]
    });

    // 3. Fetch puja_ids from TemplePujaMappingModel
    const mappings = await TemplePujaMappingModel.findAll({
      where: { temple_id: temple.temple_id },
      attributes: ["puja_id"]
    });

    const puja_ids = mappings.map((m) => m.puja_id);

    return res.status(200).json({
      message: "Temple data fetched successfully",
      data: {
        temple,
        puja_ids
      }
    });
  } catch (error: any) {
    console.error("Error fetching temple details:", error);
    return res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
});

// createTemple.get("/temple/:id/pujas", async (req: any, res: any) => {
//   const { id } = req.params;

//   try {
//     // 1. Get mapped puja_ids for the given temple_id
//     const mappings = await TemplePujaMappingModel.findAll({
//       where: { temple_id: id },
//       attributes: ["puja_id"],
//     });

//     if (!mappings.length) {
//       return res.status(404).json({ message: "No pujas mapped to this temple." });
//     }

//     const pujaIds = mappings.map((m) => m.puja_id);

//     // 2. Fetch Puja details by IDs (no packages or dates)
//     const pujas = await models.PujaModel.findAll({
//       where: { puja_id: pujaIds },
//       attributes: [
//         "puja_id",
//         "puja_name",
//         "puja_special",
//         "puja_description",
//         "temple_location",
//         "puja_thumbnail_url",
//         "status",
//       ],
//       include: [
//         {
//           model: models.PujaPackagesModel,
//           as: "pujaaPackages",
//           required: false,
//         },
//         {
//           model: models.PujaDatesModel,
//           as: "pujaAvailableDates",
//           required: false,
//         },
//         {
//           model: models.ReviewsModel,
//           as: "pujaReviews",
//           required: false,
//           attributes: ["rating", "review", "uploads_url", "verified_user"],
//         },
//       ],
//     });

//     return res.status(200).json({
//       message: "Temple's pujas fetched successfully",
//       data: pujas,
//     });
//   } catch (error: any) {
//     console.error("Error fetching temple pujas:", error);
//     return res.status(500).json({
//       error: "Internal server error",
//       details: error.message,
//     });
//   }
// });

// createTemple.get("/temple/:id/pujas", async (req: any, res: any) => {
//   const { id } = req.params;

//   try {
//     // 1. Get mapped puja_ids for the given temple_id
//     const mappings = await TemplePujaMappingModel.findAll({
//       where: { temple_id: id },
//       attributes: ["puja_id"],
//     });

//     if (!mappings.length) {
//       return res.status(404).json({ message: "No pujas mapped to this temple." });
//     }

//     const pujaIds = mappings.map((m) => m.puja_id);

//     // 2. Fetch Puja details by IDs with minimal info
//     const pujas = await models.PujaModel.findAll({
//       where: { puja_id: pujaIds },
//       attributes: [
//         "puja_id",
//         "puja_name",
//         "puja_special",
//         "puja_description",
//         "temple_location",
//         "puja_thumbnail_url",
//         "status",
//       ],
//       include: [
//         {
//           model: models.PujaPackagesModel,
//           as: "pujaaPacks",
//           required: false,
//           attributes: ["package_id", "price", "puja_date"],
//         },
//         {
//           model: models.PujaDatesModel,
//           as: "pujaAvailableDates",
//           required: false,
//           attributes: ["puja_date"],
//         },
//         {
//           model: models.ReviewsModel,
//           as: "pujaReviews",
//           required: false,
//           attributes: ["rating"],
//         },
//       ],
//     });

//     // 3. Format puja with summary info
//     const formatted = pujas.map((puja: any) => {
//       const packages = puja.pujaaPackages || [];
//       const dates = puja.pujaAvailableDates || [];

//       const prices = packages.map((p: any) => Number(p.price));
//       const pujaDates = dates.map((d: any) => d.puja_date);

//       const reviewRatings = (puja.pujaReviews || []).map((r: any) => r.rating);
//       const average_rating =
//         reviewRatings.length > 0
//           ? reviewRatings.reduce((acc: number, val: number) => acc + val, 0) / reviewRatings.length
//           : 0;

//       return {
//         ...puja.toJSON(),
//         total_packages: packages.length,
//         total_puja_dates: pujaDates.length,
//         min_price: prices.length > 0 ? Math.min(...prices) : null,
//         max_price: prices.length > 0 ? Math.max(...prices) : null,
//         puja_dates: pujaDates,
//         average_rating: Number(average_rating.toFixed(1)),
//       };
//     });

//     return res.status(200).json({
//       message: "Temple's pujas fetched successfully",
//       data: formatted,
//     });
//   } catch (error: any) {
//     console.error("Error fetching temple pujas:", error);
//     return res.status(500).json({
//       error: "Internal server error",
//       details: error.message,
//     });
//   }
// });

createTemple.get("/temple/:id/pujas", async (req: any, res: any) => {
  const { id } = req.params;

  try {
    // 1. Get all puja_ids mapped to the given temple
    const mappings = await TemplePujaMappingModel.findAll({
      where: { temple_id: id },
      attributes: ["puja_id"],
    });

    if (!mappings.length) {
      return res.status(404).json({ message: "No pujas mapped to this temple." });
    }

    const pujaIds = mappings.map((m) => m.puja_id);

    // 2. Fetch minimal Puja details
    const pujas = await models.PujaModel.findAll({
      where: { puja_id: pujaIds },
      attributes: [
        "puja_id",
        "puja_name",
        "temple_name",
        "puja_special",
        "puja_description",
        "temple_location",
        "puja_thumbnail_url"
      ],
    });

    return res.status(200).json({
      message: "Temple's pujas fetched successfully",
      data: pujas,
    });
  } catch (error: any) {
    console.error("Error fetching temple pujas:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});


createTemple.get('/getTemple/:temple_id', async (req: any, res: any) => {
    try {
        const { temple_id } = req.params;

        // Fetch temple details
        const temple = await TemplesModel.findOne({ where: { temple_id } });
        if (!temple) {
            return res.status(404).json({ message: 'Temple not found' });
        }

        // Fetch associated media URLs
        const media = await TempleImagesModel.findOne({ where: { temple_id } });

        // Combine temple data with media URLs
        const responseData = {
            ...temple.dataValues,
            media_urls: media ? { image_urls: media.image_urls, video_urls: media.video_urls } : { image_urls: [], video_urls: [] },
        };

        return res.status(200).json({ message: 'Temple fetched successfully', data: responseData });
    } catch (error: any) {
        console.error('Error fetching temple:', error);
        return res.status(500).json({ error: 'Database error', details: error.message });
    }
});

//  Add media to an existing temple


// createTemple.put(
//   "/addTempleMedia/:temple_id",
//   upload.array("temple_media", 10),
//   async (req: any, res: any) => {
//     try {
//       console.log("Files received:", req.files);
//       console.log("Temple ID:", req.params.temple_id);

//       const { temple_id } = req.params;

//       //  Check if temple exists
//       let existingRecord = await TempleImagesModel.findOne({
//         where: { temple_id },
//       });

//       if (!existingRecord) {
//         existingRecord = await TempleImagesModel.create({
//           temple_id: temple_id,
//           image_urls: [],
//           video_urls: [],
//         });
//       }

//       const newImageUrls = req.files
//         .filter((file: CustomFile) => file.mimetype.startsWith("image/"))
//         .map((file: CustomFile) => file.location);
//       const newVideoUrls = req.files
//         .filter((file: CustomFile) => file.mimetype.startsWith("video/"))
//         .map((file: CustomFile) => file.location);

//       //  Append new images/videos
//       await existingRecord.update({
//         image_urls: [...existingRecord.image_urls, ...newImageUrls],
//         video_urls: [...existingRecord.video_urls, ...newVideoUrls],
//       });

//       return res
//         .status(200)
//         .json({
//           message: "Images/videos added successfully",
//           updatedRecord: existingRecord,
//         });
//     } catch (error: any) {
//       console.error("Error adding media:", error);
//       return res
//         .status(500)
//         .json({ error: "Database error", details: error.message });
//     }
//   }
// );

// createTemple.put(
//   "/updateTempleThumbnail/:temple_id",
//   upload.single("temple_thumbnail"),
//   async (req: any, res: any) => {
//     try {
//       const { temple_id } = req.params;

//       // Check if temple exists
//       const temple = await TemplesModel.findOne({ where: { temple_id } });
//       if (!temple) {
//         return res.status(404).json({ message: "Temple not found" });
//       }

//       const temple_thumbnail = req.file
//         ? (req.file as CustomFile).location
//         : temple.temple_thumbnail;

//       // Update temple with new thumbnail URL
//       await temple.update({ temple_thumbnail });

//       return res
//         .status(200)
//         .json({
//           message: "Temple thumbnail updated successfully",
//           updatedTemple: temple,
//         });
//     } catch (error: any) {
//       console.error("Error updating thumbnail:", error);
//       return res
//         .status(500)
//         .json({ error: "Database error", details: error.message });
//     }
//   }
// );

// ✅ Route to delete a temple and its media
createTemple.delete('/deleteTemple/:temple_id', async (req: any, res: any) => {
    try {
        const { temple_id } = req.params;

        // Check if temple exists
        const temple = await TemplesModel.findOne({ where: { temple_id } });
        if (!temple) {
            return res.status(404).json({ message: 'Temple not found' });
        }

        // Delete the temple media
        await TempleImagesModel.destroy({ where: { temple_id } });

        // Delete the temple
        await TemplesModel.destroy({ where: { temple_id } });

        return res.status(200).json({ message: 'Temple and its media deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting temple:', error);
        return res.status(500).json({ error: 'Database error', details: error.message });
    }
});


// PUT /api/temples/:id/status
createTemple.put('/temples/:id/status', async (req: any, res: any) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const temple = await TemplesModel.findByPk(id);
    if (!temple) {
      return res.status(404).json({ message: 'Temple not found' });
    }

    temple.status = status;
    await temple.save();

    res.json({ message: 'Temple status updated successfully', temple });
  } catch (error) {
    res.status(500).json({ message: 'Error updating temple status', error });
  }
});


// // ✅ Route to delete only media (image/video) URLs of a temple
// createTemple.delete('/deleteTempleMedia/:temple_id', async (req: any, res: any) => {
//     try {
//         const { temple_id } = req.params;

//         // Check if media exists for the temple
//         let media = await TempleImagesModel.findOne({ where: { temple_id } });
//         if (!media) {
//             return res.status(404).json({ message: 'No media found for this temple' });
//         }

//         // Update media to remove image and video URLs (you can also delete individual files if required)
//         media.image_urls = [];
//         media.video_urls = [];

//         // Save the updated media URLs
//         await media.save();

//         return res.status(200).json({ message: 'Media deleted successfully' });
//     } catch (error: any) {
//         console.error('Error deleting media:', error);
//         return res.status(500).json({ error: 'Database error', details: error.message });
//     }
// });

export default createTemple;
