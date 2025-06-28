import express, { Request, Response } from "express";
import { models } from '../../db/Sequelize-models-aliases';
import sequelizeConnection from "../../db/config";
import authenticateUserToken from "../../middleWare/userAuthmiddleware";
import PujaModel, { default as Puja } from '../../db/models/pujas/PujaModel';

import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import { Op, fn, col } from "sequelize";
import sequelize from "sequelize/types/sequelize";
import { QueryTypes } from 'sequelize';
import ReviewsModel from "../../db/models/pujas/ReviewsModel";
import { PujaImagesAndVideoInput } from "../../db/models/pujas/pujaImagesAndVediosModel";


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

// Define custom file type to include the location URL from AWS S3
interface CustomFile extends Express.Multer.File {
  location: string; // Location URL of the uploaded file
}

// Set up multer storage configuration with AWS S3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.BUCKET_NAME as string,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, `puja_images/${Date.now()}_${file.originalname}`);
    },
  }),
});

const JWT_SECRET = process.env.JWT_SECRET!;




// Function to generate a custom unique ID
function generateCustomPujaId(prefix: string): string {
  const randomSuffix = Math.floor(Math.random() * 10000); // Generate a random 4-digit number
  return `${prefix}${randomSuffix}`;
}
// Function to generate a custom unique Package ID
function generateCustomPackageId(prefix: string, usedIds: Set<string>): string {
  let packageId;
  do {
    const randomSuffix = Math.floor(Math.random() * 10000);
    packageId = `${prefix}${randomSuffix}`;
  } while (usedIds.has(packageId));
  usedIds.add(packageId);
  return packageId;
}

const createPuja = express.Router();


createPuja.post(
  "/createPuja",
  authenticateUserToken,
  upload.fields([
    { name: "puja_thumbnail_url", maxCount: 1 },
    { name: "temple_image_url", maxCount: 5 },
    { name: "puja_media", maxCount: 10 },
  ]),
  async (req: any, res: any) => {
    const transaction = await sequelizeConnection.transaction();
    let isCommitted = false;

    try {
      const {
        puja_name,
        puja_special,
        puja_description,
        temple_name,
        temple_location,
        temple_description,
        packages: packagesString,
        puja_dates: pujaDatesString,
        created_by,
        benefits,
      } = req.body;

      if (!puja_name || !temple_name || !temple_location) {
        return res.status(400).json({
          error: "Missing required fields: puja_name, temple_name, temple_location",
        });
      }

      const packagesData = packagesString ? JSON.parse(packagesString) : [];
      const puja_dates = pujaDatesString ? JSON.parse(pujaDatesString) : [];

      if (!Array.isArray(puja_dates) || puja_dates.length === 0) {
        return res.status(400).json({
          error: "Invalid puja_dates format. Must be a non-empty array.",
        });
      }

      let benefitsArray: { benefit_heading: string; benefit_name: string }[] = [];
      if (typeof benefits === "string") {
        try {
          benefitsArray = JSON.parse(benefits);
        } catch {
          return res.status(400).json({
            error: "Invalid format for benefits",
            details: "Could not parse benefits data.",
          });
        }
      } else if (Array.isArray(benefits)) {
        benefitsArray = benefits;
      }

      const puja_thumbnail_url =
        req.files?.["puja_thumbnail_url"]?.[0]?.location || null;
      const temple_image_url =
        req.files?.["temple_image_url"]?.[0]?.location || null;

      const mediaFiles = req.files?.["puja_media"] || [];
      const image_urls = mediaFiles
        .filter((f: any) => f.mimetype.startsWith("image/"))
        .map((f: any) => f.location);
      const video_urls = mediaFiles
        .filter((f: any) => f.mimetype.startsWith("video/"))
        .map((f: any) => f.location);

      const customPujaId = generateCustomPujaId("KSP");
      const newPuja = await models.PujaModel.create(
        {
          puja_id: customPujaId,
          puja_name,
          puja_special,
          puja_description,
          temple_name,
          temple_location,
          puja_thumbnail_url,
          temple_image_url,
          temple_description,
          created_by: created_by || null,
        },
        { transaction }
      );

      const pujaDatesToInsert = puja_dates.map((date: string) => ({
        puja_id: newPuja.puja_id,
        puja_date: new Date(date),
        created_by: created_by || null,
      }));
      await models.PujaDatesModel.bulkCreate(pujaDatesToInsert, { transaction });

      const createdPackages: any[] = [];
      const usedPackageIds = new Set<string>();

      for (const puja_date of puja_dates) {
        const pujaDateStr = new Date(puja_date).toISOString().split("T")[0];

        for (const pkg of packagesData) {
          const packageId = generateCustomPackageId("PKG", usedPackageIds);
          const priceForDate = pkg.price[pujaDateStr];

          if (priceForDate == null) {
            throw new Error(
              `Price missing for date ${pujaDateStr} in package ${pkg.package_name}`
            );
          }

          const createdPackage = await models.PujaPackagesModel.create(
            {
              package_name: pkg.package_name,
              price: priceForDate,
              number_of_devotees: pkg.number_of_devotees,
              package_description: pkg.package_description || null,
              puja_speciality: pkg.puja_speciality || null,
              puja_id: newPuja.puja_id,
              package_id: packageId,
              puja_date: new Date(puja_date),
              created_by: created_by || null,
            },
            { transaction }
          );

          createdPackages.push(createdPackage);

          if (pkg.features?.length) {
            const featuresToInsert = pkg.features.map((feature: string) => ({
              puja_id: newPuja.puja_id,
              package_id: createdPackage.package_id,
              feature,
              created_by: created_by || null,
            }));
            await models.PackageFeaturesModel.bulkCreate(featuresToInsert, {
              transaction,
            });
          }
        }
      }

      if (benefitsArray.length > 0) {
        const benefitsToInsert = benefitsArray.map((benefit: { benefit_heading: string; benefit_name: string }) => ({
          puja_id: newPuja.puja_id,
          benefit_heading: benefit.benefit_heading,
          benefit_name: benefit.benefit_name,
          created_by: created_by || null,
        }));
        await models.PujaBenefitsModel.bulkCreate(benefitsToInsert, { transaction });
      }

      const mediaEntries: PujaImagesAndVideoInput[] = [];
      for (const image of image_urls) {
        mediaEntries.push({
          puja_id: newPuja.puja_id,
          puja_images_url: [image],
          puja_video_url: null,
          media_type: "image",
          created: created_by || null,
        });
      }
      for (const video of video_urls) {
        mediaEntries.push({
          puja_id: newPuja.puja_id,
          puja_images_url: null,
          puja_video_url: [video],
          media_type: "video",
          created: created_by || null,
        });
      }

      if (mediaEntries.length > 0) {
        await models.PujaImagesAndVideoModel.bulkCreate(mediaEntries, { transaction });
      }

      await transaction.commit();
      isCommitted = true;

      res.status(200).json({
        success: true,
        message: "Puja created successfully",
        data: newPuja,
      });
    } catch (error: any) {
      if (!isCommitted) await transaction.rollback();
      res.status(500).json({ error: "Database error", details: error.message });
    }
  }
);


createPuja.put(
  "/updatePuja/:id",
  authenticateUserToken,
  upload.fields([
    { name: "puja_thumbnail_url", maxCount: 1 },
    { name: "temple_image_url", maxCount: 1 },
    { name: "puja_media", maxCount: 10 },
  ]),
  async (req: any, res: any) => {
    const transaction = await sequelizeConnection.transaction();

    try {
      const {
        puja_name,
        puja_special,
        puja_description,
        temple_name,
        temple_location,
        temple_description,
        created_by,
        benefits,
        media_ids_to_remove,
      } = req.body;

      if (!puja_name || !temple_name || !temple_location) {
        return res.status(400).json({
          error: "Missing required fields: puja_name, temple_name, temple_location",
        });
      }

      // Parse benefits if sent as string
      let benefitsArray: { benefit_heading: string; benefit_name: string }[] = [];
      if (typeof benefits === "string") {
        try {
          benefitsArray = JSON.parse(benefits);
        } catch {
          return res.status(400).json({
            error: "Invalid format for benefits",
            details: "Could not parse benefits data.",
          });
        }
      } else if (Array.isArray(benefits)) {
        benefitsArray = benefits;
      }

      const puja_thumbnail_url = req.files?.["puja_thumbnail_url"]?.[0]?.location;
      const temple_image_url = req.files?.["temple_image_url"]?.[0]?.location;

      const existingPuja = await models.PujaModel.findOne({
        where: { puja_id: req.params.id },
      });

      if (!existingPuja) {
        return res.status(404).json({ error: "Puja not found with the provided ID." });
      }

      // Update Puja
      await existingPuja.update(
        {
          puja_name,
          puja_special,
          puja_description,
          temple_name,
          temple_location,
          temple_description,
          puja_thumbnail_url: puja_thumbnail_url || existingPuja.puja_thumbnail_url,
          temple_image_url: temple_image_url || existingPuja.temple_image_url,
          created_by: created_by || existingPuja.created_by,
        },
        { transaction }
      );

      // Update Benefits
      if (benefitsArray.length > 0) {
        await models.PujaBenefitsModel.destroy({
          where: { puja_id: existingPuja.puja_id },
          transaction,
        });

        const benefitsToInsert = benefitsArray.map((benefit) => ({
          puja_id: existingPuja.puja_id,
          benefit_heading: benefit.benefit_heading,
          benefit_name: benefit.benefit_name,
          created_by: created_by || null,
        }));

        await models.PujaBenefitsModel.bulkCreate(benefitsToInsert, { transaction });
      }

      // Delete specific media if requested
      if (Array.isArray(media_ids_to_remove) && media_ids_to_remove.length > 0) {
        console.log(`[MEDIA DELETE] IDs marked for deletion:`, media_ids_to_remove);

        await models.PujaImagesAndVideoModel.destroy({
          where: {
            sr_no: media_ids_to_remove,
            puja_id: existingPuja.puja_id,
          },
          transaction,
        });
      }

      // Upload new media (do not delete existing)
      if (req.files?.["puja_media"]) {
        const mediaFiles = req.files["puja_media"];
        const mediaEntries: PujaImagesAndVideoInput[] = [];

        for (const file of mediaFiles) {
          if (file.mimetype.startsWith("image/")) {
            console.log(`[MEDIA UPLOAD] New image: ${file.location}`);
            mediaEntries.push({
              puja_id: existingPuja.puja_id,
              puja_images_url: [file.location],
              puja_video_url: null,
              media_type: "image",
              created: created_by || null,
            });
          } else if (file.mimetype.startsWith("video/")) {
            console.log(`[MEDIA UPLOAD] New video: ${file.location}`);
            mediaEntries.push({
              puja_id: existingPuja.puja_id,
              puja_images_url: null,
              puja_video_url: [file.location],
              media_type: "video",
              created: created_by || null,
            });
          }
        }

        if (mediaEntries.length > 0) {
          await models.PujaImagesAndVideoModel.bulkCreate(mediaEntries, { transaction });
        }
      }

      await transaction.commit();
      res.status(200).json({
        message: "Puja updated successfully",
        data: existingPuja,
      });
    } catch (error: any) {
      await transaction.rollback();
      res.status(500).json({ error: "Database error", details: error.message });
    }
  }
);


createPuja.delete('/media-delete/:sr_no', authenticateUserToken, async (req: any, res: any) => {
  const { sr_no } = req.params;

  try {
    const media = await models.PujaImagesAndVideoModel.findByPk(sr_no); // ✅ match by sr_no

    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    await media.destroy();

    console.log(`[MEDIA DELETE] Deleted media SR_NO: ${sr_no}`);

    res.status(200).json({
      message: 'Media deleted successfully',
      deletedId: sr_no,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete media', details: err.message });
  }
});


createPuja.put("/updatePujaPackagesAndDates/:id", authenticateUserToken, async (req: any, res: any) => {
  console.log("Received request to update Packages and Dates for Puja with ID:", req.params.id);

  const transaction = await sequelizeConnection.transaction();

  try {
    const { packages: packagesString, puja_dates: pujaDatesString, created_by } = req.body;

    const packagesData = packagesString ? JSON.parse(packagesString) : [];
    const puja_dates = pujaDatesString ? JSON.parse(pujaDatesString) : [];

    if (!Array.isArray(puja_dates) || puja_dates.length === 0) {
      return res.status(400).json({
        error: "Invalid puja_dates format. It must be a non-empty array of dates.",
      });
    }

    const existingPuja = await models.PujaModel.findOne({
      where: { puja_id: req.params.id },
    });
    if (!existingPuja) {
      return res.status(404).json({ error: "Puja not found with the provided ID." });
    }

    // Update Puja Dates
    const existingPujaDates = await models.PujaDatesModel.findAll({
      where: { puja_id: existingPuja.puja_id },
    });

    const existingPujaDatesIds = new Set(
      existingPujaDates.map((date: any) => new Date(date.puja_date).toISOString().split("T")[0])
    );

    const pujaDatesToInsert = puja_dates
      .filter((date: string) => !existingPujaDatesIds.has(new Date(date).toISOString().split("T")[0]))
      .map((date: string) => ({
        puja_id: existingPuja.puja_id,
        puja_date: new Date(date),
        created_by: created_by || null,
      }));

    await models.PujaDatesModel.destroy({
      where: {
        puja_id: existingPuja.puja_id,
        puja_date: { [Op.notIn]: puja_dates.map((date) => new Date(date)) },
      },
      transaction,
    });

    await models.PujaDatesModel.bulkCreate(pujaDatesToInsert, { transaction });

    // Update Packages
    const createdPackages: any[] = [];
    const usedPackageIds = new Set<string>();

    for (const puja_date of puja_dates) {
      let packagesForDate = packagesData.filter((pkg: any) => pkg.dates?.includes(puja_date));

      // If no specific packages for the date, fall back to all packages
      if (packagesForDate.length === 0) {
        packagesForDate = packagesData;
      }

      for (const pkg of packagesForDate) {
        const price = pkg.price?.[puja_date];

        if (!price) {
          continue; // Skip package if price for date not found
        }

        const existingPackage = await models.PujaPackagesModel.findOne({
          where: {
            puja_id: existingPuja.puja_id,
            puja_date: new Date(puja_date),
            package_name: pkg.package_name,
          },
        });

        const packageId = existingPackage ? existingPackage.package_id : generateCustomPackageId("PKG", usedPackageIds);

        const createdPackage = await models.PujaPackagesModel.upsert(
          {
            package_name: pkg.package_name,
            price: price,
            number_of_devotees: pkg.number_of_devotees,
            puja_id: existingPuja.puja_id,
            package_id: packageId,
            puja_date: new Date(puja_date),
            puja_speciality: pkg.puja_speciality || "",
            package_description: pkg.package_description || "",
          },
          { transaction }
        );

        createdPackages.push(createdPackage[0]);

        // Delete existing features first (to avoid duplicates)
        await models.PackageFeaturesModel.destroy({
          where: {
            puja_id: existingPuja.puja_id,
            package_id: createdPackage[0].package_id,
          },
          transaction,
        });

        // Insert Package Features
        if (pkg.features && pkg.features.length > 0) {
          const featuresToInsert = pkg.features.map((feature: string) => ({
            puja_id: existingPuja.puja_id,
            package_id: createdPackage[0].package_id,
            feature: feature,
            created_by: created_by || null,
          }));
          await models.PackageFeaturesModel.bulkCreate(featuresToInsert, { transaction });
        }
      }
    }

    await transaction.commit();
    console.log("Transaction committed successfully");

    res.status(200).json({
      message: "Puja packages and dates updated successfully",
      data: {
        packages: createdPackages,
        puja_dates: puja_dates,
      },
    });
  } catch (error: any) {
    await transaction.rollback();
    console.error("Transaction failed, rolling back", error);
    res.status(500).json({ error: "Database error", details: error.message });
  }
});


createPuja.get("/get-Pujas", async (_req: any, res: any) => {
  try {
    // Fetch all pujas along with associated data
    const pujas = await models.PujaModel.findAll({
      where: { status: 'active' },
      order: [['created', 'DESC']],
      include: [
        {
          model: models.PujaPackagesModel,
          as: "pujaaPacks",
          attributes: [
            "package_id",
            "package_name",
            "package_description",
            "number_of_devotees",
            "price",
            "puja_date",
            "puja_speciality",
          ],
          required: false,
          include: [
            {
              model: models.PackageFeaturesModel,
              as: "packageFeatureItems",
              attributes: ["package_id", "feature"],
              required: false,
            },
          ],
        },
        {
          model: models.PujaDatesModel,
          as: "pujaAvailableDates",
          attributes: ["puja_date"],
          required: false,
        },
        {
          model: models.PujaImagesAndVideoModel,
          as: "pujaMedia",
          attributes: ["puja_images_url", "puja_video_url"],
          required: false,
        },
        {
          model: models.ReviewsModel,
          as: "pujaReviews",
          attributes: ["rating", "review", "uploads_url", "verified_user"],
          required: false,
        },
        {
          model: models.PujaBenefitsModel,
          as: "pujaBenefitItems",
          attributes: ["benefit_heading", "benefit_name"],
          required: false,
        },
      ],
    });
    

    if (!pujas || pujas.length === 0) {
      return res.status(404).json({ error: "No pujas found" });
    }

    // ✅ Fetch total booking counts per puja_id
    const bookingCounts: any[] = await models.BookingHistoryModel.findAll({
      attributes: ["puja_id", [fn("COUNT", col("puja_id")), "total_bookings"]],
      group: ["puja_id"],
    });

    // Convert to an easy lookup map
    const bookingCountMap: Record<string, number> = {};
    bookingCounts.forEach((item: any) => {
      bookingCountMap[item.puja_id] = parseInt(
        item.getDataValue("total_bookings")
      );
    });

    // ✅ Format each puja in the result with booking count
    const formattedPujas = pujas.map((pujaData: any) => {
      const puja_id = pujaData.puja_id;
      const puja = {
        puja_id,
        puja_name: pujaData.puja_name,
        puja_special: pujaData.puja_special,
        puja_description: pujaData.puja_description,
        temple_name: pujaData.temple_name,
        temple_location: pujaData.temple_location,
        temple_description: pujaData.temple_description,
        puja_thumbnail_url: pujaData.puja_thumbnail_url,
        temple_image_url: pujaData.temple_image_url,
        status: pujaData.status,
        created_by: pujaData.created_by,
        created: pujaData.created,
        updated: pujaData.updated,
        total_rating: 0,
        reviews_count: 0,
        total_bookings: bookingCountMap[puja_id] || 0,
      };
    
      // ✅ Packages and Features
      const packages = (pujaData.pujaaPacks || []).map((pkg: any) => ({
        package_id: pkg.package_id,
        package_name: pkg.package_name,
        package_description: pkg.package_description,
        number_of_devotees: pkg.number_of_devotees,
        puja_speciality: pkg.puja_speciality,
        price: pkg.price,
        puja_date: pkg.puja_date,
        features: (pkg.packageFeatureItems || []).map((f: any) => f.feature),
      }));
    
      // ✅ Puja Dates
      const puja_dates = (pujaData.pujaAvailableDates || []).map((d: any) => {
        const dt = new Date(d.puja_date);
        return dt.toISOString().split("T")[0];
      });
    
      // ✅ Media: Images and Videos
      let image_urls: string[] = [];
      let video_urls: string[] = [];
      if (pujaData.pujaMedia?.length > 0) {
        pujaData.pujaMedia.forEach((media: any) => {
          if (media.puja_images_url)
            image_urls.push(media.puja_images_url);
          if (media.puja_video_url)
            video_urls.push(media.puja_video_url);
        });
      }
      const media = { image_urls, video_urls };
    
      // ✅ Reviews
      const reviews = (pujaData.pujaReviews || []).map((review: any) => ({
        rating: review.rating,
        review: review.review,
        uploads_url: review.uploads_url,
        verified_user: review.verified_user,
      }));
    
      const reviewsCount = reviews.length;
      const totalRating =
        reviewsCount > 0
          ? reviews.reduce(
              (acc: number, review: { rating: number }) => acc + review.rating,
              0
            ) / reviewsCount
          : 0;
    
      // ✅ Benefits
      const benefits = (pujaData.pujaBenefitItems || []).map((benefit: any) => ({
        benefit_heading: benefit.benefit_heading,
        benefit_name: benefit.benefit_name,
      }));
    
      puja.total_rating = totalRating;
      puja.reviews_count = reviewsCount;
    
      return { puja, packages, puja_dates, media, reviews, benefits };
    });
    

    res.status(200).json({
      message:
        "Puja, Packages, Dates, Features, Reviews, Benefits, and Booking Counts fetched successfully",
      data: formattedPujas,
    });
  } catch (error: any) {
    console.error("Error fetching pujas:", error);
    res.status(500).json({ error: "Database error", details: error.message });
  }
});


createPuja.get("/getPujas", async (_req: any, res: any) => {
  try {
    const pujas = await models.PujaModel.findAll({
      include: [
        {
          model: models.PujaPackagesModel,
          as: "pujaaPacks",
          attributes: [
            "package_id",
            "package_name",
            "package_description",
            "number_of_devotees",
            "price",
            "puja_date",
            "puja_speciality",
          ],
          required: false,
          include: [
            {
              model: models.PackageFeaturesModel,
              as: "packageFeatureItems",
              attributes: ["package_id", "feature"],
              required: false,
            },
          ],
        },
        {
          model: models.PujaDatesModel,
          as: "pujaAvailableDates",
          attributes: ["puja_date"],
          required: false,
        },
      ],
    });

    if (!pujas || pujas.length === 0) {
      return res.status(404).json({ error: "No pujas found" });
    }

    const bookingCounts: any[] = await models.BookingHistoryModel.findAll({
      attributes: ["puja_id", [fn("COUNT", col("puja_id")), "total_bookings"]],
      group: ["puja_id"],
    });

    const bookingCountMap: Record<string, number> = {};
    bookingCounts.forEach((item: any) => {
      bookingCountMap[item.puja_id] = parseInt(
        item.getDataValue("total_bookings")
      );
    });

    const formattedPujas = pujas.map((pujaData: any) => {
      const puja_id = pujaData.puja_id;
      const puja = {
        puja_id,
        puja_name: pujaData.puja_name,
        puja_special: pujaData.puja_special,
        puja_description: pujaData.puja_description,
        temple_name: pujaData.temple_name,
        temple_location: pujaData.temple_location,
        temple_description: pujaData.temple_description,
        puja_thumbnail_url: pujaData.puja_thumbnail_url,
        temple_image_url: pujaData.temple_image_url,
        status: pujaData.status,
        created_by: pujaData.created_by,
        created: pujaData.created,
        updated: pujaData.updated,
        total_bookings: bookingCountMap[puja_id] || 0,
      };

      const packages = (pujaData.pujaaPacks || []).map((pkg: any) => ({
        package_id: pkg.package_id,
        package_name: pkg.package_name,
        package_description: pkg.package_description,
        number_of_devotees: pkg.number_of_devotees,
        puja_speciality: pkg.puja_speciality,
        price: pkg.price,
        puja_date: pkg.puja_date,
        features: (pkg.packageFeatureItems || []).map((f: any) => f.feature),
      }));

      const puja_dates = (pujaData.pujaAvailableDates || []).map((d: any) =>
        new Date(d.puja_date).toISOString().split("T")[0]
      );

      return { puja, packages, puja_dates };
    });

    res.status(200).json({
      message: "Puja, Packages, Dates, and Booking Counts fetched successfully",
      data: formattedPujas,
    });
  } catch (error: any) {
    console.error("Error fetching pujas:", error);
    res.status(500).json({ error: "Database error", details: error.message });
  }
});


createPuja.get("/getPujasBasic", async (_req: any, res: any) => {
  try {
    const pujas = await models.PujaModel.findAll({
      where: { status: 'active' },
      attributes: ["puja_id", "puja_name"],
      include: [
        {
          model: models.PujaDatesModel,
          as: "pujaAvailableDates",
          attributes: ["puja_date"],
          required: false,
        },
      ],
      order: [["created", "DESC"]],
    });

    const formatted = pujas.map((puja: any) => {
      const dates = (puja.pujaAvailableDates || []).map((d: any) =>
        new Date(d.puja_date).toISOString().split("T")[0]
      );

      return {
        puja_id: puja.puja_id,
        puja_name: puja.puja_name,
        puja_dates: dates,
      };
    });

    res.status(200).json({ data: formatted });
  } catch (error: any) {
    console.error("Error in /getPujasBasic:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});


createPuja.get("/Pujacards", async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "6", 10); // default to 6
    const offset = (page - 1) * limit;

    const pujas = await models.PujaModel.findAndCountAll({
      where: { status: "active" },
      attributes: [
        "puja_id",
        "puja_name",
        "puja_special",
        "puja_description",
        "temple_name",
        "temple_location",
        "puja_thumbnail_url",
        "created",
      ],
      order: [["created", "DESC"]],
      offset,
      limit,
    });

    res.status(200).json({
      message: "Pujas fetched successfully",
      total: pujas.count,
      page,
      limit,
      data: pujas.rows,
    });
  } catch (error: any) {
    console.error("Error fetching pujas:", error);
    res.status(500).json({ error: "Database error", details: error.message });
  }
});


createPuja.get("/list-minimal", async (req: any, res: any) => {
  try {
    const pujas = await models.PujaModel.findAll({
      attributes: ["puja_id", "puja_name", "temple_location"],
      where: { status: "active" },
      order: [["puja_name", "ASC"]],
    });

    if (!pujas || pujas.length === 0) {
      return res.status(404).json({ error: "No pujas found" });
    }

    res.status(200).json({ message: "Minimal puja list fetched", data: pujas });
  } catch (error) {
    console.error("Error fetching minimal pujas:", error);
    res.status(500).json({ error: "Server error", details: (error as any).message });
  }
});


createPuja.get("/getPuja/:id", async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const pooja = await models.PujaModel.findOne({
      where: { puja_id: id }, // 🔁 Use actual column name instead of findByPk if not PK
      attributes: { exclude: ["createdAt", "updatedAt"] },
      include: [
        {
          model: models.PujaPackagesModel,
          as: "pujaaPacks",
          attributes: [
            "package_id",
            "package_name",
            "puja_date",
            "package_description",
            "number_of_devotees",
            "price",
            "puja_speciality",
          ],
          required: false,
          include: [
            {
              model: models.PackageFeaturesModel,
              as: "packageFeatureItems",
              attributes: ["feature"],
              required: false,
            },
          ],
        },
        {
          model: models.PujaDatesModel,
          as: "pujaAvailableDates",
          attributes: ["puja_date"],
          required: false,
        },
        {
          model: models.PujaImagesAndVideoModel,
          as: "pujaMedia",
          attributes: ["sr_no", "puja_images_url", "puja_video_url"],
          required: false,
        },
        {
          model: models.ReviewsModel,
          as: "pujaReviews",
          attributes: ["rating", "review", "uploads_url", "verified_user"],
          required: false,
        },
        {
          model: models.PujaBenefitsModel,
          as: "pujaBenefitItems",
          attributes: ["benefit_heading", "benefit_name"],
          required: false,
        },
      ],
      nest: true, // ✅ helps in structuring nested include data properly
      raw: false, // ❌ Avoid raw:true when using includes
    });

    if (!pooja) {
      return res.status(404).json({ message: "Pooja not found" });
    }

    res.status(200).json({
      message: "Pooja fetched successfully",
      data: pooja,
    });
  } catch (error: any) {
    console.error("❌ Error fetching Pooja:", error);
    res.status(500).json({ error: "Database error", details: error.message });
  }
});


createPuja.get("/get-Pujas/:id", async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const puja = await models.PujaModel.findByPk(id, {
      attributes: [
        "puja_id", "puja_name", "puja_special", "puja_description",
        "temple_name", "temple_location", "temple_description",
        "puja_thumbnail_url", "temple_image_url", "status",
        "created_by", "created", "updated"
      ],
      include: [
        {
          model: models.PujaPackagesModel,
          as: "pujaaPacks",
          attributes: [
            "package_id", "package_name", "puja_date",
            "package_description", "number_of_devotees",
            "price", "puja_speciality"
          ],
          include: [
            {
              model: models.PackageFeaturesModel,
              as: "packageFeatureItems",
              attributes: ["feature"],
              required: false,
            },
          ],
        },
        {
          model: models.PujaDatesModel,
          as: "pujaAvailableDates",
          attributes: ["puja_date"],
        },
        {
          model: models.PujaBenefitsModel,
          as: "pujaBenefitItems",
          attributes: ["benefit_heading", "benefit_name"],
        },
      ],
    });

    if (!puja) return res.status(404).json({ message: "Pooja not found" });

    res.status(200).json({ message: "Pooja fetched successfully", data: puja });
  } catch (error) {
    console.error("Error fetching puja:", error);
    res.status(500).json({ error: "Server error", details: (error as any).message });
  }
});

// createPuja.get("/getPujaReviews/:id", async (req, res) => {
//   const { id } = req.params;

//   try {
//     const reviews = await models.ReviewsModel.findAll({
//       where: { puja_id: id },
//       attributes: ["rating", "review", "uploads_url", "verified_user", "createdAt"],
//       order: [["createdAt", "DESC"]],
//       limit: 100, // or paginate later
//     });

//     res.status(200).json({ message: "Reviews fetched", data: reviews });
//   } catch (error) {
//     console.error("Error fetching reviews:", error);
//     res.status(500).json({ error: "Server error", details: (error as any).message });
//   }
// });

createPuja.get("/getPujaMedia/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const media = await models.PujaImagesAndVideoModel.findAll({
      where: { puja_id: id },
      attributes: ["sr_no", "puja_images_url", "puja_video_url"],
      order: [["sr_no", "ASC"]],
    });

    res.status(200).json({ message: "Media fetched", data: media });
  } catch (error) {
    console.error("Error fetching media:", error);
    res.status(500).json({ error: "Server error", details: (error as any).message });
  }
});


createPuja.get("/getPujas/:id", async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const puja = await models.PujaModel.findByPk(id, {
      attributes: ["puja_id", "puja_name"],
      include: [
        {
          model: models.PujaPackagesModel,
          as: "pujaaPacks",
          attributes: [
            "package_id",
            "package_name",
            "puja_date",
            "package_description",
            "number_of_devotees",
            "price",
            "puja_speciality",
          ],
          include: [
            {
              model: models.PackageFeaturesModel,
              as: "packageFeatureItems",
              attributes: ["feature"],
              required: false,
            },
          ],
        },
        {
          model: models.PujaDatesModel,
          as: "pujaAvailableDates",
          attributes: ["puja_date"],
          required: false,
        },
      ],
    });

    if (!puja) {
      return res.status(404).json({ message: "Puja not found" });
    }

    res.status(200).json({
      message: "Puja fetched successfully",
      data: puja,
    });
  } catch (error: any) {
    console.error("Error fetching Puja:", error);
    res.status(500).json({ error: "Database error", details: error.message });
  }
});

createPuja.delete("/delete-puja/:id", async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const puja = await models.PujaModel.findByPk(id);
    if (!puja) {
      return res.status(404).json({ message: "Puja not found" });
    }

    await puja.destroy();
    res.status(200).json({ message: "Puja deleted successfully" });
  } catch (error: any) {
    console.error("Error updating Pooja:", error);
    res.status(500).json({ error: "Database error", details: error.message });
  }
});


createPuja.put('/pujas/:id/status', async (req: any, res: any) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const puja = await PujaModel.findByPk(id);
    if (!puja) return res.status(404).json({ message: 'Puja not found' });

    puja.status = status;
    await puja.save();

    res.json({ message: 'Status updated successfully', puja });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

createPuja.get("/getPujass", async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 6;
    const offset = (page - 1) * limit;

    const { count, rows: pujas } = await models.PujaModel.findAndCountAll({
      where: { status: "active" },
      offset,
      limit,
      order: [["created", "DESC"]],
      attributes: [
        "puja_id",
        "puja_name",
        "puja_special",
        "puja_description",
        "temple_name",
        "temple_location",
        "puja_thumbnail_url",
      ],
    });

    const formatted = pujas.map((puja: any) => ({
      id: puja.puja_id,
      puja_name: puja.puja_name,
      puja_special: puja.puja_special,
      puja_description: puja.puja_description,
      temple_name: puja.temple_name,
      temple_location: puja.temple_location,
      puja_thumbnail_url: puja.puja_thumbnail_url,
    }));

    return res.status(200).json({
      message: "Pujas fetched successfully",
      total: count,
      page,
      limit,
      data: formatted,
    });
  } catch (error: any) {
    console.error("Error fetching pujas:", error);
    return res.status(500).json({
      error: "Something went wrong",
      details: error.message,
    });
  }
});

createPuja.get("/pujaget", async (req: any, res: any) => {
  try {
    // Fetch all pujas
    const pujas = await PujaModel.findAll({
      where: { status: "active" },
      attributes: [
        "puja_id",
        "puja_name",
        "puja_special",
        "puja_description",
        "temple_name",
        "temple_location",
        "puja_thumbnail_url",
        "temple_description",
        "temple_image_url",
        "status",
        "created",
        "updated",
      ],
      include: [
        {
          model: ReviewsModel,
          as: "pujaReviews",
          attributes: ["rating", "review_id"],
          required: false,
        },
      ],
      order: [["created", "DESC"]],
    });

    // Map each puja and calculate rating info
    const formattedPujas = pujas.map((puja: any) => {
      const reviews = puja.pujaReviews || [];
      const reviewsCount = reviews.length;
      const totalRating = reviewsCount > 0
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewsCount
        : 0;

      return {
        ...puja.toJSON(),
        total_rating: Number(totalRating.toFixed(1)),
        reviews_count: reviewsCount,
      };
    });

    return res.status(200).json({
      message: "Pujas with review summary fetched successfully",
      data: formattedPujas,
    });
  } catch (error: any) {
    console.error("Error fetching pujas:", error);
    return res
      .status(500)
      .json({ error: "Database error", details: error.message });
  }
});



createPuja.get("/basic/:id", async (req, res) => {
  const puja = await models.PujaModel.findOne({
    where: { puja_id: req.params.id },
    attributes: ["puja_id", "puja_name", "puja_description", "puja_special", "puja_thumbnail_url", "temple_name", "temple_location", "temple_description", "temple_image_url"],
  });
  res.json({ message: "Basic info fetched", data: puja });
});

createPuja.get("/packages/:id", async (req, res) => {
  const packages = await models.PujaPackagesModel.findAll({
    where: { puja_id: req.params.id },
    include: [{
      model: models.PackageFeaturesModel,
      as: "packageFeatureItems",
      attributes: ["feature"],
    }],
  });
  res.json({ message: "Packages fetched", data: packages });
});

createPuja.get("/media/:id", async (req, res) => {
  const media = await models.PujaImagesAndVideoModel.findAll({
    where: { puja_id: req.params.id },
  });
  res.json({ message: "Media fetched", data: media });
});

createPuja.get("/benefits/:id", async (req, res) => {
  const benefits = await models.PujaBenefitsModel.findAll({
    where: { puja_id: req.params.id },
  });
  res.json({ message: "Benefits fetched", data: benefits });
});

createPuja.get("/dates/:id", async (req, res) => {
  const dates = await models.PujaDatesModel.findAll({
    where: { puja_id: req.params.id },
  });
  res.json({ message: "Available dates fetched", data: dates });
});


createPuja.get("/review-stats/:id", async (req, res) => {
  try {
    const reviews = await models.ReviewsModel.findAll({
      where: {
        puja_id: req.params.id,
        review_verified: true,
      },
      attributes: ["rating"],
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    res.status(200).json({
      message: "Review stats fetched successfully",
      data: {
        totalReviews,
        averageRating: parseFloat(averageRating.toFixed(1)),
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching review stats", error: err });
  }
});


// 🔹 1. Basic Puja Info
createPuja.get("/getPujaBasic/:id", async (req: any, res: any) => {
  const { id } = req.params;
  const pooja = await models.PujaModel.findOne({
    where: { puja_id: id },
    attributes: [
      "puja_id", "puja_name", "puja_special", "puja_description",
      "temple_name", "temple_location", "temple_description",
      "temple_image_url", "puja_thumbnail_url", "status"
    ]
  });
  return pooja
    ? res.status(200).json(pooja)
    : res.status(404).json({ message: "Puja not found" });
});

// 🔹 2. Packages + Features
createPuja.get("/getPujaPackages/:id", async (req, res) => {
  const { id } = req.params;
  const packages = await models.PujaPackagesModel.findAll({
    where: { puja_id: id },
    attributes: [
      "package_id", "package_name", "package_description",
      "puja_date", "number_of_devotees", "price", "puja_speciality"
    ],
    include: [{
      model: models.PackageFeaturesModel,
      as: "packageFeatureItems",
      attributes: ["feature"],
      required: false,
    }]
  });
  res.status(200).json(packages);
});

// 🔹 3. Available Puja Dates
createPuja.get("/getPujaDates/:id", async (req, res) => {
  const { id } = req.params;
  const dates = await models.PujaDatesModel.findAll({
    where: { puja_id: id },
    attributes: ["puja_date"]
  });
  res.status(200).json(dates);
});

// 🔹 4. Puja Media (Images/Videos)
createPuja.get("/getPujaMedia/:id", async (req, res) => {
  const { id } = req.params;
  const media = await models.PujaImagesAndVideoModel.findAll({
    where: { puja_id: id },
    attributes: ["sr_no", "puja_images_url", "puja_video_url"]
  });
  res.status(200).json(media);
});

// 🔹 5. Puja Benefits
createPuja.get("/getPujaBenefits/:id", async (req, res) => {
  const { id } = req.params;
  const benefits = await models.PujaBenefitsModel.findAll({
    where: { puja_id: id },
    attributes: ["benefit_heading", "benefit_name"]
  });
  res.status(200).json(benefits);
});

// 🔹 6. Puja Reviews
createPuja.get("/getPujaReviews/:id", async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const reviews = await models.ReviewsModel.findAll({
  where: { puja_id: id },
  attributes: [
    "review_id",
    "rating",
    "review",
    "uploads_url",
    "verified_user",
    "created"
  ],
  include: [
    {
      model: models.UserModel,
      as: "reviewUser", // ✅ must match alias
      attributes: ["username"],
    }
  ],
  order: [["created", "DESC"]],
});


    return res.status(200).json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return res.status(500).json({
      message: "Failed to fetch reviews",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});






export default createPuja;
