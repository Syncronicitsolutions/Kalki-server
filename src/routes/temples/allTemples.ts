import express, { Request, Response } from "express";
import TemplesModel from "../../db/models/temples/TemplesModel";
import TempleImagesModel from "../../db/models/temples/TempleImagesModel";

const allTemples = express.Router();

// Define the 'getAllTemples' route without authentication middleware
allTemples.get("/getAllTemples", async (req: any, res: any) => {
  try {
    const temples = await TemplesModel.findAll(); // Fetch all temples from the database
    return res
      .status(200)
      .json({ message: "Temples fetched successfully", data: temples });
  } catch (error: any) {
    console.error("Error fetching temples:", error);
    return res
      .status(500)
      .json({ error: "Database error", details: error.message });
  }
});

allTemples.get("/getTemple/:temple_id", async (req: any, res: any) => {
  try {
    const { temple_id } = req.params;

    // Fetch temple details
    const temple = await TemplesModel.findOne({ where: { temple_id } });
    if (!temple) {
      return res.status(404).json({ message: "Temple not found" });
    }

    // Fetch associated media URLs
    const media = await TempleImagesModel.findOne({ where: { temple_id } });

    // Combine temple data with media URLs
    const responseData = {
      ...temple.dataValues,
      media_urls: media
        ? { image_urls: media.image_urls, video_urls: media.video_urls }
        : { image_urls: [], video_urls: [] },
    };

    return res
      .status(200)
      .json({ message: "Temple fetched successfully", data: responseData });
  } catch (error: any) {
    console.error("Error fetching temple:", error);
    return res
      .status(500)
      .json({ error: "Database error", details: error.message });
  }
});

// ✅ Route to delete a temple and its media
allTemples.delete("/deleteTemple/:temple_id", async (req: any, res: any) => {
  try {
    const { temple_id } = req.params;

    // Check if temple exists
    const temple = await TemplesModel.findOne({ where: { temple_id } });
    if (!temple) {
      return res.status(404).json({ message: "Temple not found" });
    }

    // Delete the temple media
    await TempleImagesModel.destroy({ where: { temple_id } });

    // Delete the temple
    await TemplesModel.destroy({ where: { temple_id } });

    return res
      .status(200)
      .json({ message: "Temple and its media deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting temple:", error);
    return res
      .status(500)
      .json({ error: "Database error", details: error.message });
  }
});

// ✅ Route to delete only media (image/video) URLs of a temple
allTemples.delete(
  "/deleteTempleMedia/:temple_id",
  async (req: any, res: any) => {
    try {
      const { temple_id } = req.params;

      // Check if media exists for the temple
      let media = await TempleImagesModel.findOne({ where: { temple_id } });
      if (!media) {
        return res
          .status(404)
          .json({ message: "No media found for this temple" });
      }

      // Update media to remove image and video URLs (you can also delete individual files if required)
      media.image_urls = [];
      media.video_urls = [];

      // Save the updated media URLs
      await media.save();

      return res.status(200).json({ message: "Media deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting media:", error);
      return res
        .status(500)
        .json({ error: "Database error", details: error.message });
    }
  }
);

export default allTemples;
