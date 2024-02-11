'use strict';

module.exports = (sequelize, DataTypes) => {
    const prediccion = sequelize.define('prediccion', {
        prediccion: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0
        },
        tipoDato: {
            type: DataTypes.ENUM(['temperatura', 'humedad', 'presion']),
            defaultValue: 'temperatura'
        },
        external_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
        }
    }, { timestamps: false, freezeTableName: true });
    prediccion.associate = function (models) {
        prediccion.hasMany(models.prediccionClima, { foreignKey: 'id_prediccion', as: 'prediccionClima' });//una prediccion tiene muchos datos climaticos
    };

    return prediccion;
};