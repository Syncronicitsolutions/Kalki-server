import { Router, Request, Response } from "express";
import axios from "axios";
import dotenv from "dotenv";
import TithiDurationsModel from "../../db/models/panchangam/ThithiModel"; // Adjust path as needed
import { TithiDurationsInput } from "../../db/models/panchangam/ThithiModel";
import { NakshatraDurationsInput } from "../../db/models/panchangam/NakshatraModel";
import NakshatraDurationsModel from '../../db/models/panchangam/NakshatraModel';
import AayanamModel, { AayanamInput } from "../../db/models/panchangam/AayanamModel";
import AbhijitMuhuratModel from "../../db/models/panchangam/AbhijitMuhuratModel";
import AmritKaalModel from "../../db/models/panchangam/AmritKaalModel";
import BrahmaMuhuratModel from "../../db/models/panchangam/BrahmaMuhuratModel";
import ChoghadiyaTimingsModel from "../../db/models/panchangam/ChoghadiyaModel";
import DurMuhuratModel from "../../db/models/panchangam/DurMuhuratModel";
import GoodBadTimesModel from "../../db/models/panchangam/GoodBadTimesModel";
import SpecificGoodBadTimingsModel from "../../db/models/panchangam/GoodBadTimingsModel";
import GulikaKalamModel from "../../db/models/panchangam/GulikaKalamModel";
import HoraTimingsModel from "../../db/models/panchangam/HoraTimingsModel";
import KaranaDurationsModel from "../../db/models/panchangam/KaranaModel";
import LunarMonthInfoModel from "../../db/models/panchangam/LunarModel";
import RahuKalamModel from "../../db/models/panchangam/RahuKalamModel";
import RituInfoModel from "../../db/models/panchangam/RituModel";
import SamvatInfoModel from "../../db/models/panchangam/SamvatModel";
import VarjyamModel from "../../db/models/panchangam/VarjyamModel";
import VedicWeekdayModel from "../../db/models/panchangam/VedicDayModel";
import YamaGandamModel from "../../db/models/panchangam/YamaGangamModel";
import YogaDurationsModel from "../../db/models/panchangam/YogaModel";
import { Op } from "sequelize";

dotenv.config();

const tithiRouter = Router();

// Helper function to generate date range for one month
const getOneMonthDates = (startDate: Date): Date[] => {
  const dates: Date[] = [];
  const endDate = new Date(startDate);
  endDate.setMonth(startDate.getMonth() + 1); // Set the end date to the same day next month

  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    dates.push(new Date(date));
  }

  return dates;
};

// Helper function to delay requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

tithiRouter.post("/store-tithi-data", async (req: any, res: any) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const datesToProcess = [
      { date: today, checkBeforeInsert: true },
      { date: tomorrow, checkBeforeInsert: false },
    ];

    const results: any[] = [];
    const errors: string[] = [];

    for (const { date, checkBeforeInsert } of datesToProcess) {
      const dateStr = date.toISOString().split("T")[0];

      if (checkBeforeInsert) {
        const exists = await TithiDurationsModel.findOne({ where: { date_observed: dateStr } });
        if (exists) {
          results.push({ date: dateStr, status: "already exists" });
          continue;
        }
      }

      const requestData = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        hours: 6,
        minutes: 0,
        seconds: 0,
        latitude: 17.38333,
        longitude: 78.4666,
        timezone: 5.5,
        config: {
          observation_point: "topocentric",
          ayanamsha: "lahiri"
        }
      };

      try {
        const response = await axios.post("https://json.freeastrologyapi.com/tithi-durations", requestData, {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.API_KEY!,
          },
        });

        const tithiData = JSON.parse(response.data.output);

        const missingFields: string[] = [];
        if (!tithiData.name) missingFields.push("name");
        if (!tithiData.paksha) missingFields.push("paksha");
        if (!tithiData.completes_at) missingFields.push("completes_at");
        if (tithiData.left_precentage === undefined) missingFields.push("left_precentage");

        if (missingFields.length > 0) {
          errors.push(`Missing required fields for ${dateStr}: ${missingFields.join(", ")}`);
          continue;
        }

        await TithiDurationsModel.create({
          number: tithiData.number ?? 0,
          name: tithiData.name,
          paksha: tithiData.paksha,
          completes_at: tithiData.completes_at,
          left_precentage: tithiData.left_precentage ?? 0,
          date_observed: dateStr,
        });

        results.push({ date: dateStr, status: "success" });

      } catch (error: any) {
        errors.push(`Error processing data for ${dateStr}: ${error.message}`);
      }

      await delay(1500);
    }

    res.status(200).json({
      message: "Tithi data storage completed",
      result: results,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    res.status(500).json({
      message: "Tithi data storage failed",
      error: error.message || "Unknown error",
    });
  }
});




tithiRouter.post("/store-nakshtra-data", async (req: any, res: any) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const datesToProcess = [
      { date: today, checkBeforeInsert: true },
      { date: tomorrow, checkBeforeInsert: false },
    ];

    const results: any[] = [];
    const errors: string[] = [];

    for (const { date, checkBeforeInsert } of datesToProcess) {
      const dateStr = date.toISOString().split("T")[0];

      if (checkBeforeInsert) {
        const exists = await NakshatraDurationsModel.findOne({ where: { date_observed: dateStr } });
        if (exists) {
          results.push({ date: dateStr, status: "already exists" });
          continue;
        }
      }

      const requestData = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        hours: 6,
        minutes: 0,
        seconds: 0,
        latitude: 17.38333,
        longitude: 78.4666,
        timezone: 5.5,
        config: {
          observation_point: "topocentric",
          ayanamsha: "lahiri"
        }
      };

      try {
        const response = await axios.post("https://json.freeastrologyapi.com/nakshatra-durations", requestData, {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.API_KEY!,
          },
        });

        const output = response.data.output;
        const nakshatraData = typeof output === "string" ? JSON.parse(output) : output;

        const missingFields: string[] = [];
        if (!nakshatraData.name) missingFields.push("name");
        if (!nakshatraData.starts_at) missingFields.push("starts_at");
        if (!nakshatraData.ends_at) missingFields.push("ends_at");
        if (nakshatraData.remaining_percentage_at_given_time === undefined) {
          missingFields.push("remaining_percentage_at_given_time");
        }

        if (missingFields.length > 0) {
          errors.push(`Missing required fields for ${dateStr}: ${missingFields.join(", ")}`);
          continue;
        }

        await NakshatraDurationsModel.create({
          number: nakshatraData.number ?? 0,
          name: nakshatraData.name,
          starts_at: nakshatraData.starts_at,
          ends_at: nakshatraData.ends_at,
          remaining_percentage_at_given_time: nakshatraData.remaining_percentage_at_given_time ?? 0,
          date_observed: dateStr,
        });

        results.push({ date: dateStr, status: "success" });

      } catch (error: any) {
        errors.push(`Error processing data for ${dateStr}: ${error.message}`);
      }

      await delay(1500);
    }

    res.status(200).json({
      message: "Nakshatra data storage completed",
      result: results,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    res.status(500).json({
      message: "Nakshatra data storage failed",
      error: error.message || "Unknown error",
    });
  }
});




tithiRouter.post("/store-aayanam-data", async (req: any, res: any) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const datesToProcess = [
      { date: today, checkBeforeInsert: true },
      { date: tomorrow, checkBeforeInsert: false },
    ];

    const results: any[] = [];
    const errors: string[] = [];

    for (const { date, checkBeforeInsert } of datesToProcess) {
      const dateStr = date.toISOString().split("T")[0];

      if (checkBeforeInsert) {
        const exists = await AayanamModel.findOne({ where: { date_observed: dateStr } });
        if (exists) {
          results.push({ date: dateStr, status: "already exists" });
          continue;
        }
      }

      const requestData = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        hours: 6,
        minutes: 0,
        seconds: 0,
        latitude: 17.38333,
        longitude: 78.4666,
        timezone: 5.5,
        config: {
          observation_point: "topocentric",
          ayanamsha: "lahiri"
        }
      };

      try {
        const response = await axios.post(
          "https://json.freeastrologyapi.com/aayanam",
          requestData,
          {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.API_KEY!,
            },
          }
        );

        const output = response.data.output;
        const aayanamData = typeof output === "string" ? JSON.parse(output) : output;

        if (!aayanamData.aayanam) {
          errors.push(`Missing aayanam for ${dateStr}`);
          continue;
        }

        await AayanamModel.create({
          aayanam: aayanamData.aayanam,
          date_observed: dateStr,
        });

        results.push({ date: dateStr, status: "success" });

      } catch (err: any) {
        const errorMsg = err?.response?.status === 429
          ? "Rate limit exceeded (429)"
          : err?.message || "Unknown error";
        errors.push(`Error on ${dateStr}: ${errorMsg}`);
      }

      await delay(1500);
    }

    res.status(200).json({
      message: "Aayanam data storage completed",
      result: results,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message || "Unknown error",
    });
  }
});





tithiRouter.post("/store-abhijit-muhurat", async (req: any, res: any) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const datesToProcess = [
      { date: today, checkBeforeInsert: true },
      { date: tomorrow, checkBeforeInsert: false },
    ];

    const results: any[] = [];
    const errors: string[] = [];

    for (const { date, checkBeforeInsert } of datesToProcess) {
      const dateStr = date.toISOString().split("T")[0];

      if (checkBeforeInsert) {
        const exists = await AbhijitMuhuratModel.findOne({ where: { date_observed: dateStr } });
        if (exists) {
          results.push({ date: dateStr, status: "already exists" });
          continue;
        }
      }

      const requestData = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        hours: 6,
        minutes: 0,
        seconds: 0,
        latitude: 17.38333,
        longitude: 78.4666,
        timezone: 5.5,
        config: {
          observation_point: "topocentric",
          ayanamsha: "lahiri"
        }
      };

      try {
        const response = await axios.post(
          "https://json.freeastrologyapi.com/abhijit-muhurat",
          requestData,
          {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.API_KEY!,
            },
          }
        );

        const muhuratData = JSON.parse(response.data.output);

        if (!muhuratData.starts_at || !muhuratData.ends_at) {
          errors.push(`Missing data for ${dateStr}`);
          continue;
        }

        await AbhijitMuhuratModel.create({
          startsAt: new Date(muhuratData.starts_at),
          endsAt: new Date(muhuratData.ends_at),
          date_observed: dateStr,
        });

        results.push({ date: dateStr, status: "success" });

      } catch (err: any) {
        const msg = err?.message || "Unknown error";
        errors.push(`Error on ${dateStr}: ${msg}`);
      }

      await delay(1500);
    }

    res.status(200).json({
      message: "Abhijit Muhurat data storage completed",
      result: results,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message || "Unknown error",
    });
  }
});




tithiRouter.post("/store-amrit-kaal", async (req: any, res: any) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const datesToProcess = [
      { date: today, checkBeforeInsert: true },
      { date: tomorrow, checkBeforeInsert: false },
    ];

    const results: any[] = [];
    const errors: string[] = [];

    for (const { date, checkBeforeInsert } of datesToProcess) {
      const dateStr = date.toISOString().split("T")[0];

      if (checkBeforeInsert) {
        const existing = await AmritKaalModel.findOne({ where: { date_observed: dateStr } });
        if (existing) {
          results.push({ date: dateStr, status: "already exists" });
          continue;
        }
      }

      const requestData = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        hours: 6,
        minutes: 0,
        seconds: 0,
        latitude: 17.38333,
        longitude: 78.4666,
        timezone: 5.5,
        config: {
          observation_point: "topocentric",
          ayanamsha: "lahiri",
        },
      };

      try {
        const response = await axios.post(
          "https://json.freeastrologyapi.com/amrit-kaal",
          requestData,
          {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.API_KEY!,
            },
          }
        );

        const amritData = JSON.parse(response.data.output);

        if (!amritData.starts_at || !amritData.ends_at) {
          errors.push(`Missing Amrit Kaal data for ${dateStr}`);
          continue;
        }

        await AmritKaalModel.create({
          date_observed: dateStr,
          startsAt: new Date(amritData.starts_at),
          endsAt: new Date(amritData.ends_at),
        });

        results.push({ date: dateStr, status: "success" });

      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || "Unknown error";
        errors.push(`Error on ${dateStr}: ${msg}`);
      }

      await delay(1500); // Respect API rate limits
    }

    res.status(200).json({
      message: "Amrit Kaal data storage completed",
      result: results,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message || "Unknown error",
    });
  }
});



tithiRouter.post("/store-brahma-muhurat", async (req: any, res: any) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const datesToProcess = [
      { date: today, checkBeforeInsert: true },
      { date: tomorrow, checkBeforeInsert: false },
    ];

    const results: any[] = [];
    const errors: string[] = [];

    for (const { date, checkBeforeInsert } of datesToProcess) {
      const dateStr = date.toISOString().split("T")[0];

      if (checkBeforeInsert) {
        const exists = await BrahmaMuhuratModel.findOne({ where: { date_observed: dateStr } });
        if (exists) {
          results.push({ date: dateStr, status: "already exists" });
          continue;
        }
      }

      const requestData = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        hours: 6,
        minutes: 0,
        seconds: 0,
        latitude: 17.38333,
        longitude: 78.4666,
        timezone: 5.5,
        config: {
          observation_point: "topocentric",
          ayanamsha: "lahiri"
        }
      };

      try {
        const response = await axios.post(
          "https://json.freeastrologyapi.com/brahma-muhurat",
          requestData,
          {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.API_KEY!,
            },
          }
        );

        const brahmaData = JSON.parse(response.data.output);

        if (!brahmaData.starts_at || !brahmaData.ends_at) {
          errors.push(`Missing Brahma Muhurat data for ${dateStr}`);
          continue;
        }

        await BrahmaMuhuratModel.create({
          startsAt: new Date(brahmaData.starts_at),
          endsAt: new Date(brahmaData.ends_at),
          date_observed: dateStr,
        });

        results.push({ date: dateStr, status: "success" });

      } catch (err: any) {
        const msg = err.message || "Unknown error";
        errors.push(`Error on ${dateStr}: ${msg}`);
      }

      await delay(1500);
    }

    res.status(200).json({
      message: "Brahma Muhurat data storage completed",
      result: results,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message || "Unknown error",
    });
  }
});



// Define interface for type safety
interface ChoghadiyaItem {
  name: string;
  starts_at: string;
  ends_at: string;
}

tithiRouter.post("/store-choghadiya-timings", async (req: any, res: any) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const datesToProcess = [
      { date: today, checkBeforeInsert: true },
      { date: tomorrow, checkBeforeInsert: false },
    ];

    const results: any[] = [];
    const errors: string[] = [];

    for (const { date, checkBeforeInsert } of datesToProcess) {
      const dateStr = date.toISOString().split("T")[0];

      if (checkBeforeInsert) {
        const exists = await ChoghadiyaTimingsModel.findOne({ where: { date_observed: dateStr } });
        if (exists) {
          results.push({ date: dateStr, status: "already exists" });
          continue;
        }
      }

      const requestData = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        hours: 6,
        minutes: 0,
        seconds: 0,
        latitude: 17.38333,
        longitude: 78.4666,
        timezone: 5.5,
        config: {
          observation_point: "topocentric",
          ayanamsha: "lahiri"
        }
      };

      try {
        const response = await axios.post(
          "https://json.freeastrologyapi.com/choghadiya-timings",
          requestData,
          {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.API_KEY!,
            },
          }
        );

        const output = response.data.output;

        if (!output) {
          errors.push(`Invalid Choghadiya data for ${dateStr}: Empty output`);
          continue;
        }

        let choghadiyaDataObj: Record<string, any>;
        try {
          choghadiyaDataObj = typeof output === "string" ? JSON.parse(output) : output;
        } catch {
          errors.push(`Invalid Choghadiya JSON for ${dateStr}`);
          continue;
        }

        const entries: ChoghadiyaItem[] = Object.values(choghadiyaDataObj) as ChoghadiyaItem[];

        let stored = false;

        for (const choghadiya of entries) {
          if (!choghadiya.name || !choghadiya.starts_at || !choghadiya.ends_at) {
            errors.push(`Missing fields in Choghadiya item for ${dateStr}`);
            continue;
          }

          await ChoghadiyaTimingsModel.create({
            name: choghadiya.name,
            startsAt: new Date(choghadiya.starts_at),
            endsAt: new Date(choghadiya.ends_at),
            date_observed: dateStr,
          });

          stored = true;
        }

        if (stored) {
          results.push({ date: dateStr, status: "success" });
        } else {
          errors.push(`All Choghadiya items invalid for ${dateStr}`);
        }

      } catch (err: any) {
        let errorMsg = err.response?.data?.message || err.message || "Unknown error";
        errors.push(`Error on ${dateStr}: ${errorMsg}`);
      }

      await delay(2000); // Respect API rate limits
    }

    res.status(200).json({
      message: "Choghadiya timings data storage completed",
      result: results,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message || "Unknown error",
    });
  }
});








// Define the expected Dur Muhurat item structure
interface DurMuhuratItem {
  starts_at?: string;
  ends_at?: string;
}

tithiRouter.post("/store-dur-muhurat", async (req: any, res: any) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const datesToProcess = [
      { date: today, checkBeforeInsert: true },
      { date: tomorrow, checkBeforeInsert: false },
    ];

    const results: any[] = [];
    const errors: string[] = [];

    for (const { date, checkBeforeInsert } of datesToProcess) {
      const dateStr = date.toISOString().split("T")[0];

      if (checkBeforeInsert) {
        const exists = await DurMuhuratModel.findOne({ where: { date_observed: dateStr } });
        if (exists) {
          results.push({ date: dateStr, status: "already exists" });
          continue;
        }
      }

      const requestData = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        hours: 6,
        minutes: 0,
        seconds: 0,
        latitude: 17.38333,
        longitude: 78.4666,
        timezone: 5.5,
        config: {
          observation_point: "topocentric",
          ayanamsha: "lahiri",
        },
      };

      try {
        const response = await axios.post(
          "https://json.freeastrologyapi.com/dur-muhurat",
          requestData,
          {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.API_KEY!,
            },
          }
        );

        let rawData;
        try {
          rawData = typeof response.data.output === "string"
            ? JSON.parse(response.data.output)
            : response.data.output;
        } catch (parseErr) {
          errors.push(`JSON parse error on ${dateStr}: ${parseErr}`);
          continue;
        }

        const values: DurMuhuratItem[] = Object.values(rawData);
        let added = false;

        for (const muhurta of values) {
          if (muhurta.starts_at && muhurta.ends_at) {
            await DurMuhuratModel.create({
              startsAt: new Date(muhurta.starts_at),
              endsAt: new Date(muhurta.ends_at),
              date_observed: dateStr,
            });
            added = true;
          }
        }

        results.push({
          date: dateStr,
          status: added ? "success" : "no valid muhurats",
        });

      } catch (err: any) {
        if (err.response?.status === 429) {
          errors.push(`Rate limit exceeded on ${dateStr}. Skipping...`);
          await delay(5000); // Optional: exponential backoff could be added here
        } else {
          const msg = err.message || "Unknown error";
          errors.push(`Error on ${dateStr}: ${msg}`);
        }
      }

      await delay(2000); // Respect API limits
    }

    res.status(200).json({
      message: "Dur Muhurat data storage completed",
      result: results,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message || "Unknown error",
    });
  }
});







tithiRouter.post("/store-good-bad-times", async (req: any, res: any) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const datesToProcess = [
      { date: today, checkBeforeInsert: true },
      { date: tomorrow, checkBeforeInsert: false },
    ];

    const results: any[] = [];
    const errors: string[] = [];

    const timeTypes: Record<string, string> = {
      abhijit_data: "Abhijit Muhurat",
      amrit_kaal_data: "Amrit Kaal",
      brahma_muhurat_data: "Brahma Muhurat",
      rahu_kaalam_data: "Rahu Kaalam",
      yama_gandam_data: "Yama Gandam",
      gulika_kalam_data: "Gulika Kalam",
      varjyam_data: "Varjyam",
      dur_muhurat_data: "Dur Muhurat",
    };

    const parseCustomJson = (str: string) => {
      try {
        const fixedStr = str
          .replace(/([\{\s,])(\w+):/g, '$1"$2":')       // Wrap keys
          .replace(/: ([^",}\s][^,}\s]*)/g, ': "$1"');   // Wrap unquoted values
        return JSON.parse(fixedStr);
      } catch (err) {
        return undefined;
      }
    };

    for (const { date, checkBeforeInsert } of datesToProcess) {
      const dateStr = date.toISOString().split("T")[0];

      if (checkBeforeInsert) {
        const exists = await GoodBadTimesModel.findOne({ where: { date_observed: dateStr } });
        if (exists) {
          results.push({ date: dateStr, status: "already exists" });
          continue;
        }
      }

      const requestData = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        hours: 6,
        minutes: 0,
        seconds: 0,
        latitude: 17.38333,
        longitude: 78.4666,
        timezone: 5.5,
        config: {
          observation_point: "topocentric",
          ayanamsha: "lahiri",
        },
      };

      try {
        const response = await axios.post(
          "https://json.freeastrologyapi.com/good-bad-times",
          requestData,
          {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.API_KEY!,
            },
          }
        );

        const data = response.data;

        for (const [key, label] of Object.entries(timeTypes)) {
          const raw = data[key];
          if (!raw) continue;

          const parsed = parseCustomJson(raw);

          if (key === "dur_muhurat_data" && parsed) {
            for (const durKey of ["1", "2"]) {
              const dur = parsed[durKey];
              if (dur?.starts_at && dur?.ends_at) {
                await GoodBadTimesModel.create({
                  type: `${label} ${durKey}`,
                  startsAt: new Date(dur.starts_at),
                  endsAt: new Date(dur.ends_at),
                  date_observed: dateStr,
                });
              } else if (Object.keys(dur || {}).length > 0) {
                errors.push(`Invalid format for dur_muhurat_data.${durKey} on ${dateStr}: ${JSON.stringify(dur)}`);
              }
            }
          } else if (parsed?.starts_at && parsed?.ends_at) {
            await GoodBadTimesModel.create({
              type: label,
              startsAt: new Date(parsed.starts_at),
              endsAt: new Date(parsed.ends_at),
              date_observed: dateStr,
            });
          } else {
            errors.push(`Invalid format for ${key} on ${dateStr}. Raw: ${raw}`);
          }
        }

        results.push({ date: dateStr, status: "success" });

      } catch (err: any) {
        const msg = err.message || "Unknown error";
        errors.push(`Error on ${dateStr}: ${msg}`);
      }

      await delay(1500); // API rate limit respect
    }

    res.status(200).json({
      message: "Good/Bad Times data storage completed",
      result: results,
      errors: errors.length ? errors : undefined,
    });

  } catch (error: any) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message || "Unknown error",
    });
  }
});







interface SpecificTimingItem {
  name: string;
  starts_at: string;
  ends_at: string;
}

tithiRouter.post("/store-specific-good-bad-timings", async (req: any, res: any) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const datesToProcess = [
      { date: today, checkBeforeInsert: true },
      { date: tomorrow, checkBeforeInsert: false },
    ];

    const results: any[] = [];
    const errors: string[] = [];

    for (const { date, checkBeforeInsert } of datesToProcess) {
      const dateStr = date.toISOString().split("T")[0];

      if (checkBeforeInsert) {
        const exists = await SpecificGoodBadTimingsModel.findOne({ where: { date_observed: dateStr } });
        if (exists) {
          results.push({ date: dateStr, status: "already exists" });
          continue;
        }
      }

      const requestData = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        hours: 6,
        minutes: 0,
        seconds: 0,
        latitude: 17.38333,
        longitude: 78.4666,
        timezone: 5.5,
        config: {
          observation_point: "topocentric",
          ayanamsha: "lahiri"
        }
      };

      try {
        const response = await axios.post(
          "https://json.freeastrologyapi.com/specific-good-bad-timings",
          requestData,
          {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.API_KEY!,
            },
          }
        );

        const timingsList: SpecificTimingItem[] = JSON.parse(response.data.output);

        if (!Array.isArray(timingsList)) {
          errors.push(`Invalid data format for ${dateStr}`);
          continue;
        }

        let added = false;

        for (const timing of timingsList) {
          const { name, starts_at, ends_at } = timing;

          if (!name || !starts_at || !ends_at) {
            errors.push(`Missing fields in timing on ${dateStr}`);
            continue;
          }

          await SpecificGoodBadTimingsModel.create({
            name,
            startsAt: new Date(starts_at),
            endsAt: new Date(ends_at),
            date_observed: dateStr,
          });

          added = true;
        }

        results.push({ date: dateStr, status: added ? "success" : "no valid timings" });

      } catch (err: any) {
        const msg = err.message || "Unknown error";
        errors.push(`Error on ${dateStr}: ${msg}`);
      }

      await delay(1500);
    }

    res.status(200).json({
      message: "Specific Good/Bad Timings data stored successfully",
      result: results,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message || "Unknown error",
    });
  }
});



tithiRouter.post("/store-gulika-kalam", async (req, res) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const datesToProcess = [
      { date: today, checkBeforeInsert: true },
      { date: tomorrow, checkBeforeInsert: false },
    ];

    const results: any[] = [];
    const errors: string[] = [];

    for (const { date, checkBeforeInsert } of datesToProcess) {
      const dateStr = date.toISOString().split("T")[0];

      if (checkBeforeInsert) {
        const exists = await GulikaKalamModel.findOne({ where: { date_observed: dateStr } });
        if (exists) {
          results.push({ date: dateStr, status: "already exists" });
          continue;
        }
      }

      const requestData = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        hours: 6,
        minutes: 0,
        seconds: 0,
        latitude: 17.38333,
        longitude: 78.4666,
        timezone: 5.5,
        config: {
          observation_point: "topocentric",
          ayanamsha: "lahiri"
        }
      };

      try {
        const response = await axios.post(
          "https://json.freeastrologyapi.com/gulika-kalam",
          requestData,
          {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.API_KEY!,
            },
          }
        );

        let gulikaData: any;
        try {
          gulikaData = JSON.parse(response.data.output);
        } catch (err) {
          errors.push(`Invalid JSON format for ${dateStr}`);
          continue;
        }

        if (!gulikaData.starts_at || !gulikaData.ends_at) {
          errors.push(`Missing Gulika Kalam fields for ${dateStr}`);
          continue;
        }

        await GulikaKalamModel.create({
          startsAt: new Date(gulikaData.starts_at),
          endsAt: new Date(gulikaData.ends_at),
          date_observed: dateStr,
        });

        results.push({ date: dateStr, status: "success" });

      } catch (err: any) {
        const msg = err.message || "Unknown error";
        errors.push(`Error on ${dateStr}: ${msg}`);
      }

      await delay(1500);
    }

    res.status(200).json({
      message: "Gulika Kalam data storage completed",
      result: results,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message || "Unknown error",
    });
  }
});



interface HoraItem {
  lord: string;
  starts_at: string;
  ends_at: string;
}

tithiRouter.post("/store-hora-timings", async (req, res) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const datesToProcess = [
      { date: today, checkBeforeInsert: true },
      { date: tomorrow, checkBeforeInsert: false },
    ];

    const results: any[] = [];
    const errors: string[] = [];

    for (const { date, checkBeforeInsert } of datesToProcess) {
      const dateStr = date.toISOString().split("T")[0];

      if (checkBeforeInsert) {
        const exists = await HoraTimingsModel.findOne({ where: { date_observed: dateStr } });
        if (exists) {
          results.push({ date: dateStr, status: "already exists" });
          continue;
        }
      }

      const requestData = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        hours: 6,
        minutes: 0,
        seconds: 0,
        latitude: 17.38333,
        longitude: 78.4666,
        timezone: 5.5,
        config: {
          observation_point: "topocentric",
          ayanamsha: "lahiri"
        }
      };

      try {
        const response = await axios.post(
          "https://json.freeastrologyapi.com/hora-timings",
          requestData,
          {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.API_KEY!,
            },
          }
        );

        let horaDataObj: Record<string, HoraItem>;
        try {
          horaDataObj = JSON.parse(response.data.output);
        } catch {
          errors.push(`Failed to parse hora data for ${dateStr}`);
          continue;
        }

        if (typeof horaDataObj !== 'object' || Array.isArray(horaDataObj)) {
          errors.push(`Invalid format for ${dateStr}, expected object with keys.`);
          continue;
        }

        let stored = false;

        for (const key of Object.keys(horaDataObj)) {
          const hora = horaDataObj[key];
          const { lord, starts_at, ends_at } = hora;

          if (!lord || !starts_at || !ends_at) {
            errors.push(`Missing fields in hora block ${key} for ${dateStr}`);
            continue;
          }

          await HoraTimingsModel.create({
            lord,
            startsAt: new Date(starts_at),
            endsAt: new Date(ends_at),
            date_observed: dateStr,
          });

          stored = true;
        }

        results.push({
          date: dateStr,
          status: stored ? "success" : "no valid hora blocks",
        });

      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || "Unknown error";
        errors.push(`Error on ${dateStr}: ${msg}`);
      }

      await delay(1500); // respect rate limits
    }

    res.status(200).json({
      message: "Hora timings data storage completed",
      result: results,
      errors: errors.length ? errors : undefined,
    });

  } catch (error: any) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message || "Unknown error",
    });
  }
});



tithiRouter.post("/store-karana-durations", async (req, res) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const datesToProcess = [
      { date: today, checkBeforeInsert: true },
      { date: tomorrow, checkBeforeInsert: false },
    ];

    const results: any[] = [];
    const errors: string[] = [];

    for (const { date, checkBeforeInsert } of datesToProcess) {
      const dateStr = date.toISOString().split("T")[0];

      // Check if already stored in DB
      if (checkBeforeInsert) {
        const exists = await KaranaDurationsModel.findOne({ where: { date_observed: dateStr } });
        if (exists) {
          results.push({ date: dateStr, status: "already exists" });
          continue;
        }
      }

      const requestData = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        hours: 6,
        minutes: 0,
        seconds: 0,
        latitude: 17.38333,
        longitude: 78.4666,
        timezone: 5.5,
        config: {
          observation_point: "topocentric",
          ayanamsha: "lahiri",
        },
      };

      try {
        const response = await axios.post(
          "https://json.freeastrologyapi.com/karana-durations",
          requestData,
          {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.API_KEY!,
            },
          }
        );

        let karanaDataObj: any;

        try {
          karanaDataObj = JSON.parse(response.data.output);
        } catch (parseErr) {
          errors.push(`JSON parsing failed for ${dateStr}`);
          continue;
        }

        if (!karanaDataObj || typeof karanaDataObj !== "object") {
          errors.push(`Invalid response format for ${dateStr}`);
          continue;
        }

        let stored = false;

        for (const key of Object.keys(karanaDataObj)) {
          const karana = karanaDataObj[key];
          const { number, name, completion, karana_left_percentage } = karana;

          if (number === undefined || !name || !completion) {
            errors.push(`Missing fields in karana block ${key} for ${dateStr}`);
            continue;
          }

          await KaranaDurationsModel.create({
            number,
            name,
            completion,
            karana_left_percentage: karana_left_percentage ?? null,
            date_observed: dateStr,
          });

          stored = true;
        }

        if (stored) {
          results.push({ date: dateStr, status: "success" });
        } else {
          errors.push(`All entries invalid for ${dateStr}`);
        }

      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || "Unknown error";
        errors.push(`Error on ${dateStr}: ${msg}`);
      }

      await delay(1500);
    }

    res.status(200).json({
      message: "Karana Durations check & store completed",
      result: results,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message || "Unknown error",
    });
  }
});



//need to pull data from here
tithiRouter.post("/store-lunar-month-info", async (req, res) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const datesToProcess = [
      { date: today, checkBeforeInsert: true },
      { date: tomorrow, checkBeforeInsert: false },
    ];

    const results: any[] = [];
    const errors: string[] = [];

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const MAX_RETRIES = 2;

    async function fetchWithRetry(requestData: any, retries = 0): Promise<any> {
      try {
        return await axios.post(
          "https://json.freeastrologyapi.com/lunarmonthinfo",
          requestData,
          {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.API_KEY!,
            },
          }
        );
      } catch (err: any) {
        if (err.response?.status === 429 && retries < MAX_RETRIES) {
          await delay(3000);
          return fetchWithRetry(requestData, retries + 1);
        }
        throw err;
      }
    }

    for (const { date, checkBeforeInsert } of datesToProcess) {
      const dateStr = date.toISOString().split("T")[0];

      if (checkBeforeInsert) {
        const exists = await LunarMonthInfoModel.findOne({ where: { date_observed: dateStr } });
        if (exists) {
          results.push({ date: dateStr, status: "already exists" });
          continue;
        }
      }

      const requestData = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        hours: 6,
        minutes: 0,
        seconds: 0,
        latitude: 17.38333,
        longitude: 78.4666,
        timezone: 5.5,
        config: {
          observation_point: "topocentric",
          ayanamsha: "lahiri"
        }
      };

      try {
        const response = await fetchWithRetry(requestData);
        const rawOutput = response.data?.output;

        let lunarInfo: any;

        if (typeof rawOutput === "string") {
          try {
            lunarInfo = JSON.parse(rawOutput);
          } catch {
            errors.push(`Invalid JSON output for ${dateStr}`);
            continue;
          }
        } else if (typeof rawOutput === "object" && rawOutput !== null) {
          lunarInfo = rawOutput;
        } else {
          errors.push(`Unexpected output format for ${dateStr}`);
          continue;
        }

        // Validate required fields
        if (
          lunarInfo.lunar_month_number === undefined ||
          !lunarInfo.lunar_month_name ||
          !lunarInfo.lunar_month_full_name ||
          lunarInfo.adhika === undefined ||
          lunarInfo.nija === undefined ||
          lunarInfo.kshaya === undefined
        ) {
          errors.push(`Missing required fields for ${dateStr}`);
          continue;
        }

        await LunarMonthInfoModel.create({
          lunar_month_number: lunarInfo.lunar_month_number,
          lunar_month_name: lunarInfo.lunar_month_name,
          lunar_month_full_name: lunarInfo.lunar_month_full_name,
          adhika: lunarInfo.adhika,
          nija: lunarInfo.nija,
          kshaya: lunarInfo.kshaya,
          date_observed: dateStr,
        });

        results.push({ date: dateStr, status: "success" });

      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || "Unknown error";
        errors.push(`Error on ${dateStr}: ${msg}`);
      }

      await delay(1500); // Respect API rate limits
    }

    res.status(200).json({
      message: "Lunar Month Info data storage completed",
      result: results,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message || "Unknown error",
    });
  }
});




tithiRouter.post("/store-rahu-kalam", async (req: any, res: any) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const datesToProcess = [
      { date: today, checkBeforeInsert: true },
      { date: tomorrow, checkBeforeInsert: false },
    ];

    const results: any[] = [];
    const errors: string[] = [];

    for (const { date, checkBeforeInsert } of datesToProcess) {
      const dateStr = date.toISOString().split("T")[0];

      if (checkBeforeInsert) {
        const exists = await RahuKalamModel.findOne({ where: { date_observed: dateStr } });
        if (exists) {
          results.push({ date: dateStr, status: "already exists" });
          continue;
        }
      }

      const requestData = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        hours: 6,
        minutes: 0,
        seconds: 0,
        latitude: 17.38333,
        longitude: 78.4666,
        timezone: 5.5,
        config: {
          observation_point: "topocentric",
          ayanamsha: "lahiri",
        },
      };

      try {
        const response = await axios.post(
          "https://json.freeastrologyapi.com/rahu-kalam",
          requestData,
          {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.API_KEY!,
            },
          }
        );

        let rahuData: any;
        try {
          rahuData = JSON.parse(response.data.output);
        } catch {
          errors.push(`Invalid JSON format for ${dateStr}`);
          continue;
        }

        if (!rahuData.starts_at || !rahuData.ends_at) {
          errors.push(`Missing Rahu Kalam data for ${dateStr}`);
          continue;
        }

        await RahuKalamModel.create({
          date_observed: dateStr,
          startsAt: new Date(rahuData.starts_at),
          endsAt: new Date(rahuData.ends_at),
        });

        results.push({ date: dateStr, status: "success" });

      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || "Unknown error";
        errors.push(`Error on ${dateStr}: ${msg}`);
      }

      await delay(1500); // To respect API rate limits
    }

    res.status(200).json({
      message: "Rahu Kalam data storage completed",
      result: results,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message || "Unknown error",
    });
  }
});




tithiRouter.post("/store-ritu-info", async (req: any, res: any) => {
  try {
    const parsedStartDate = new Date(); // Use system date
    const monthDates = getOneMonthDates(parsedStartDate);

    const results: any[] = [];
    const errors: string[] = [];

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const MAX_RETRIES = 2;

    async function fetchWithRetry(requestData: any, retries = 0): Promise<any> {
      try {
        return await axios.post(
          "https://json.freeastrologyapi.com/rituinfo",
          requestData,
          {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.API_KEY!,
            },
          }
        );
      } catch (err: any) {
        if (err.response?.status === 429 && retries < MAX_RETRIES) {
          await delay(3000);
          return fetchWithRetry(requestData, retries + 1);
        }
        throw err;
      }
    }

    for (let date of monthDates) {
      const dateStr = date.toISOString().split("T")[0];

      const requestData = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        hours: date.getHours(),
        minutes: date.getMinutes(),
        seconds: date.getSeconds(),
        latitude: 17.38333,
        longitude: 78.4666,
        timezone: 5.5,
        config: {
          observation_point: "topocentric",
          ayanamsha: "lahiri",
        },
      };

      try {
        const response = await fetchWithRetry(requestData);
        const rawOutput = response.data?.output;

        console.log(`[${dateStr}] API Raw Output:`, rawOutput);

        let rituData;

        if (typeof rawOutput === "string") {
          try {
            rituData = JSON.parse(rawOutput);
          } catch (e) {
            errors.push(`Invalid JSON string on ${dateStr}`);
            continue;
          }
        } else if (typeof rawOutput === "object" && rawOutput !== null) {
          rituData = rawOutput;
        } else {
          errors.push(`Invalid output format for ${dateStr}`);
          continue;
        }

        if (
          rituData.number === undefined ||
          typeof rituData.name !== "string"
        ) {
          errors.push(`Missing or invalid ritu fields on ${dateStr}`);
          continue;
        }

        await RituInfoModel.create({
          ritu_number: rituData.number,
          ritu_name: rituData.name,
          date_observed: dateStr,
        });

        results.push({ date: dateStr, status: "success" });

      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || "Unknown error";
        errors.push(`Error on ${dateStr}: ${msg}`);
      }

      await delay(2000);
    }

    res.status(200).json({
      message: "Ritu info data storage completed",
      result: results,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message || "Unknown error",
    });
  }
});






tithiRouter.post("/store-samvat-info", async (req: any, res: any) => {
  const API_KEY = process.env.API_KEY || "btBlVaHneb1IGtGr86jFAa99fs7Z3EHl9RVXmq16";

  if (!API_KEY) {
    return res.status(400).json({ message: "API_KEY missing from environment or fallback." });
  }

  console.log("🔐 Using API Key:", API_KEY);

  try {
    const parsedStartDate = new Date();
    const monthDates = getOneMonthDates(parsedStartDate);
    const results: any[] = [];
    const errors: string[] = [];

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const MAX_RETRIES = 2;

    async function fetchWithRetry(requestData: any, retries = 0): Promise<any> {
      try {
        console.log(`🌐 Fetching data for ${requestData.year}-${requestData.month}-${requestData.date}`);
        return await axios.post(
          "https://json.freeastrologyapi.com/samvat-info",
          requestData,
          {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": API_KEY,
            },
          }
        );
      } catch (err: any) {
        console.error("❌ Error:", err.response?.data || err.message);

        if (err.response?.status === 429 && retries < MAX_RETRIES) {
          await delay(3000);
          return fetchWithRetry(requestData, retries + 1);
        }
        throw err;
      }
    }

    for (let date of monthDates) {
      const dateStr = date.toISOString().split("T")[0];

      const requestData = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        hours: date.getHours(),
        minutes: date.getMinutes(),
        seconds: date.getSeconds(),
        latitude: 17.38333,
        longitude: 78.4666,
        timezone: 5.5,
        config: {
          observation_point: "topocentric",
          ayanamsha: "lahiri",
        },
      };

      try {
        const response = await fetchWithRetry(requestData);
        const rawOutput = response.data?.output;

        let samvatData: any;

        if (typeof rawOutput === "string") {
          try {
            samvatData = JSON.parse(rawOutput);
          } catch {
            errors.push(`Invalid JSON format for ${dateStr}`);
            continue;
          }
        } else if (typeof rawOutput === "object" && rawOutput !== null) {
          samvatData = rawOutput;
        } else {
          errors.push(`Unexpected response format for ${dateStr}`);
          continue;
        }

        const requiredFields = [
          "status",
          "timestamp",
          "saka_salivahana_number",
          "saka_salivahana_name_number",
          "saka_salivahana_year_name",
          "vikram_chaitradi_number",
          "vikram_chaitradi_name_number",
          "vikram_chaitradi_year_name",
        ];

        const missingFields = requiredFields.filter(
          field => samvatData[field] === undefined || samvatData[field] === null
        );

        if (missingFields.length > 0) {
          errors.push(`Missing fields on ${dateStr}: ${missingFields.join(", ")}`);
          continue;
        }

        // Prevent duplicate entries
        const exists = await SamvatInfoModel.findOne({ where: { date_observed: dateStr } });
        if (exists) {
          results.push({ date: dateStr, status: "skipped (already exists)" });
          continue;
        }

        await SamvatInfoModel.create({
          status: samvatData.status,
          timestamp: samvatData.timestamp,
          saka_salivahana_number: samvatData.saka_salivahana_number,
          saka_salivahana_name_number: samvatData.saka_salivahana_name_number,
          saka_salivahana_year_name: samvatData.saka_salivahana_year_name,
          vikram_chaitradi_number: samvatData.vikram_chaitradi_number,
          vikram_chaitradi_name_number: samvatData.vikram_chaitradi_name_number,
          vikram_chaitradi_year_name: samvatData.vikram_chaitradi_year_name,
          date_observed: dateStr,
        });

        results.push({ date: dateStr, status: "success" });

      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || "Unknown error";
        errors.push(`Error on ${dateStr}: ${msg}`);
      }

      await delay(1500);
    }

    res.status(200).json({
      message: "Samvat info data stored successfully",
      result: results,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message || "Unknown error",
    });
  }
});




tithiRouter.post("/store-varjyam", async (req: any, res: any) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const results: any[] = [];
    const errors: string[] = [];

    const datesToCheck = [
      { date: today, checkBeforeInsert: true },
      { date: tomorrow, checkBeforeInsert: false },
    ];

    for (const { date, checkBeforeInsert } of datesToCheck) {
      const dateStr = date.toISOString().split("T")[0];

      if (checkBeforeInsert) {
        const alreadyExists = await VarjyamModel.findOne({ where: { date_observed: dateStr } });
        if (alreadyExists) {
          results.push({ date: dateStr, status: "already exists" });
          continue;
        }
      }

      const requestData = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        hours: date.getHours(),
        minutes: date.getMinutes(),
        seconds: date.getSeconds(),
        latitude: 17.38333,
        longitude: 78.4666,
        timezone: 5.5,
        config: {
          observation_point: "topocentric",
          ayanamsha: "lahiri",
        },
      };

      try {
        const response = await axios.post(
          "https://json.freeastrologyapi.com/varjyam",
          requestData,
          {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.API_KEY!,
            },
          }
        );

        let varjyamDataList;

        try {
          const parsed = JSON.parse(response.data.output);

          if (Array.isArray(parsed)) {
            varjyamDataList = parsed;
          } else if (parsed && typeof parsed === "object") {
            varjyamDataList = [parsed]; // wrap single object
          } else {
            throw new Error("Unexpected output format");
          }
        } catch (e) {
          errors.push(`Invalid format for ${dateStr}`);
          continue;
        }

        for (const block of varjyamDataList) {
          const { starts_at, ends_at } = block;

          if (!starts_at || !ends_at) {
            errors.push(`Missing fields in Varjyam block on ${dateStr}`);
            continue;
          }

          await VarjyamModel.create({
            date_observed: dateStr,
            startsAt: new Date(starts_at),
            endsAt: new Date(ends_at),
          });
        }

        results.push({ date: dateStr, status: "success" });
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || "Unknown error";
        errors.push(`Error on ${dateStr}: ${msg}`);
      }

      await new Promise((r) => setTimeout(r, 1500)); // API rate limiting
    }

    res.status(200).json({
      message: "Varjyam data storage completed",
      result: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message || "Unknown error",
    });
  }
});





// ✅ Route: Store Vedic Weekday (today if not present, always tomorrow)
tithiRouter.post("/store-vedic-weekday", async (req: any, res: any) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const results: any[] = [];
    const errors: string[] = [];

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const MAX_RETRIES = 2;

    async function fetchWithRetry(requestData: any, retries = 0): Promise<any> {
      try {
        return await axios.post(
          "https://json.freeastrologyapi.com/vedic-weekday",
          requestData,
          {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.API_KEY!,
            },
          }
        );
      } catch (err: any) {
        if (err.response?.status === 429 && retries < MAX_RETRIES) {
          await delay(3000);
          return fetchWithRetry(requestData, retries + 1);
        }
        throw err;
      }
    }

    const datesToCheck = [
      { date: today, checkBeforeInsert: true },
      { date: tomorrow, checkBeforeInsert: false },
    ];

    for (const { date, checkBeforeInsert } of datesToCheck) {
      const dateStr = date.toISOString().split("T")[0];

      if (checkBeforeInsert) {
        const alreadyExists = await VedicWeekdayModel.findOne({ where: { date_observed: dateStr } });
        if (alreadyExists) {
          results.push({ date: dateStr, status: "already exists" });
          continue;
        }
      }

      const requestData = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        hours: date.getHours(),
        minutes: date.getMinutes(),
        seconds: date.getSeconds(),
        latitude: 17.38333,
        longitude: 78.4666,
        timezone: 5.5,
        config: {
          observation_point: "topocentric",
          ayanamsha: "lahiri",
        },
      };

      try {
        const response = await fetchWithRetry(requestData);
        const weekdayData = response.data?.output;

        if (!weekdayData || typeof weekdayData !== "object") {
          errors.push(`Invalid format for ${dateStr}`);
          continue;
        }

        const requiredFields = [
          "weekday_number",
          "weekday_name",
          "vedic_weekday_number",
          "vedic_weekday_name",
        ];

        const missingFields = requiredFields.filter(
          (field) => weekdayData[field] === undefined || weekdayData[field] === null
        );

        if (missingFields.length > 0) {
          errors.push(`Missing fields for ${dateStr}: ${missingFields.join(", ")}`);
          continue;
        }

        await VedicWeekdayModel.create({
          weekday_number: weekdayData.weekday_number,
          weekday_name: weekdayData.weekday_name,
          vedic_weekday_number: weekdayData.vedic_weekday_number,
          vedic_weekday_name: weekdayData.vedic_weekday_name,
          date_observed: dateStr,
        });

        results.push({ date: dateStr, status: "success" });
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || "Unknown error";
        errors.push(`Error on ${dateStr}: ${msg}`);
      }

      await delay(1500);
    }

    res.status(200).json({
      message: "Vedic weekday data storage completed",
      result: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message || "Unknown error",
    });
  }
});


// ✅ Route: Store Yama Gandam (today if not present, always tomorrow)
tithiRouter.post("/store-yama-gandam", async (req: any, res: any) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const results: any[] = [];
    const errors: string[] = [];

    const datesToCheck = [
      { date: today, checkBeforeInsert: true },
      { date: tomorrow, checkBeforeInsert: false },
    ];

    for (const { date, checkBeforeInsert } of datesToCheck) {
      const dateStr = date.toISOString().split("T")[0];

      if (checkBeforeInsert) {
        const alreadyExists = await YamaGandamModel.findOne({ where: { date_observed: dateStr } });
        if (alreadyExists) {
          results.push({ date: dateStr, status: "already exists" });
          continue;
        }
      }

      const requestData = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        hours: date.getHours(),
        minutes: date.getMinutes(),
        seconds: date.getSeconds(),
        latitude: 17.38333,
        longitude: 78.4666,
        timezone: 5.5,
        config: {
          observation_point: "topocentric",
          ayanamsha: "lahiri",
        },
      };

      try {
        const response = await axios.post(
          "https://json.freeastrologyapi.com/yama-gandam",
          requestData,
          {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.API_KEY!,
            },
          }
        );

        const yamaGandamData = JSON.parse(response.data.output);

        if (!yamaGandamData.starts_at || !yamaGandamData.ends_at) {
          errors.push(`Missing Yama Gandam timings for ${dateStr}`);
          continue;
        }

        await YamaGandamModel.create({
          date_observed: dateStr,
          startsAt: new Date(yamaGandamData.starts_at),
          endsAt: new Date(yamaGandamData.ends_at),
        });

        results.push({ date: dateStr, status: "success" });
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || "Unknown error";
        errors.push(`Error on ${dateStr}: ${msg}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    res.status(200).json({
      message: "Yama Gandam data storage completed",
      result: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message || "Unknown error",
    });
  }
});




tithiRouter.post("/store-yoga-durations", async (req: any, res: any) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const datesToProcess = [
      { date: today, checkBeforeInsert: true },
      { date: tomorrow, checkBeforeInsert: false },
    ];

    const results: any[] = [];
    const errors: string[] = [];

    for (const { date, checkBeforeInsert } of datesToProcess) {
      const dateStr = date.toISOString().split("T")[0];

      if (checkBeforeInsert) {
        const existing = await YogaDurationsModel.findOne({ where: { date_observed: dateStr } });
        if (existing) {
          results.push({ date: dateStr, status: "already exists" });
          continue;
        }
      }

      const requestData = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        hours: 6,
        minutes: 0,
        seconds: 0,
        latitude: 17.38333,
        longitude: 78.4666,
        timezone: 5.5,
        config: {
          observation_point: "topocentric",
          ayanamsha: "lahiri",
        },
      };

      try {
        const response = await axios.post(
          "https://json.freeastrologyapi.com/yoga-durations",
          requestData,
          {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.API_KEY!,
            },
          }
        );

        const yogaDataRaw = response.data.output;
        let yogaData;

        try {
          yogaData = JSON.parse(yogaDataRaw);
        } catch (parseErr) {
          errors.push(`Invalid JSON for ${dateStr}`);
          continue;
        }

        if (!yogaData || typeof yogaData !== "object" || Object.keys(yogaData).length === 0) {
          errors.push(`Empty or invalid yoga data for ${dateStr}`);
          continue;
        }

        let stored = false;

        for (const key in yogaData) {
          const yoga = yogaData[key];

          if (!yoga?.number || !yoga?.name || !yoga?.completion) {
            errors.push(`Missing required fields for ${dateStr} in entry ${key}`);
            continue;
          }

          await YogaDurationsModel.create({
            number: yoga.number,
            name: yoga.name,
            completion: yoga.completion,
            yoga_left_percentage: yoga.yoga_left_percentage ?? null,
            date_observed: dateStr,
          });

          stored = true;
        }

        if (stored) {
          results.push({ date: dateStr, status: "success" });
        } else {
          errors.push(`All yoga entries invalid for ${dateStr}`);
        }

      } catch (err: any) {
        const status = err.response?.status;
        const msg = err.response?.data?.message || err.message || "Unknown error";

        if (status === 429) {
          errors.push(`Too Many Requests for ${dateStr} - try again later`);
        } else {
          errors.push(`API error on ${dateStr}: ${msg}`);
        }
      }
    }

    res.status(200).json({
      message: "Yoga Durations check & store completed",
      result: results,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message || "Unknown error",
    });
  }
});





tithiRouter.post("/store-full-panchang", async (req: any, res: any) => {
  const { startDate } = req.body;

  if (!startDate) {
    return res.status(400).json({ message: "startDate is required" });
  }

  const BASE_URL = `http://localhost:5000/api/v1/panchangam`;
 // Update this to your server host/port

  const endpoints = [
    "/store-tithi-data",
    "/store-nakshtra-data",
    "/store-aayanam-data",
    "/store-abhijit-muhurat",
    "/store-amrit-kaal",
    "/store-brahma-muhurat",
    "/store-choghadiya-timings",
    "/store-dur-muhurat",
    "/store-good-bad-times",
    "/store-specific-good-bad-timings",
    "/store-gulika-kalam",
    "/store-hora-timings",
    "/store-karana-durations",
    "/store-lunar-month-info",
    "/store-rahu-kalam",
    "/store-ritu-info",
    "/store-samvat-info",
    "/store-varjyam",
    "/store-vedic-weekday",
    "/store-yama-gandam",
    "/store-yoga-durations"
  ];

  const results: any = {};
  const errors: any = {};

  for (const endpoint of endpoints) {
    try {
      const response = await axios.post(`${BASE_URL}${endpoint}`, { startDate });
      results[endpoint] = response.data;
    } catch (err: any) {
      errors[endpoint] = err?.response?.data?.message || err.message || "Unknown error";
    }

    await new Promise((r) => setTimeout(r, 300)); // Delay between calls
  }

  res.status(200).json({
    message: "Full Panchang collection completed",
    results,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  });
});


tithiRouter.get("/get-panchang-by-date", async (req: any, res: any) => {
  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

    const [
      ayanam,
      abhijit,
      amrit,
      brahma,
      choghadiya,
      durMuhurat,
      goodBadTimes,
      gulikaKalam,
      horaTimings,
      karanaDurations,
      lunarMonthInfo,
      rahuKalam,
      nakshatraDurations,
      rituInfo,
      samvatInfo,
      tithiData,
      varjyam,
      vedicWeekday,
      yamaGandam,
      yogaDurations,
    ] = await Promise.all([
      AayanamModel.findAll({ where: { date_observed: today } }),
      AbhijitMuhuratModel.findAll({ where: { date_observed: today } }),
      AmritKaalModel.findAll({ where: { date_observed: today } }),
      BrahmaMuhuratModel.findAll({ where: { date_observed: today } }),
      ChoghadiyaTimingsModel.findAll({ where: { date_observed: today } }),
      DurMuhuratModel.findAll({ where: { date_observed: today } }),
      GoodBadTimesModel.findAll({ where: { date_observed: today } }),
      GulikaKalamModel.findAll({ where: { date_observed: today } }),
      HoraTimingsModel.findAll({ where: { date_observed: today } }),
      KaranaDurationsModel.findAll({ where: { date_observed: today } }),
      LunarMonthInfoModel.findAll({ where: { date_observed: today } }),
      RahuKalamModel.findAll({ where: { date_observed: today } }),
      NakshatraDurationsModel.findAll({ where: { date_observed: today } }),
      RituInfoModel.findAll({ where: { date_observed: today } }),
      SamvatInfoModel.findAll({ where: { date_observed: today } }),
      TithiDurationsModel.findAll({ where: { date_observed: today } }),
      VarjyamModel.findAll({ where: { date_observed: today } }),
      VedicWeekdayModel.findAll({ where: { date_observed: today } }),
      YamaGandamModel.findAll({ where: { date_observed: today } }),
      YogaDurationsModel.findAll({ where: { date_observed: today } }),
    ]);

    res.status(200).json({
      date_observed: today,
      data: {
        tithiData,
        nakshatraDurations,
        ayanam,
        abhijit,
        amrit,
        brahma,
        choghadiya,
        durMuhurat,
        goodBadTimes,
        gulikaKalam,
        horaTimings,
        karanaDurations,
        lunarMonthInfo,
        rahuKalam,
        rituInfo,
        samvatInfo,
        varjyam,
        vedicWeekday,
        yamaGandam,
        yogaDurations,
      },
    });

  } catch (error: any) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message || "Unknown error",
    });
  }
});




tithiRouter.get("/fetch-all", async (req, res) => {
  try {
    const { date, from, to } = req.query;

    let where: any = {};
    if (date) {
      where.date_observed = date;
    } else if (from && to) {
      where.date_observed = {
        [Op.between]: [from, to],
      };
    }

    const fetchData = async (model: any) => await model.findAll({ where });

    const [
      nakshatra,
      aayanam,
      abhijit,
      amrit,
      brahma,
      choghadiya,
      dur,
      goodbad,
      specificgoodbad,
      gulika,
      hora,
      karana,
      lunar,
      rahu,
      ritu,
      samvat,
      varjyam,
      vedic,
      yama,
      yoga,
    ] = await Promise.all([
      fetchData(NakshatraDurationsModel),
      fetchData(AayanamModel),
      fetchData(AbhijitMuhuratModel),
      fetchData(AmritKaalModel),
      fetchData(BrahmaMuhuratModel),
      fetchData(ChoghadiyaTimingsModel),
      fetchData(DurMuhuratModel),
      fetchData(GoodBadTimesModel),
      fetchData(SpecificGoodBadTimingsModel),
      fetchData(GulikaKalamModel),
      fetchData(HoraTimingsModel),
      fetchData(KaranaDurationsModel),
      fetchData(LunarMonthInfoModel),
      fetchData(RahuKalamModel),
      fetchData(RituInfoModel),
      fetchData(SamvatInfoModel),
      fetchData(VarjyamModel),
      fetchData(VedicWeekdayModel),
      fetchData(YamaGandamModel),
      fetchData(YogaDurationsModel),
    ]);

    res.status(200).json({
      message: "Panchang data fetched successfully",
      date: date || `${from} to ${to}`,
      data: {
        nakshatra,
        aayanam,
        abhijit,
        amrit,
        brahma,
        choghadiya,
        dur,
        goodbad,
        specificgoodbad,
        gulika,
        hora,
        karana,
        lunar,
        rahu,
        ritu,
        samvat,
        varjyam,
        vedic,
        yama,
        yoga,
      },
    });

  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch Panchang data",
      error: error.message || "Unknown error",
    });
  }
});


export default tithiRouter;
