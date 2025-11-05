import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey, NonAttribute, Association } from "sequelize";
import { sequelize } from "@config/database.js";
import { User } from "./User.js";
import {TwoFactorMethod} from '@password_manager/shared';

/**
 * TwoFactorSetting Model
 * Stores 2FA configuration for users
 */
export class TwoFactorSetting extends Model<InferAttributes<TwoFactorSetting>, InferCreationAttributes<TwoFactorSetting>>{
    declare id: CreationOptional<string>;
    declare userId: ForeignKey<User['id']>;
    declare method: TwoFactorMethod;
    declare enabled: CreationOptional<boolean>;

    /**
   * TOTP secret (encrypted)
   * Only used for TwoFactorMethod.TOTP
   */
    declare secret: string | null;

    /**
   * Backup codes (encrypted)
   * JSON array of one-time use codes
   */
  declare backupCodes: string | null;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare user?: NonAttribute<User>;
  declare static associations:{
    user: Association<TwoFactorSetting, User>;
  };
}

TwoFactorSetting.init({
    id:{
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId:{
        type: DataTypes.UUID,
        allowNull: false,
        unique: true, //one 2FA setting per user
        references:{
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    method:{
        type: DataTypes.ENUM(...Object.values(TwoFactorMethod)),
        allowNull: false,
    },
    enabled:{
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    secret:{
        type: DataTypes.TEXT,
        allowNull: true
    },
    backupCodes:{
        type: DataTypes.TEXT,
        allowNull: true
    },
    createdAt:{
        type: DataTypes.DATE,
        allowNull: false
    },
    updatedAt:{
        type: DataTypes.DATE,
        allowNull: false
    }
},
{
    sequelize,
    modelName: 'TwoFactorSetting',
    tableName: 'two_factor_settings',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['user_id']
        }
    ]
}
);