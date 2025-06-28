import {
    Model,
    DataTypes,
    Optional,
    Sequelize,
  } from 'sequelize';
  import sequelizeConnection from '../../config';
  
  interface SiteSettingsAttributes {
    id: number;
    site_name: string;
    site_url: string;
    admin_email: string;
    support_email: string;
    support_phone: string;
    address: string;
    currency: string;
    currency_symbol: string;
    logo?: string; // can store file path or URL
    favicon?: string;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    google_analytics_id?: string;
    facebook_pixel_id?: string;
    created_at?: Date;
    updated_at?: Date;
  }
  
  export interface SiteSettingsCreationAttributes
    extends Optional<SiteSettingsAttributes, 'id' | 'logo' | 'favicon' | 'meta_title' | 'meta_description' | 'meta_keywords' | 'google_analytics_id' | 'facebook_pixel_id' | 'created_at' | 'updated_at'> {}
  
  export class SiteSettings
    extends Model<SiteSettingsAttributes, SiteSettingsCreationAttributes>
    implements SiteSettingsAttributes {
    public id!: number;
    public site_name!: string;
    public site_url!: string;
    public admin_email!: string;
    public support_email!: string;
    public support_phone!: string;
    public address!: string;
    public currency!: string;
    public currency_symbol!: string;
    public logo?: string;
    public favicon?: string;
    public meta_title?: string;
    public meta_description?: string;
    public meta_keywords?: string;
    public google_analytics_id?: string;
    public facebook_pixel_id?: string;
    public readonly created_at?: Date;
    public readonly updated_at?: Date;
  }
  
  export const initSiteSettingsModel = (sequelize: Sequelize) => {
    SiteSettings.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        site_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        site_url: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        admin_email: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        support_email: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        support_phone: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        address: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        currency: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        currency_symbol: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        logo: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        favicon: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        meta_title: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        meta_description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        meta_keywords: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        google_analytics_id: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        facebook_pixel_id: {
          type: DataTypes.STRING,
          allowNull: true,
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
        tableName: 'site_settings',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      }
    );
  };
  