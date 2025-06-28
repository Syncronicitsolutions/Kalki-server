import {
    Model,
    DataTypes,
    Optional,
    Sequelize
  } from 'sequelize';
  import sequelizeConnection from "../../config";
  
  interface HeroSlideAttributes {
    id: number;
    image_url: string;
    title: string;
    description: string;
    button_label?: string;
    button_link?: string;
    created_at?: Date;
    updated_at?: Date;
  }
  
  interface HeroSlideCreationAttributes extends Optional<HeroSlideAttributes, 'id'> {}
  
  export class HeroSlide
    extends Model<HeroSlideAttributes, HeroSlideCreationAttributes>
    implements HeroSlideAttributes
  {
    public id!: number;
    public image_url!: string;
    public title!: string;
    public description!: string;
    public button_label!: string;
    public button_link!: string;
    public readonly created_at!: Date;
    public readonly updated_at!: Date;
  }
  
  export const initHeroSlideModel = (sequelize: Sequelize) => {
    HeroSlide.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        image_url: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        title: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        button_label: {
          type: DataTypes.STRING,
          defaultValue: 'Book Puja Now',
        },
        button_link: {
          type: DataTypes.STRING,
          defaultValue: '/book-puja',
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: 'hero_slides',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      }
    );
  };
  