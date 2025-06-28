import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config";
import PujaModel from "../pujas/PujaModel";
import ReviewsModel from "../pujas/ReviewsModel";
import UserModel from "../users/usersModel";
import PujaDatesModel from "../pujas/pujaDatesModel";
import AssignedTasksModel from "../agent/AssignedTasks";
import AgentModel from "../agent/AgentModel";
import PujaPackagesModel from "../pujas/PujaPackagesModel";

// Define attributes interface
interface BookingHistoryAttributes {
  booking_id: string;
  userid: string;
  puja_id: string;
  agent_id?: string; // ✅ Make it optional here
  full_name: string;
  phone_number: string;
  booking_email: string;
  puja_date: Date;
  puja_name: string;
  package_id: string;
  package_name: string;
  devotee_names: string[];
  devotee_gothra: string[];
  devotee_date_of_birth: Date[];
  special_instructions: string | null;
  amount: number;
  gst_amount: number;
  discount_amount: number;
  coupon_code: string | null;
  total_amount: number;
  shipping_address: any | null;
  billing_address: any | null;
  is_shipping_address_same_as_billing: boolean;
  booking_status: string;
  puja_status: string;
  payment_method: string;
  payment_reference: string;
  completed_image_url_path: string | null;
  completed_video_url_path: string | null;
  payment_status: string;
  payment_type: string;
  order_id: string | null;
  payment_session_id: string | null;
  payment_gateway: string | null;
  tracking_number: string;
  tracking_link: string | null;
  review_status: boolean;
  whatsapp_sent: boolean;
  
}

// Define input and output interfaces
export interface BookingHistoryInput
  extends Optional<
    BookingHistoryAttributes,
    | "booking_id"
    | "userid"
    | "puja_id"
    | "agent_id" // ✅ Add this line
    | "full_name"
    | "phone_number"
    | "booking_email"
    | "booking_id"
    | "coupon_code"
    | "shipping_address"
    | "billing_address"
    | "booking_status"
    | "puja_status"
    | "special_instructions"
    | "is_shipping_address_same_as_billing"
    | "payment_reference"
    | "completed_image_url_path"
    | "completed_video_url_path"
    | "payment_status"
    | "payment_type"
    | "order_id"
    | "payment_session_id"
    | "payment_gateway"
    | "tracking_number"
    | "tracking_link"
    | "review_status"
    | "whatsapp_sent"
  > {}

export interface BookingHistoryOutput
  extends Required<BookingHistoryAttributes> {}

  class BookingHistoryModel
  extends Model<BookingHistoryAttributes, BookingHistoryInput>
  implements BookingHistoryAttributes
{
  public booking_id!: string;
  public userid!: string;
  public puja_id!: string;
  public agent_id!: string; // ✅ Add this line
  public full_name!: string;
  public phone_number!: string;
  public booking_email!: string;
  public puja_date!: Date;
  public puja_name!: string;
  public package_id!: string;
  public package_name!: string;
  public devotee_names!: string[];
  public devotee_gothra!: string[];
  public devotee_date_of_birth!: Date[];
  public special_instructions!: string | null;
  public amount!: number;
  public gst_amount!: number;
  public discount_amount!: number;
  public coupon_code!: string | null;
  public total_amount!: number;
  public shipping_address!: any | null;
  public billing_address!: any | null;
  public is_shipping_address_same_as_billing!: boolean;
  public booking_status!: string;
  public puja_status!: string;
  public payment_method!: string;
  public payment_reference!: string;
  public completed_image_url_path!: string | null;
  public completed_video_url_path!: string | null;
  public payment_status!: string;
  public payment_type!: string;
  public order_id!: string | null;
  public payment_session_id!: string | null;
  public payment_gateway!: string | null;
  public tracking_number!: string;
  public tracking_link!: string | null;
  public review_status!: boolean;
  public whatsapp_sent!: boolean; // ✅ Add this line

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // ✅ Association properties
  public user?: UserModel;
  public bookedPuja?: PujaModel;
  public bookedPackage?: PujaPackagesModel;
  public bookingReviews?: ReviewsModel[];
  public assignedAgent?: AgentModel[];
  public assignedBookingTasks?: AssignedTasksModel[];
 

  // ✅ Put associate inside the class
  public static associate(models: any) {
    BookingHistoryModel.belongsTo(models.UserModel, {
      foreignKey: 'userid',
      as: 'user',
    });
  
    BookingHistoryModel.belongsTo(models.PujaModel, {
      foreignKey: 'puja_id',
      as: 'bookedPuja',
    });
  
    BookingHistoryModel.belongsTo(models.PujaPackagesModel, {
      foreignKey: 'package_id',
      as: 'bookedPackage',
    });
  
    BookingHistoryModel.belongsTo(models.AgentModel, {
      foreignKey: 'agent_id',
      as: 'bookingAgent',
    });
  
    BookingHistoryModel.hasMany(models.ReviewsModel, {
      foreignKey: 'booking_id',
      as: 'bookingReviews',
    });
  
    BookingHistoryModel.hasMany(models.AssignedTasksModel, {
      foreignKey: 'booking_id',
      as: 'assignedBookingTasks',
    });
  }
  
}


BookingHistoryModel.init(
  {
    booking_id: {
      type: DataTypes.STRING(20),
      primaryKey: true,
    },
    userid: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: {
        model: "users",
        key: "userid",
      },
      onDelete: "CASCADE",
    },
    puja_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: {
        model: "puja",
        key: "puja_id",
      },
      onDelete: "CASCADE",
    },
    agent_id: {
      type: DataTypes.STRING(20),
      allowNull: true,
      references: {
        model: "agent",
        key: "agent_id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },    
    
    
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    booking_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    puja_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    puja_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    package_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: {
        model: "puja_packages",
        key: "package_id",
      },
      onDelete: "CASCADE",
    },
    package_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    devotee_names: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    devotee_gothra: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    devotee_date_of_birth: {
      type: DataTypes.ARRAY(DataTypes.DATEONLY),
      allowNull: false,
    },
    special_instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    gst_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    coupon_code: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    shipping_address: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    billing_address: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    is_shipping_address_same_as_billing: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    booking_status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "pending",
    },
    puja_status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "pending",
    },
    payment_method: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    payment_reference: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    completed_image_url_path: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    completed_video_url_path: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    payment_status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "pending",
    },
    payment_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "unknown",
    },
    order_id: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true, // ensure it's unique for safety
    },
    payment_session_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    payment_gateway: {
      type: DataTypes.STRING,
      allowNull: true,
    },

      tracking_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    tracking_link: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    review_status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    whatsapp_sent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "booking_history",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    underscored: true,
  }
);

export default BookingHistoryModel;
