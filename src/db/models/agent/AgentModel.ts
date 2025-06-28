import { DataTypes, Model, Optional } from "sequelize";
import sequelizeConnection from "../../config";

interface AgentAttributes {
  agent_id: string;
  agent_name: string;
  agent_email: string;
  agent_password: string;
  status: string;
  created_by: number | null;
  verified: boolean;
  agent_profile_image_url: string | null;

  // Personal + KYC
  gender: string | null;
  phone_number: string | null;
  dateofbirth: Date | null;
  address: string | null;
  aadhaarnumber: string | null;
  pannumber: string | null;
  bankaccount_number: string | null;
  ifsccode: string | null;
  branch: string | null;
  account_holder_name: string | null;
  account_type: string | null;

  aadhaar_image_upload: string[] | null;
  pan_image_upload: string[] | null;
  bank_image_upload: string[] | null;
  address_proof: string[] | null;

  approval_status: boolean | null;

  // Upload times
  aadhaar_uploaded_at: Date | null;
  pan_uploaded_at: Date | null;
  bank_uploaded_at: Date | null;
  address_uploaded_at: Date | null;

  // Verified times
  aadhaar_verified_at: Date | null;
  pan_verified_at: Date | null;
  bank_verified_at: Date | null;
  address_verified_at: Date | null;

  // Verified status
  aadhaar_verified_status: boolean | null;
  pan_verified_status: boolean | null;
  bank_verified_status: boolean | null;
  address_verified_status: boolean | null;
  password_change_required: boolean | null;
  available_status: boolean | null;
  kyc_submitted: boolean | null;
  last_login: Date | null;
  password_changed_at: Date | null;
}

export interface AgentInput extends Optional<AgentAttributes, "agent_id"> {}
export interface AgentOutput extends Required<AgentAttributes> {}

class AgentModel extends Model<AgentAttributes, AgentInput> implements AgentAttributes {
  public agent_id!: string;
  public agent_name!: string;
  public agent_email!: string;
  public agent_password!: string;
  public status!: string;
  public created_by!: number | null;
  public verified!: boolean;
  public agent_profile_image_url!: string | null;

  public gender!: string | null;
  public phone_number!: string | null;
  public dateofbirth!: Date | null;
  public address!: string | null;
  public aadhaarnumber!: string | null;
  public pannumber!: string | null;
  public bankaccount_number!: string | null;
  public ifsccode!: string | null;
  public branch!: string | null;
  public account_holder_name!: string | null;
  public account_type!: string | null;

  public aadhaar_image_upload!: string[] | null;
  public pan_image_upload!: string[] | null;
  public bank_image_upload!: string[] | null;
  public address_proof!: string[] | null;

  public approval_status!: boolean | null;

  public aadhaar_uploaded_at!: Date | null;
  public pan_uploaded_at!: Date | null;
  public bank_uploaded_at!: Date | null;
  public address_uploaded_at!: Date | null;

  public aadhaar_verified_at!: Date | null;
  public pan_verified_at!: Date | null;
  public bank_verified_at!: Date | null;
  public address_verified_at!: Date | null;

  public aadhaar_verified_status!: boolean | null;
  public pan_verified_status!: boolean | null;
  public bank_verified_status!: boolean | null;
  public address_verified_status!: boolean | null;
  public password_change_required!: boolean | null;
  public available_status!: boolean | null;
  public kyc_submitted!: boolean | null;
  public last_login!: Date | null;
  public password_changed_at!: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  deletedAt: any;

  public static associate(models: any) {
    AgentModel.hasMany(models.AssignedTasksModel, {
      foreignKey: 'agent_id',
      as: 'assignedTasks',
    });

    AgentModel.hasMany(models.BookingHistoryModel, {
      foreignKey: 'agent_id',
      as: 'bookings',
    });
    AgentModel.hasOne(models.WalletModel, {
      foreignKey: 'agent_id',
      as: 'wallet',
    });
    
    AgentModel.hasMany(models.WithdrawalRequestModel, {
      foreignKey: 'agent_id',
      as: 'withdrawalRequests',
    });
    
  }
}

AgentModel.init(
  {
    agent_id: {
      type: DataTypes.STRING(20),
      primaryKey: true,
    },
    agent_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    agent_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    agent_password: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: "active",
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    agent_profile_image_url: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    account_holder_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    account_type: {
      type: DataTypes.STRING(20),
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
    bank_image_upload: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    address_proof: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    approval_status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // Upload timestamps
    aadhaar_uploaded_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pan_uploaded_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    bank_uploaded_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    address_uploaded_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Verification timestamps
    aadhaar_verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pan_verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    bank_verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    address_verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Document verified status
    aadhaar_verified_status: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    pan_verified_status: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    bank_verified_status: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    address_verified_status: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    password_change_required: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    available_status: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    kyc_submitted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    password_changed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize: sequelizeConnection,
    tableName: "agent",
    timestamps: true,
    createdAt: "created",
    updatedAt: "updated",
    underscored: true,

    // ✅ Enable soft deletes
    paranoid: true,
    deletedAt: "deleted", // optional: rename column (default is 'deletedAt')
  }
);

export default AgentModel;
