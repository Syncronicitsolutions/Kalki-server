import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config";

interface TemplePujaMappingAttributes {
  id: number;
  temple_id: number;
  puja_id: string;
  created?: Date;
  updated?: Date;
}

export interface TemplePujaMappingCreationAttributes
  extends Optional<TemplePujaMappingAttributes, "id" | "created" | "updated"> {}

class TemplePujaMappingModel extends Model<
  TemplePujaMappingAttributes,
  TemplePujaMappingCreationAttributes
> implements TemplePujaMappingAttributes {
  public id!: number;
  public temple_id!: number;
  public puja_id!: string;

  public readonly created!: Date;
  public readonly updated!: Date;
}

TemplePujaMappingModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    temple_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    puja_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "temple_puja_mappings",
    timestamps: true,
    createdAt: "created",      // use created instead of createdAt
    updatedAt: "updated",      // use updated instead of updatedAt
    underscored: true,
  }
);

export default TemplePujaMappingModel;
