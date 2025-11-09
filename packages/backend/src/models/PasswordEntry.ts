import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey, NonAttribute, Association } from "sequelize";
import { sequelize } from "@config/database.js";
import { User } from "./User.js";

/**
 * PasswordEntry Model
 * Stores encrypted password entries in the vault
 */

export class PasswordEntry extends Model<InferAttributes<PasswordEntry>, InferCreationAttributes<PasswordEntry>> {
    declare id: CreationOptional<string>;

    /**
   * Foreign key to User
   * ForeignKey<T> tells TypeScript this references User.id
   */
    declare userId: ForeignKey<User['id']>;
    declare websiteUrl: string | null;
    declare websiteName: string;

    /**
     * Encrypted fields
     * TEXT type for potentially large encrypted data
     */
    declare encryptedUsername: string;
    declare encryptedPassword: string;
    declare encryptedNotes: string | null;

    declare folder: string | null;
    declare favorite: CreationOptional<boolean>;

    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;

    /**
     * Belongs to one User
     */
    declare user?: NonAttribute<User>;

    declare static associations: {
        user: Association<PasswordEntry, User>;
    };
}

PasswordEntry.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE', //Delete entries when user is deleted
        onUpdate: 'CASCADE'
    },
    websiteUrl: {
        type: DataTypes.STRING(2048),
        allowNull: true,
        validate: {
            isUrl: true,
        }
    },
    websiteName: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    encryptedUsername: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    encryptedPassword: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    encryptedNotes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    folder: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    favorite: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
    }
},
    {
        sequelize,
        modelName: 'PasswordEntry',
        tableName: 'password_entries',
        timestamps: true,
        indexes: [
            {
                fields: ['user_id'],
            },
            {
                fields: ['user_id', 'favourite']
            },
            {
                fields: ['user_id', 'folder']
            }
        ]
    }
);