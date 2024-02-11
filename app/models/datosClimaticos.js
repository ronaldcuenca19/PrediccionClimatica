'use strict';
 
module.exports = (sequelize, DataTypes) => {
    const datosClimaticos = sequelize.define('datosClimaticos', {
        temperatura: {
            type: DataTypes.FLOAT,
            allowNull: false,
            require: true
        },
        presion: {
            type: DataTypes.FLOAT,
            allowNull: false,
            require: true
        },
        humedad: {
            type: DataTypes.FLOAT,
            allowNull: false,
            require: true
        },
        fecha: {
            type: DataTypes.DATE,
            require: true
        },
        external_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        }
    },{timestamps: false, freezeTableName: true});
    datosClimaticos.associate = function(models){
        datosClimaticos.belongsTo(models.mota, { foreignKey: 'id_mota', as: 'mota' }); //muchos datos climaticos pertenece a un mota
        datosClimaticos.hasMany(models.prediccionClima, { foreignKey: 'id_datoClimatico', as: 'prediccionClima' });
    };
    return datosClimaticos;
};