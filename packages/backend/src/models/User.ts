import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, NonAttribute, Association } from "sequelize";
import { sequelize } from "@config/database.js";

/**
 * User Model

 * TypeScript + Sequelize pattern:
 * 1. Extend Model with InferAttributes and InferCreationAttributes
 * 2. Use CreationOptional for auto-generated fields (id, timestamps)
 * 3. Use NonAttribute for fields that exist in TS but not in DB
 */

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>>{
    // ATTRIBUTES (Database Columns)

    /**
     * Primary key - auto-generated UUID
     * CreationOptional means it's optional during creation
     * (database will generate it)
   */
  declare id: CreationOptional<string>;

  /**
   * User's email address (unique, used for login)
   */
  declare email: string;

  /**
   * Email verification status
   */
  declare emailVerified: CreationOptional<boolean>;

  /**
   * Master password hash (derived from user's master password)
   * Used for authentication - never the actual master password!
   * 
   * Security: We hash the already-hashed password from client
   * Double hashing: Client uses Argon2, server uses bcrypt
   */
  declare masterPasswordHash: string;

  /**
   * User's private key, encrypted with master password
   * Used to decrypt passwords in the vault
   */
  declare encryptedPrivateKey: string;

  /**
   * User's public key
   * Used for sharing passwords (future feature)
   */
  declare publicKey: string;

  /**
   * Salt used for key derivation
   * Client needs this to derive encryption key from master password
   */
  declare salt: string;

  /**
   * Failed login attempt tracking
   */
  declare failedLoginAttempts: CreationOptional<number>;

  /**
   * Account lock timestamp
   * If set, account is locked until this time
   */
  declare lockedUntil: CreationOptional<Date | null>;

  /**
   * Timestamps (auto-managed by Sequelize)
   */
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

    // ASSOCIATION (Relationships)

     /**
   * NonAttribute tells TypeScript this exists but isn't a DB column
   * It's populated by associations
   */
  declare passwordEntries?: NonAttribute<PasswordEntry[]>;//one user -> many password entries
  declare twoFactorSettings?: NonAttribute<TwoFactorSetting>;//one user -> one two factor setting

  /**
   * Association metadata (for TypeScript)
   */
  declare static associations:{
    passwordEntries: Association<User, PasswordEntry>;
    twoFactorSettings: Association<User, TwoFactorSetting>;
  }
}
/**
* Initialize the model
* Defines table structure and constraints
*/

User.init(
  {
      // Column definitions
      id:{
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
      },
      email:{
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {isEmail: true}
      },
      emailVerified:{
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      masterPasswordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      encryptedPrivateKey:{
        type: DataTypes.TEXT,
        allowNull: false
      },
      publicKey: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      salt:{
        type: DataTypes.STRING(255),
        allowNull: false
      },
      failedLoginAttempts:{
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      lockedUntil:{
        type: DataTypes.DATE,
        allowNull: true
      },
      createdAt:{
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt:{
        type: DataTypes.DATE,
        allowNull: false,
      }
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    indexes:[
        {
            unique: true,
            fields:['email']
        }
    ]
  }
);

/**
 * Import PasswordEntry here to avoid circular dependency
 * We'll define associations after all models are created
 */
import {PasswordEntry} from './PasswordEntry.js';
import {TwoFactorSetting} from './TwoFactorSetting.js';

/*
    `CreationOptional<T>:`
    - Field is optional when CREATING (INSERT)
    - Field is required when READING (SELECT)
    - Used for: IDs, timestamps, default values
*/

/*
    - `InferAttributes` - TypeScript infers what comes OUT of the database.
    - `InferCreationAttributes` - TypeScript infers what goes INTO the database.
    - `declare` - tells TypeScript "this property exists, but don't initialize it", Without declare, TypeScript would expect you to initialize in constructor.
    - `NonAttribute<T>` - Tells Sequelize: "This is NOT a database column", Used for associations and computed properties, TypeScript allows it, but Sequelize won't create a column
*/