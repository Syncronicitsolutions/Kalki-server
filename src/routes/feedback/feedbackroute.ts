import { Router } from "express";
import FeedbacksModel from "../../db/models/feedback/FeedbackModel"; // Make sure path is correct!

const feedbackRouter = Router();

// POST: Submit feedback
feedbackRouter.post("/feedback-submit", async (req: any, res: any) => {
  try {
    const { username, email, rating, message } = req.body;

    if (!username || !rating) {
      return res.status(400).json({ message: "Username and rating are required" });
    }

    const newFeedback = await FeedbacksModel.create({
      username,
      email,
      rating,
      message,
    });

    res.status(201).json({ message: "Feedback submitted successfully", feedback: newFeedback });
  } catch (error) {
    console.error("❌ Feedback submit error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET: Fetch all feedbacks
feedbackRouter.get("/feedbacks", async (req: any, res: any) => {
  try {
    const feedbacks = await FeedbacksModel.findAll({
      order: [["created_at", "DESC"]], // Latest first
    });

    res.status(200).json({ message: "Feedbacks fetched successfully", data: feedbacks });
  } catch (error) {
    console.error("❌ Error fetching feedbacks:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET: Fetch feedback by ID
feedbackRouter.get("/feedback/:id", async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const feedback = await FeedbacksModel.findByPk(id);

    if (!feedback) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    res.status(200).json({ message: "Feedback fetched successfully", data: feedback });
  } catch (error) {
    console.error("❌ Error fetching feedback by ID:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default feedbackRouter;
