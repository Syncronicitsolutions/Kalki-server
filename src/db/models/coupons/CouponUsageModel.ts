import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config"; // Your sequelize connection

interface CouponUsageAttributes {
  usage_id: number;
  coupon_id: number;
  userid: number;
  used_at: Date;
}

export interface CouponUsageInput extends Optional<CouponUsageAttributes, "usage_id"> {}

export interface CouponUsageOutput extends Required<CouponUsageAttributes> {}

class CouponUsageModel extends Model<CouponUsageAttributes, CouponUsageInput> implements CouponUsageAttributes {
  public usage_id!: number;
  public coupon_id!: number;
  public userid!: number;
  public used_at!: Date;
}

CouponUsageModel.init(
  {
    usage_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      unique: true,
      autoIncrement: true,
    },
    coupon_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "coupons", // Foreign key referencing the coupons table
        key: "coupon_id",
      },
      onDelete: "CASCADE",
    },
    userid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "coupon_usage",
    timestamps: false, // No createdAt or updatedAt for usage
  }
);

export default CouponUsageModel;
