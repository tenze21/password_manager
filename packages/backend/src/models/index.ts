/**
 * Model Association Setup
 * 
 * Import all models and define their relationships
 * Must be done AFTER all models are defined to avoid circular dependencies
 */

import { User } from "./User.js";
import { PasswordEntry } from "./PasswordEntry.js";
import { TwoFactorSetting } from "./TwoFactorSetting.js";

//DEFINE ASSOCIATIONS

/**
 * User <-> PasswordEntry (One-to-Many)
 * One user has many password entries
 */
User.hasMany(PasswordEntry, {
    foreignKey: 'userId',
    as: 'passwordEntries',
    onDelete: 'CASCADE'
});

PasswordEntry.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

/**
 * User <-> TwoFactorSetting (One-to-One)
 * One user has one 2FA setting
 */
User.hasOne(TwoFactorSetting, {
    foreignKey: 'userId',
    as: 'twoFactorSettings',
    onDelete: 'CASCADE'
});

TwoFactorSetting.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

export {User, PasswordEntry, TwoFactorSetting};
/**
 * Export sequelize instance for direct queries if needed
 */
export {sequelize} from '@config/database.js';