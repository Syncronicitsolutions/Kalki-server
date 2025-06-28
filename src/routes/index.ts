import { Router } from "express";
import authenticateUserToken from "../middleWare/userAuthmiddleware";
import authenticateAgentToken from "../middleWare/agentMiddleware";
import adminauthrouter from "./admin/adminUserroute";
import agentRouter from "./agent/agentroute";
import userRegistration from "./users/userRegistration";
import userAuth from "./users/userAuth";
import userDetailsUpdate from "./users/usersDetailsroute";
import createPuja from "./pujas/pujaroute";
import agentAuth from "./agent/agentLogin";
import userslist from "./admin/allUsers";
import createTemple from "./temples/templeroute";
import allTemples from "./temples/allTemples";
import booking from "./bookings/bookingroute";
import reviews from "./bookings/submitReview";
import couponRouter from "./coupuns/couponroute";
import UserTestRouter from "./users/userTestRoute";
import tithiRouter from "./panchangam/tithiRouter";
import { getDashboardStats } from "./dashboard/dashboardRoute";

import paymentRouter from "./payments/payments";
import CarouselRoutes from "./slider/CarouselRoutes";
import feedbackRouter from "./feedback/feedbackroute";
import withdrawlrouter from "./agent/withdrawalRoutes";
import PanchangamCronRouter from "./panchangam/panchangamCron";

const routes = Router();

routes.use("/admin", adminauthrouter);
routes.use("/users", userslist);
routes.use("/agent", agentRouter);
routes.use("/agentlogin", agentAuth);
routes.use("/userregister", userRegistration);
 routes.use("/userlogin", userAuth);
routes.use("/usertest", UserTestRouter);
 routes.use("/userdetails", userDetailsUpdate);
routes.use("/booking", booking);
routes.use("/puja", createPuja);
routes.use("/temples", createTemple);
routes.use("/coupons", couponRouter);
routes.use("/alltemples", allTemples);
routes.use("/reviews", reviews);

routes.use("/panchangam", tithiRouter);
routes.use("/payments", paymentRouter);
routes.use("/slider", CarouselRoutes);
routes.use("/feedback", feedbackRouter);
routes.use("/withdrawls", withdrawlrouter);
routes.use("/panchang", PanchangamCronRouter);


routes.get("/booking-stats", getDashboardStats); 


export default routes;
