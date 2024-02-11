'use strict';

module.exports = (sequelize, DataTypes) => {
    const mota = sequelize.define('mota', {
        ip: {
            type: DataTypes.STRING(30),
            unique: true
        },
        rol: {
            type: DataTypes.ENUM(['MAESTRO', 'ESCLAVO']),
            defaultValue: 'ESCLAVO'
        },
        descripcion: {
            type: DataTypes.STRING(200),
            allowNull: false
        },
        estado: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        external_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        }
    }, {timestamps: false, freezeTableName: true});
    mota.associate = function(models){
        mota.hasMany(models.datosClimaticos,{foreignKey:'id_mota', as:'datosClimaticos'}); // una mota tiene muchos datos climaticos
        mota.hasOne(models.sensor, { foreignKey: 'id_mota', as: 'sensor' }); // una mota tiene un sensor
        mota.belongsTo(models.persona, {foreignKey: 'id_persona'});
    };

    return mota;
};