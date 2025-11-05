'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('password_entries', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      
      website_url: {
        type: Sequelize.STRING(2048),
        allowNull: true,
      },
      
      website_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      
      encrypted_username: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      
      encrypted_password: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      
      encrypted_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      
      folder: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      
      favorite: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    
    // Indexes for faster queries
    await queryInterface.addIndex('password_entries', ['user_id'], {
      name: 'password_entries_user_id',
    });
    
    await queryInterface.addIndex('password_entries', ['user_id', 'favorite'], {
      name: 'password_entries_user_id_favorite',
    });
    
    await queryInterface.addIndex('password_entries', ['user_id', 'folder'], {
      name: 'password_entries_user_id_folder',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('password_entries');
  }
};