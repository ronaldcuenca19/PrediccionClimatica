'use strict';
var models = require('../models')
var sensor = models.sensor;
var mota = models.mota;
class SensorControl {
    async listar(req, res) {
        var lista = await sensor.findAll({
            include: [
                { model: models.mota, as: "mota", attributes: ['ip'] },
            ],
            attributes: ['nombre','descripcion', ['external_id', 'id'], 'tipo_sensor', 'estado']
        });
        res.status(200);
        res.json({ msg: "OK", code: 200, datos: lista });
    }

    async obtener(req, res) {
        const external = req.params.external;
        var lista = await sensor.findOne({
            where: { external_id: external },
            include: [
                { model: models.mota, as: "mota", attributes: ['ip','descripcion','external_id'] },
            ],
        });
        if (lista === undefined || lista == null) {
            res.status(200);
            res.json({ msg: "OKI DOKI", code: 200, datos: {} });
        } else {
            res.status(200);
            res.json({ msg: "OK DOKI", code: 200, datos: lista });
        }
    }


    async guardar(req, res) {
        if (req.body.hasOwnProperty('nombre') &&
            req.body.hasOwnProperty('descripcion') &&
            req.body.hasOwnProperty('tipo_sensor') &&
            req.body.hasOwnProperty('mota')) {
                var uuid = require('uuid');
                var motaA = await mota.findOne({
                    where: { external_id: req.body.mota },
                });
                if (motaA == undefined || motaA == null) {
                    res.status(401);
                    res.json({ msg: "ERROR", tag: "No se encuentra la mota esclava", code: 401 });
                } else {
                    //if (motaA.rol == 'ESCLAVO') {
                var data = {
                    nombre: req.body.nombre,
                    descripcion: req.body.descripcion,
                    external_id: uuid.v4(),
                    tipo_sensor: req.body.tipo_sensor,
                    estado: true,
                    id_mota: motaA.id
                }
                    var result = await sensor.create(data);
                    if (result === null) {
                        res.status(401);
                        res.json({ msg: "ERROR", tag: "NO se puede crear", code: 401 });
                    } else {
                        res.status(200);
                        res.json({ msg: "OK", code: 200 });
                    }
                //} else {
                    //res.status(400);
                    //res.json({ msg: "ERROR", tag: "La mota que guarda el sensor no es mota hijo", code: 400 });
                //}
            }                
        } else {
            res.status(400);
            res.json({ msg: "ERROR", tag: "Faltan datos", code: 400 });
        }
    }

    async modificar(req, res) {
        const external = req.params.external;
        if (req.body.hasOwnProperty('nombre') &&
            req.body.hasOwnProperty('descripcion') &&
            req.body.hasOwnProperty('tipo_sensor') &&
            req.body.hasOwnProperty('mota')) {

                const lista = await sensor.findOne({
                    where: { external_id: external },
                });

            var motaA = await mota.findOne({ where: { external_id: req.body.mota } });
            if (motaA != undefined) {
                var data = {
                    nombre: req.body.nombre,
                    external_id: lista.external_id,
                    descripcion: req.body.descripcion,
                    tipo_sensor: req.body.tipo_sensor,
                    id_mota: motaA.id,
                }
                    var result = await lista.update(data);                                        
                    if (result === null) {
                        res.status(401);
                        res.json({ msg: "ERROR_Ronald", tag: "NO se puede crear", code: 401 });
                    } else {
                        res.status(200);
                        res.json({ msg: "OK", code: 200 });
                    }
            } else {
                res.status(401);
                res.json({ msg: "ERROR_Ronald", tag: "El dato a buscar no existe", code: 401 });
            }
        } else {
            res.status(401);
            res.json({ msg: "ERROR_Ronald", tag: "Faltan datos", code: 401 });
        }
    }

    async cambiarEstado(req, res) {
        const external = req.params.external;
        const nuevoEstado = req.params.nuevoEstado;
        console.log('Valor de nuevoEstado:', nuevoEstado);
        try{
            var lista = await sensor.findOne({
                where: { external_id: external },
            });
            if (lista === undefined || lista == null) {
                res.status(200);
                res.json({ msg: "OK", code: 200, datos: {} });
            } else {
                lista.estado = nuevoEstado;
                await lista.save();
                res.status(200);
                res.json({ msg: "OK", code: 200});
            }
        }catch(error){
            console.log("Error al cambiar estado del sensor", error);
            res.status(500).json({mensaje: "Error en server", code:500})
        }
    }

}
module.exports = SensorControl;