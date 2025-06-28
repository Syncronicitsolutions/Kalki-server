import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config"; // Your sequelize connection

interface CouponAttributes {
  coupon_id: number;
  coupon_code: string;
  discount_amount: number;
  discount_type: string;
  discount_percentage?: number; // Percentage discount (optional)
  maximum_discount_amount?: number; // Maximum discount amount (optional)
  description?: string; // Description of the coupon (optional)
  expiration_date?: Date;
  usage_limit: number;
  usage_count: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CouponInput extends Optional<CouponAttributes, "coupon_id" | "is_active"> {}

export interface CouponOutput extends Required<CouponAttributes> {}

class CouponModel extends Model<CouponAttributes, CouponInput> implements CouponAttributes {
  public coupon_id!: number;
  public coupon_code!: string;
  public discount_amount!: number;
  public discount_type!: string;
  public discount_percentage?: number; // Optional
  public maximum_discount_amount?: number; // Optional
  public description?: string; // Optional description
  public expiration_date?: Date;
  public usage_limit!: number;
  public usage_count!: number;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

CouponModel.init(
  {
    coupon_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: true,
      autoIncrement: true,
    },
    coupon_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    discount_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [["percentage", "fixed"]], // The discount can either be percentage or fixed
      },
    },
    discount_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0, // Ensure percentage is not negative
        max: 100, // Max 100%
      },
    },
    maximum_discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: "", // Optional description of the coupon
    },
    expiration_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    usage_limit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    usage_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "coupons",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    underscored: true,
  }
);

export default CouponModel;
