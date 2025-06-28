import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config";

interface PujaImagesAndVideoAttributes {
  sr_no: number;
  puja_id: string;
  puja_images_url?: string[] | null;
  puja_video_url?: string[] | null;
  media_type: 'image' | 'video';
  created?: Date;
  updated?: Date;
}

export interface PujaImagesAndVideoInput
  extends Optional<PujaImagesAndVideoAttributes, 'sr_no' | 'puja_images_url' | 'puja_video_url' | 'created' | 'updated'> {}

export interface PujaImagesAndVideoOutput
  extends Required<PujaImagesAndVideoAttributes> {}

class PujaImagesAndVideoModel
  extends Model<PujaImagesAndVideoAttributes, PujaImagesAndVideoInput>
  implements PujaImagesAndVideoAttributes {
  public sr_no!: number;
  public puja_id!: string;
  public puja_images_url!: string[] | null;
  public puja_video_url!: string[] | null;
  public media_type!: 'image' | 'video';
  public readonly created!: Date;
  public readonly updated!: Date;

  public static associate(models: any) {
    PujaImagesAndVideoModel.belongsTo(models.PujaModel, {
      as: 'mediaPuja',
      foreignKey: 'puja_id'
    });
  }
}

PujaImagesAndVideoModel.init(
  {
    sr_no: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
    puja_images_url: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true, // ✅ Now optional
    },
    puja_video_url: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true, // ✅ Now optional
    },
    media_type: {
  type: DataTypes.ENUM('image', 'video'),
  allowNull: true, // <--- make nullable for syncing
},
    created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "puja_images_and_video",
    timestamps: true,
    createdAt: "created",
    updatedAt: "updated",
    underscored: true,
  }
);

export default PujaImagesAndVideoModel;
export { PujaImagesAndVideoAttributes };
