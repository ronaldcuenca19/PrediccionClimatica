'use strict';

module.exports = (sequelize, DataTypes) => {
    const persona = sequelize.define('persona', {
        apellidos: { type: DataTypes.STRING(100) },
        nombres: { type: DataTypes.STRING(100) },
        celular: { type: DataTypes.STRING(20), defaultValue: "" },
        cedula: { type: DataTypes.STRING(20), defaultValue: "" },
        external_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 }
    }, { timestamps: false, freezeTableName: true });
    persona.associate = function (models) {
        persona.hasOne(models.cuenta, { foreignKey: 'id_persona', as: 'cuenta' }); //una persona tiene una cuenta
        persona.belongsTo(models.rol, { foreignKey: 'id_rol' }); //una persona tiene un rol o mas de uno
        persona.hasMany(models.mota, { foreignKey: 'id_persona', as: 'mota'})
    };
    return persona;
};