import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config";

interface AgentDetailsAttributes {
  agent_id: number;
  gender: string | null;
  phone_number: string | null;
  dateofbirth: Date | null;
  address: string | null;
  aadhaarnumber: string | null;
  pannumber: string | null;
  bankaccount_number: string | null;
  ifsccode: string | null;
  branch: string | null;

  aadhaar_image_upload: string[] | null;
  pan_image_upload: string[] | null;
}
export interface AgentDetailsInput
  extends Optional<AgentDetailsAttributes, "agent_id"> {}
export interface AgentDetailsOutput extends Required<AgentDetailsAttributes> {}

class AgentDetailsModel
  extends Model<AgentDetailsAttributes, AgentDetailsInput>
  implements AgentDetailsAttributes
{
  public agent_id!: number;
  public gender!: string | null;
  public phone_number!: string | null;
  public dateofbirth!: Date | null;
  public address!: string | null;
  public aadhaarnumber!: string | null;
  public pannumber!: string | null;
  public bankaccount_number!: string | null;
  public ifsccode!: string | null;
  public branch!: string | null;

  public aadhaar_image_upload!: string[] | null;
  public pan_image_upload!: string[] | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AgentDetailsModel.init(
  {
    agent_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      references: {
        model: "agent",
        key: "agent_id",
      },
      onDelete: "CASCADE",
    },
    gender: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    dateofbirth: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    aadhaarnumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    pannumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    bankaccount_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    ifsccode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    branch: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    aadhaar_image_upload: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    pan_image_upload: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "agent_details",
    timestamps: true,
    createdAt: "created",
    updatedAt: "updated",
    underscored: true,
  }
);

export default AgentDetailsModel;
export { AgentDetailsAttributes };
