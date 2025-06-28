import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config";
import PujaModel from "./PujaModel";

interface PujaBenefitsAttributes {
  puja_id: string;
  benefit_heading: string;
  benefit_name: string;
  created_by: number | null;
}

export interface PujaBenefitsInput extends Optional<PujaBenefitsAttributes, "created_by"> {}

class PujaBenefitsModel
  extends Model<PujaBenefitsAttributes, PujaBenefitsInput>
  implements PujaBenefitsAttributes
{
  public puja_id!: string;
  public benefit_heading!: string;
  public benefit_name!: string;
  public created_by!: number | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  static filter: any;

  // Define associations
  public static associate(models: any) {
    PujaBenefitsModel.belongsTo(models.PujaModel, {
      foreignKey: "puja_id",
      targetKey: "puja_id",
      as: "benefitPuja",
    });
  }
}

PujaBenefitsModel.init(
  {
    puja_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: {
        model: "puja", // Assuming "puja" is the name of your puja table
        key: "puja_id",
      },
      onDelete: "CASCADE",
    },
    benefit_heading: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    benefit_name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "puja_benefits",
    timestamps: true,
    underscored: true,
  }
);

export default PujaBenefitsModel;
