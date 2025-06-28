import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config";

// Define the attributes for the TempleImages model
interface TempleImagesAttributes {
  sr_no: number;
  temple_id: number;
  image_urls: string[]; // Array of image URLs
  video_urls: string[]; // Array of video URLs
}

// Define the input type for optional fields
export interface TempleImagesInput
  extends Optional<TempleImagesAttributes, "sr_no"> {}

// Define the output type for required fields
export interface TempleImagesOutput extends Required<TempleImagesAttributes> {}

class TempleImagesModel
  extends Model<TempleImagesAttributes, TempleImagesInput>
  implements TempleImagesAttributes
{
  public sr_no!: number;
  public temple_id!: number;
  public image_urls!: string[];
  public video_urls!: string[];

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the model
TempleImagesModel.init(
  {
    sr_no: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    temple_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "temples",
        key: "temple_id",
      },
      onDelete: "CASCADE",
    },
    image_urls: {
      type: DataTypes.ARRAY(DataTypes.TEXT), // Store multiple image URLs
      allowNull: true,
    },
    video_urls: {
      type: DataTypes.ARRAY(DataTypes.TEXT), // Store multiple video URLs
      allowNull: true,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "temple_images",
    timestamps: true,
    createdAt: "created",
    updatedAt: "updated",
    underscored: true,
  }
);

export default TempleImagesModel;
