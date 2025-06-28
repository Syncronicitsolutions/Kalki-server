import { DataTypes, Model, Optional } from 'sequelize';
import sequelizeConnection from '../../config';

interface ImageSlideAttributes {
  id: number; // Changed from string to number
  title: string;
  description: string;
  button_text: string;
  button_link: string;
  image_url: string[]; // JSON array of URLs
}

export interface ImageSlideInput extends Optional<ImageSlideAttributes, 'id'> {}
export interface ImageSlideOutput extends Required<ImageSlideAttributes> {}

class CarouselModel extends Model<ImageSlideAttributes, ImageSlideInput> implements ImageSlideAttributes {
  public id!: number;
  public title!: string;
  public description!: string;
  public button_text!: string;
  public button_link!: string;
  public image_url!: string[];

  public readonly created!: Date;
  public readonly updated!: Date;
}

CarouselModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    button_text: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    button_link: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    image_url: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: 'image_slides',
    timestamps: true,
    createdAt: 'created',
    updatedAt: 'updated',
    underscored: true,
  }
);

export default CarouselModel;
export { ImageSlideAttributes };
