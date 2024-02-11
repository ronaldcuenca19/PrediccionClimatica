'use strict';
var models = require('../models');
var prediccion = models.prediccion
var rol = models.rol;
class PrediccionControl {
    async listar(req, res) {
        var lista = await prediccion.findAll({
            attributes: ['fecha'['external_id', 'id'],'temperatura','presion','humedad']
        });
        res.status(200);
        res.json({ msg: "OK", code: 200, datos: lista });
    }

    async obtener(req, res) {
        const external = req.params.external;
        var lista = await prediccion.findOne({
            where: { external_id: external },
        });
        if (lista === undefined || lista == null) {
            res.status(200);
            res.json({ msg: "OKI DOKI", code: 200, datos: {} });
        } else {
            res.status(200);
            res.json({ msg: "OK DOKI", code: 200, datos: lista });
        }
    }
}
module.exports = PrediccionControl;