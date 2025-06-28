import { DataTypes, Model, Optional } from 'sequelize';
import sequelizeConnection from '../../config';  // Adjust this import as per your file structure
import BookingHistoryModel from '../bookings/BookingHistoryModel';
import ReviewsModel from '../pujas/ReviewsModel';
import AdminUsersModel from '../admin/AdminUserModel';
import AgentModel from '../agent/AgentModel';
import AssignedTasksModel from '../agent/AssignedTasks';
import CompletedPujaUserVideosModel from '../bookings/CompletedPujaMedia';
import TrackingModel from '../bookings/TrackingModel';
import CouponModel from '../coupons/CouponModel';
import CouponUsageModel from '../coupons/CouponUsageModel';
import AayanamModel from '../panchangam/AayanamModel';
import AbhijitMuhuratModel from '../panchangam/AbhijitMuhuratModel';
import AmritKaalModel from '../panchangam/AmritKaalModel';
import BrahmaMuhuratModel from '../panchangam/BrahmaMuhuratModel';
import ChoghadiyaTimingsModel from '../panchangam/ChoghadiyaModel';
import DurMuhuratModel from '../panchangam/DurMuhuratModel';
import GoodBadTimesModel from '../panchangam/GoodBadTimesModel';
import SpecificGoodBadTimingsModel from '../panchangam/GoodBadTimingsModel';
import GulikaKalamModel from '../panchangam/GulikaKalamModel';
import HoraTimingsModel from '../panchangam/HoraTimingsModel';
import KaranaDurationsModel from '../panchangam/KaranaModel';
import LunarMonthInfoModel from '../panchangam/LunarModel';
import NakshatraDurationsModel from '../panchangam/NakshatraModel';
import RahuKalamModel from '../panchangam/RahuKalamModel';
import RituInfoModel from '../panchangam/RituModel';
import SamvatInfoModel from '../panchangam/SamvatModel';
import TithiDurationsModel from '../panchangam/ThithiModel';
import VarjyamModel from '../panchangam/VarjyamModel';
import VedicWeekdayModel from '../panchangam/VedicDayModel';
import YamaGandamModel from '../panchangam/YamaGangamModel';
import YogaDurationsModel from '../panchangam/YogaModel';
import PackageFeaturesModel from '../pujas/PackageFeaturesModel';
import PujaBenefitsModel from '../pujas/PujaBenefitsModel';
import PujaDatesModel from '../pujas/pujaDatesModel';
import PujaImagesAndVideoModel from '../pujas/pujaImagesAndVediosModel';
import PujaModel from '../pujas/PujaModel';
import PujaPackagesModel from '../pujas/PujaPackagesModel';
import TempleImagesModel from '../temples/TempleImagesModel';
import TemplesModel from '../temples/TemplesModel';

// Define the attributes for the User model
interface UserAttributes {
  userid: string;
  phonenumber: string;
  password: string;
  email: string | null;     // ✅ allow null
  username: string | null;
  otp_verified: boolean;
  profile_pic_url: string | null;
  gender: string | null;
  address: string | null;
  status: string;
}


// Define the input type for optional fields
export interface UserInput extends Optional<UserAttributes, 'userid' | 'username' | 'otp_verified' | 'profile_pic_url' | 'gender' | 'address' | 'status'> {}

// Define the output type for required fields
export interface UserOutput extends Required<UserAttributes> {}

class UserModel extends Model<UserAttributes, UserInput> implements UserAttributes {
  public userid!: string;
  public phonenumber!: string;
  public password!: string;
  public email!: string;
  public username!: string | null;
  public otp_verified!: boolean;
  public profile_pic_url!: string | null;
  public gender!: string | null;
  public address!: string | null;
  public status!: string;

  // Timestamps (createdAt and updatedAt)
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Define the associations between User and BookingHistory, and Review
  public static associate(models: { AdminUsersModel: AdminUsersModel; UserModel: typeof UserModel; TemplesModel: TemplesModel; PujaModel: PujaModel; PujaPackagesModel: PujaPackagesModel; ReviewsModel: typeof ReviewsModel; AgentModel: AgentModel; AssignedTasksModel: AssignedTasksModel; TempleImagesModel: TempleImagesModel; BookingHistoryModel: typeof BookingHistoryModel; CompletedPujaMediaModel: CompletedPujaUserVideosModel; TrackingModel: TrackingModel; CouponModel: CouponModel; CouponUsageModel: CouponUsageModel; PackageFeaturesModel: PackageFeaturesModel; NakshatraDurationsModel: NakshatraDurationsModel; AayanamModel: AayanamModel; AbhijitMuhuratModel: AbhijitMuhuratModel; AmritKaalModel: AmritKaalModel; BrahmaMuhuratModel: BrahmaMuhuratModel; ChoghadiyaTimingsModel: ChoghadiyaTimingsModel; DurMuhuratModel: DurMuhuratModel; VarjyamModel: VarjyamModel; GoodBadTimesModel: GoodBadTimesModel; SpecificGoodBadTimingsModel: SpecificGoodBadTimingsModel; GulikaKalamModel: GulikaKalamModel; HoraTimingsModel: HoraTimingsModel; KaranaDurationsModel: KaranaDurationsModel; LunarMonthInfoModel: LunarMonthInfoModel; RahuKalamModel: RahuKalamModel; RituInfoModel: RituInfoModel; SamvatInfoModel: SamvatInfoModel; TithiDurationsModel: TithiDurationsModel; VedicWeekdayModel: VedicWeekdayModel; YamaGandamModel: YamaGandamModel; YogaDurationsModel: YogaDurationsModel; PujaBenefitsModel: PujaBenefitsModel; PujaImagesAndVideoModel: PujaImagesAndVideoModel; PujaDatesModel: PujaDatesModel; }) {
    // Association with BookingHistoryModel
    UserModel.hasMany(BookingHistoryModel, { foreignKey: 'userid', as: 'booking' });
UserModel.hasMany(ReviewsModel, { foreignKey: 'userid', as: 'reviews' });

  }
}

// Initialize the model
UserModel.init(
  {
    userid: {
      type: DataTypes.STRING(20),  // Change to string with a max length
      allowNull: false,
      primaryKey: true,  // Make userid the primary key
      unique: true, // Ensure it is unique
    },
    phonenumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,         // can stay
      unique: false,            // ✅ turn off uniqueness
    },    
    username: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'Kalki Seva Bhakth', // Set default username value
    },
    otp_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    profile_pic_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    gender: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    address: {
      type: DataTypes.JSON,
      allowNull: true,
    },    
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
    }
  },
  {
    sequelize: sequelizeConnection,
    tableName: 'users', // Ensure this matches the actual table name in your DB
    timestamps: true, // Enable createdAt and updatedAt columns
    createdAt: 'created', // Map Sequelize's `createdAt` to `created`
    updatedAt: 'updated', // Map Sequelize's `updatedAt` to `updated`
    underscored: true, // Optionally use snake_case for column names
  }
);

export default UserModel;
export { UserAttributes };
