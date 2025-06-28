import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config";
import UserModel from "../users/usersModel";
import PujaModel from "../pujas/PujaModel";
import BookingHistoryModel from "../bookings/BookingHistoryModel";

interface ReviewsAttributes {
  review_id: number;
  userid: string;
  puja_id: string;
  booking_id: string;
  rating: number;
  review: string | null;
  uploads_url: string[];
  verified_user: boolean;
  review_verified: boolean;
  created?: Date;
  updated?: Date;
}

export interface ReviewsInput
  extends Optional<ReviewsAttributes, "review_id" | "review" | "uploads_url"> {}

export interface ReviewsOutput extends Required<ReviewsAttributes> {}

class ReviewsModel
  extends Model<ReviewsAttributes, ReviewsInput>
  implements ReviewsAttributes
{
  public review_id!: number;
  public userid!: string;
  public puja_id!: string;
  public booking_id!: string;
  public rating!: number;
  public review!: string | null;
  public uploads_url!: string[];
  public verified_user!: boolean;
  public review_verified!: boolean;

  public readonly created!: Date;
  public readonly updated!: Date;

  public static associate(models: any) {
    ReviewsModel.belongsTo(models.UserModel, {
      as: "reviewUser",
      foreignKey: "userid",
    });

    ReviewsModel.belongsTo(models.PujaModel, {
      as: "reviewedPuja",
      foreignKey: "puja_id",
    });

    ReviewsModel.belongsTo(models.BookingHistoryModel, {
      as: "reviewedBooking",
      foreignKey: "booking_id",
    });
  }
}

ReviewsModel.init(
  {
    review_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
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
    booking_id: {
      type: DataTypes.STRING(20),
      allowNull: true,
      references: {
        model: "booking_history",
        key: "booking_id",
      },
      onDelete: "SET NULL",
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    review: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    uploads_url: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },
    verified_user: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    review_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "reviews",
    timestamps: true,
    createdAt: "created",
    updatedAt: "updated",
    underscored: true,
  }
);

export default ReviewsModel;
