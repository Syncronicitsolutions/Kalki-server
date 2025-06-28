import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config";

interface CompletedPujaUserVideosAttributes {
  sr_no: number;
  userid: string;
  puja_id: string;
  booking_id: string;
  video_url_path: string;
}

export interface CompletedPujaUserVideosInput
  extends Optional<CompletedPujaUserVideosAttributes, "sr_no"> {}

export interface CompletedPujaUserVideosOutput
  extends Required<CompletedPujaUserVideosAttributes> {}

class CompletedPujaUserVideosModel
  extends Model<CompletedPujaUserVideosAttributes, CompletedPujaUserVideosInput>
  implements CompletedPujaUserVideosAttributes
{
  public sr_no!: number;
  public userid!: string;
  public puja_id!: string;
  public booking_id!: string;
  public video_url_path!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CompletedPujaUserVideosModel.init(
  {
    sr_no: {
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
      allowNull: false,
      references: {
        model: "booking_history",
        key: "booking_id",
      },
      onDelete: "CASCADE",
    },
    video_url_path: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "completed_puja_user_videos",
    timestamps: true,
    createdAt: "created",
    updatedAt: "updated",
    underscored: true,
  }
);

export default CompletedPujaUserVideosModel;
export { CompletedPujaUserVideosAttributes };
