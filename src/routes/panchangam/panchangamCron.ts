// routes/panchangamCron.ts
import express from "express";
import axios from "axios";

const PanchangamCronRouter = express.Router();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const endpoints = [
  "store-tithi-data",
  "store-nakshtra-data",
  "store-yoga-durations",
  "store-amrit-kaal",
  "store-abhijit-muhurat",
  "store-gulika-kalam",
  "store-karana-durations",
  "store-rahu-kalam",
  "store-yama-gandam",
];

PanchangamCronRouter.post("/run-all-crons", async (req, res) => {
  const results: any[] = [];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.post(`https://api.kalkiseva.com/api/v1/panchangam/${endpoint}`);
      results.push({ endpoint, status: "success", data: response.data });
    } catch (err: any) {
      results.push({ endpoint, status: "error", error: err.message });
    }

    await delay(1500); // wait 1.5s between each request to avoid overloading
  }

  res.json({ message: "All Panchangam routes executed", results });
});

export default PanchangamCronRouter;
