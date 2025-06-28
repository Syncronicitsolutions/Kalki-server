import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config";
import PujaPackagesModel from "./PujaPackagesModel";

interface PackageFeaturesAttributes {
  puja_id: string;
  package_id: string;
  feature: string;
  created_by: number | null;
}

export interface PackageFeaturesInput
  extends Optional<PackageFeaturesAttributes, "created_by"> {}

class PackageFeaturesModel
  extends Model<PackageFeaturesAttributes, PackageFeaturesInput>
  implements PackageFeaturesAttributes
{
  public puja_id!: string;
  public package_id!: string;
  public feature!: string;
  public created_by!: number | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  static filter: any;

  // Define associations
  public static associate(models: any) {
    PackageFeaturesModel.belongsTo(models.PujaPackagesModel, {
      as: 'featurePujaPackage',
      foreignKey: 'package_id',
      targetKey: 'package_id'
    });
  }
}

PackageFeaturesModel.init(
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
      references: {
        model: "puja_packages",
        key: "package_id",
      },
      onDelete: "CASCADE",
    },
    feature: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "package_features",
    timestamps: true,
    underscored: true,
  }
);

export default PackageFeaturesModel;
