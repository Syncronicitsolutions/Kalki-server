import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config";
import PackageFeaturesModel from "./PackageFeaturesModel";
import BookingHistoryModel from "../bookings/BookingHistoryModel";
import PujaModel from "./PujaModel";

interface PujaPackagesAttributes {
  puja_id: string;
  package_id: string;
  package_name: string;
  package_description?: string | null;
  number_of_devotees?: number | null;
  price: number;
  puja_date: Date;
  puja_speciality: string;
  created_by?: number | null;
}

export interface PujaPackagesInput
  extends Optional<PujaPackagesAttributes, "package_id"> {}

class PujaPackagesModel
  extends Model<PujaPackagesAttributes, PujaPackagesInput>
  implements PujaPackagesAttributes
{
  public puja_id!: string;
  public package_id!: string;
  public package_name!: string;
  public package_description!: string;
  public number_of_devotees!: number | null;
  public price!: number;
  public puja_date!: Date;
  public puja_speciality!: string; // Remove default value
  public created_by!: number | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public features?: PackageFeaturesModel[];

  public static associate(models: any) {
    PujaPackagesModel.belongsTo(models.PujaModel, {
      as: 'packageParentPuja',
      foreignKey: 'puja_id'
    });

    PujaPackagesModel.hasMany(models.PackageFeaturesModel, {
      as: 'packageFeatureItems',
      foreignKey: 'package_id',
      sourceKey: 'package_id'
    });

    PujaPackagesModel.hasMany(models.BookingHistoryModel, {
      as: 'packageBookings',
      foreignKey: 'package_id'
    });
  }
}

PujaPackagesModel.init(
  {
    puja_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: {
        model: "puja",
        key: "puja_id",
      },
      onDelete: "CASCADE",
    },
    package_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
      primaryKey: true,
    },
    package_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    package_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    number_of_devotees: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    puja_speciality: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    puja_date: {
      type: DataTypes.DATEONLY, // DATE without time component
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "puja_packages",
    timestamps: true,
    createdAt: "created",
    updatedAt: "updated",
    underscored: true,
  }
);

export default PujaPackagesModel;
