'use strict';
 
module.exports = (sequelize, DataTypes) => {
    const sensor = sequelize.define('sensor', {
        nombre: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        descripcion: {
            type: DataTypes.STRING(200),
            allowNull: false,
            defaultValue: 'NONE'
        },
        tipo_sensor: {
            type: DataTypes.ENUM(['TEMPERATURA/HUMEDAD', 'TEMPERATURA/PRESION', 'OTROS']),
            defaultValue: 'OTROS'
        },
        external_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
        },
        estado:{type:DataTypes.BOOLEAN, defaultValue: true},

    },{timestamps: false, freezeTableName: true});
    sensor.associate = function(models){
        sensor.belongsTo(models.mota,{foreignKey:'id_mota', as:'mota'}); //un sensor esta asociado a una mota
    };
    return sensor;
};