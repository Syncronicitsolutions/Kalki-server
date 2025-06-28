import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config";
import PujaPackagesModel from "./PujaPackagesModel";
import BookingHistoryModel from "../bookings/BookingHistoryModel";
import PujaImagesAndVideoModel from "./pujaImagesAndVediosModel";
import ReviewsModel from "./ReviewsModel";
import PujaDatesModel from "./pujaDatesModel";
import PujaBenefitsModel from "./PujaBenefitsModel";

interface PujaAttributes {
  puja_id: string;
  puja_name: string;
  puja_special?: string | null;
  puja_description?: string | null;
  temple_name?: string | null;
  temple_location?: string | null;
  puja_thumbnail_url?: string | null;
  temple_description?: string | null;
  temple_image_url?: string | null;
  status: string;
  created_by?: number | null;
}

export interface PujaInput
  extends Optional< 
    PujaAttributes, 
    | "puja_id" 
    | "puja_special" 
    | "puja_description" 
    | "temple_name" 
    | "temple_location" 
    | "puja_thumbnail_url" 
    | "temple_description" 
    | "temple_image_url" 
    | "status" 
    | "created_by" 
  > {}

export interface PujaOutput extends Required<PujaAttributes> {}

class PujaModel
  extends Model<PujaAttributes, PujaInput>
  implements PujaAttributes
{
  public puja_id!: string;
  public puja_name!: string;
  public puja_special!: string | null;
  public puja_description!: string | null;
  public temple_name!: string | null;
  public temple_location!: string | null;
  public puja_thumbnail_url!: string | null;
  public temple_description!: string | null;
  public temple_image_url!: string | null;
  public status!: string;
  public created_by!: number | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public packages!: PujaPackagesModel[];
  public puja_dates!: PujaDatesModel[];
  public bookingHistory!: BookingHistoryModel[];
  public pujaImagesAndVideos!: PujaImagesAndVideoModel[];
  public reviews!: ReviewsModel[];
  public pujaBenefits!: PujaBenefitsModel[]; // Add this line to declare the pujaBenefits property

  public static associate(models: any) {
    PujaModel.hasMany(models.PujaPackagesModel, {
      as: 'pujaaPacks',
      foreignKey: 'puja_id',
    });
    

    PujaModel.hasMany(models.PujaDatesModel, {
      as: 'pujaAvailableDates',
      foreignKey: 'puja_id'
    });

    PujaModel.hasMany(models.BookingHistoryModel, {
      as: 'pujaBookings',
      foreignKey: 'puja_id'
    });

    PujaModel.hasMany(models.PujaImagesAndVideoModel, {
      as: 'pujaMedia',
      foreignKey: 'puja_id'
    });

    PujaModel.hasMany(models.ReviewsModel, {
      as: 'pujaReviews',
      foreignKey: 'puja_id'
    });

    PujaModel.hasMany(models.PujaBenefitsModel, {
      as: 'pujaBenefitItems',
      foreignKey: 'puja_id'
    });
    PujaModel.belongsToMany(models.TemplesModel, {
      through: "temple_puja_mappings",
      foreignKey: "puja_id",
      otherKey: "temple_id",
      as: "temples"
    });
    
  }
}

PujaModel.init(
  {
    puja_id: {
      type: DataTypes.STRING(20),
      primaryKey: true,
    },
    puja_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    puja_special: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    puja_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    temple_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    temple_location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    puja_thumbnail_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    temple_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    temple_image_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "active",
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "puja",
    timestamps: true,
    createdAt: "created",
    updatedAt: "updated",
    underscored: true,
  }
);

export default PujaModel;
