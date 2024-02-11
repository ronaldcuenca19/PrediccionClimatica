'use strict';
 
module.exports = (sequelize, DataTypes) => {
    const prediccionClima = sequelize.define('prediccionClima', {
        fecha: {
            type: DataTypes.DATE,
            require: true
        },
        external_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4
        }
    },{timestamps: false, freezeTableName: true});
    prediccionClima.associate = function (models) {
        prediccionClima.belongsTo(models.prediccion, { foreignKey: 'id_prediccion'});
        prediccionClima.belongsTo(models.datosClimaticos, { foreignKey: 'id_datoClimatico'});
    };

    return prediccionClima;
}