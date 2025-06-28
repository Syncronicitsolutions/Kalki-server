// import sequelize from '../db/config';
// import { models } from './Sequelize-models-aliases';


// async function init() {
//   try {
//     // Sync models in the proper order based on dependencies
//     await models.AdminUsersModel.sync({ alter: true });
//     await models.TemplesModel.sync({ alter: true });
//     await models.PujaModel.sync({ alter: true });
//     await models.PujaPackagesModel.sync({ alter: true });
//     await models.PackageFeaturesModel.sync({ alter: true });
//     await models.CouponModel.sync({ alter: true });
//     await models.CouponUsageModel.sync({ alter: true });
//     await models.PujaBenefitsModel.sync({ alter: true });

//     // Sync all Panchangam models
//     await models.NakshatraDurationsModel.sync({ alter: true });
//     await models.AayanamModel.sync({ alter: true });
//     await models.AbhijitMuhuratModel.sync({ alter: true });
//     await models.AmritKaalModel.sync({ alter: true });
//     await models.BrahmaMuhuratModel.sync({ alter: true });
//     await models.ChoghadiyaTimingsModel.sync({ alter: true });
//     await models.DurMuhuratModel.sync({ alter: true });
//     await models.VarjyamModel.sync({ alter: true });
//     await models.GoodBadTimesModel.sync({ alter: true });
//     await models.SpecificGoodBadTimingsModel.sync({ alter: true });
//     await models.GulikaKalamModel.sync({ alter: true });
//     await models.HoraTimingsModel.sync({ alter: true });
//     await models.KaranaDurationsModel.sync({ alter: true });
//     await models.LunarMonthInfoModel.sync({ alter: true });
//     await models.RahuKalamModel.sync({ alter: true });
//     await models.RituInfoModel.sync({ alter: true });
//     await models.SamvatInfoModel.sync({ alter: true });
//     await models.TithiDurationsModel.sync({ alter: true });
//     await models.VedicWeekdayModel.sync({ alter: true });
//     await models.YamaGandamModel.sync({ alter: true });
//     await models.YogaDurationsModel.sync({ alter: true });

//     // Models that have foreign key dependencies
//     await models.UserModel.sync({ alter: true });
//     await models.ReviewsModel.sync({ alter: true });
//     await models.TempleImagesModel.sync({ alter: true });
//     await models.AgentModel.sync({ alter: true });
// // Add a small delay
// await new Promise(resolve => setTimeout(resolve, 1000));
// await models.AgentDetailsModel.sync({ alter: true });
//     await models.PujaImagesAndVideoModel.sync({ alter: true });
//     await models.PujaDatesModel.sync({ alter: true });
//     await models.AgentModel.sync({ alter: true });
//     await models.AssignedTasksModel.sync({ alter: true });
//     await models.BookingHistoryModel.sync({ alter: true });
//     await models.CompletedPujaMediaModel.sync({ alter: true });
//     await models.TrackingModel.sync({ alter: true });

//     // Initialize associations after syncing models
   
//     // models.ReviewsModel.associate(models);
   
//     // models.ReviewsModel.associate(models);
//     // models.BookingHistoryModel.associate(models);
//     // models.AgentModel.associate(models);
//     // models.AgentDetailsModel.associate(models);
//     // models.AssignedTasksModel.associate(models);
//     // models.PujaModel.associate(models);
//     // models.PujaPackagesModel.associate(models);
//     // models.PackageFeaturesModel.associate(models);
//     // models.PujaImagesAndVideoModel.associate(models);
//     // models.PujaDatesModel.associate(models);
//     // models.PujaBenefitsModel.associate(models);

//     // Initialize associations after syncing models
// (models.UserModel as any).associate(models);
// (models.ReviewsModel as any).associate(models);
// (models.BookingHistoryModel as any).associate(models);
// models.TemplesModel.associate(models);           
// models.ReviewsModel.associate(sequelize.models);
// models.ReviewsModel.associate(models);
// models.BookingHistoryModel.associate(models);
// models.AgentModel.associate(models);
// models.AgentDetailsModel.associate(models);
// models.AssignedTasksModel.associate(models);
// models.PujaModel.associate(models);
// models.PujaPackagesModel.associate(models);
// models.PackageFeaturesModel.associate(models);
// models.PujaImagesAndVideoModel.associate(models);
// models.PujaDatesModel.associate(models);
// models.PujaBenefitsModel.associate(models);



//     // Log all associations dynamically
//     Object.keys(sequelize.models).forEach(modelName => {
//       console.log(`${modelName} Associations:`, sequelize.models[modelName].associations);
//     });

//     console.log("Models and associations have been set up successfully!");
//     console.log("Database sync completed successfully!");
//     console.log(sequelize.models.UserModel.associations);
// console.log(sequelize.models.ReviewsModel.associations);
// console.log(sequelize.models.BookingHistoryModel.associations);
//   } catch (error) {
//     console.error("Error syncing database models:", error);
//   }
// }

// const dbInit = () => {
//   init();
// };

// export default dbInit;

// import sequelize from '../db/config';
// import { models } from './Sequelize-models-aliases';

// async function init() {
//   try {
//     // Sync models in the correct dependency order
//     await models.AdminUsersModel.sync({ alter: true });
//     await models.TemplesModel.sync({ alter: true });
//     await models.PujaModel.sync({ alter: true });
//     await models.PujaPackagesModel.sync({ alter: true });
//     await models.PackageFeaturesModel.sync({ alter: true });
//     await models.CouponModel.sync({ alter: true });
//     await models.CouponUsageModel.sync({ alter: true });
//     await models.PujaBenefitsModel.sync({ alter: true });

//     await models.NakshatraDurationsModel.sync({ alter: true });
//     await models.AayanamModel.sync({ alter: true });
//     await models.AbhijitMuhuratModel.sync({ alter: true });
//     await models.AmritKaalModel.sync({ alter: true });
//     await models.BrahmaMuhuratModel.sync({ alter: true });
//     await models.ChoghadiyaTimingsModel.sync({ alter: true });
//     await models.DurMuhuratModel.sync({ alter: true });
//     await models.VarjyamModel.sync({ alter: true });
//     await models.GoodBadTimesModel.sync({ alter: true });
//     await models.SpecificGoodBadTimingsModel.sync({ alter: true });
//     await models.GulikaKalamModel.sync({ alter: true });
//     await models.HoraTimingsModel.sync({ alter: true });
//     await models.KaranaDurationsModel.sync({ alter: true });
//     await models.LunarMonthInfoModel.sync({ alter: true });
//     await models.RahuKalamModel.sync({ alter: true });
//     await models.RituInfoModel.sync({ alter: true });
//     await models.SamvatInfoModel.sync({ alter: true });
//     await models.TithiDurationsModel.sync({ alter: true });
//     await models.VedicWeekdayModel.sync({ alter: true });
//     await models.YamaGandamModel.sync({ alter: true });
//     await models.YogaDurationsModel.sync({ alter: true });

//     await models.UserModel.sync({ alter: true });
//     await models.ReviewsModel.sync({ alter: true });
//     await models.TempleImagesModel.sync({ alter: true });
//     await models.AgentModel.sync({ alter: true });
//     await new Promise(resolve => setTimeout(resolve, 1000));
//     await models.AgentDetailsModel.sync({ alter: true });
//     await models.PujaImagesAndVideoModel.sync({ alter: true });
//     await models.PujaDatesModel.sync({ alter: true });
//     await models.AssignedTasksModel.sync({ alter: true });
//     await models.BookingHistoryModel.sync({ alter: true });
//     await models.CompletedPujaMediaModel.sync({ alter: true });
//     await models.TrackingModel.sync({ alter: true });

//     // ✅ Register associations ONCE for each model that has .associate()
//    (models.UserModel as any).associate(models);
//     (models.PujaModel as any).associate(models);
//     models.PujaPackagesModel.associate(models);
//     models.PackageFeaturesModel.associate(models);
//     models.PujaImagesAndVideoModel.associate(models);
//     models.PujaDatesModel.associate(models);
//     models.PujaBenefitsModel.associate(models);
//     models.TemplesModel.associate(models);
//     models.ReviewsModel.associate(models);
//     models.BookingHistoryModel.associate(models);
//     models.AgentModel.associate(models);
//     models.AgentDetailsModel.associate(models);
//     models.AssignedTasksModel.associate(models);

//     // ✅ Optional: log associations
//     Object.keys(sequelize.models).forEach(modelName => {
//       console.log(`${modelName} Associations:`, sequelize.models[modelName].associations);
//     });

//     console.log("✅ Models and associations have been set up successfully!");
//   } catch (error) {
//     console.error("❌ Error syncing database models:", error);
//   }
// }

// const dbInit = () => {
//   init();
// };

// export default dbInit;



import sequelize from '../db/config';
import { models } from './Sequelize-models-aliases';

async function init() {
  try {
    console.log("🔁 Registering associations...");

    // 1️⃣ Register associations
    (models.UserModel as any).associate(models);
    models.PujaModel.associate(models);
    models.PujaPackagesModel.associate(models);
    models.PackageFeaturesModel.associate(models);
    models.PujaImagesAndVideoModel.associate(models);
    models.PujaDatesModel.associate(models);
    models.PujaBenefitsModel.associate(models);
    models.TemplesModel.associate(models);
    models.ReviewsModel.associate(models);
    models.AgentModel.associate(models);
    models.AssignedTasksModel.associate(models);
    models.BookingHistoryModel.associate(models);
    models.WithdrawalRequestModel.associate?.(models);

    // console.log("🔁 Syncing models in order...");

    // 2️⃣ Sync models in dependency order
    await models.UserModel.sync({ alter: true });
    await models.TemplesModel.sync({ alter: true });
    await models.PujaModel.sync({ alter: true });
    await models.PujaPackagesModel.sync({ alter: true });
    await models.PackageFeaturesModel.sync({ alter: true });
    await models.PujaBenefitsModel.sync({ alter: true });
    await models.PujaDatesModel.sync({ alter: true });
    await models.PujaImagesAndVideoModel.sync({ alter: true });

    await models.AgentModel.sync({ alter: true });          
    await models.AssignedTasksModel.sync({ alter: true });

    await models.ReviewsModel.sync({ alter: true });
    await models.BookingHistoryModel.sync({ alter: true }); 
    await models.TemplePujaMappingModel.sync({ alter: true });
    await models.CarouselModel.sync({ alter: true });
    await models.WalletModel.sync({ alter: true });
    await models.WithdrawalRequestModel.sync({ alter: true });
    await models.FeedbacksModel.sync({alter: true});
    await models.CommissionHistoryModel.sync({alter: true});
    await models.WithdrawalRequestModel.sync({ alter: true });


    // console.log("✅ All models synced successfully!");

    // 3️⃣ Log associations (Optional)
    Object.keys(sequelize.models).forEach((modelName) => {
      // console.log(`🔗 ${modelName} Associations:`, Object.keys(sequelize.models[modelName].associations));
      // console.log('Columns:', Object.keys(models.AgentModel.rawAttributes));

    });
  } catch (error) {
    console.error("❌ Error syncing database models:", error);
  }
}

const dbInit = () => {
  init();
};

export default dbInit;
