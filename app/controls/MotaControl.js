'use strict'
var models = require('../models')
var persona = models.persona;
var mota = models.mota;
class MotaControl {
    async listar(req, res) {
        var lista = await mota.findAll({
            include: [
                { model: models.persona, as: "persona", attributes: ['apellidos', 'nombres'] },
            ],
            attributes: ['ip', 'rol','descripcion', ['external_id', 'id'],'estado']
        });
        res.status(200);
        res.json({ msg: "OK", code: 200, datos: lista });
    }

    async obtener(req, res) {
        const external = req.params.external;
        var lista = await mota.findOne({
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

    async guardar(req, res) {
        if (req.body.hasOwnProperty('ip') &&
            req.body.hasOwnProperty('rol') &&
            req.body.hasOwnProperty('descripcion') &&
            req.body.hasOwnProperty('persona')) {
                var uuid = require('uuid');
                var personaA = await persona.findOne({
                    where: { external_id: req.body.persona},
                    include: [
                        { model: models.rol, as: "rol", attributes: ['nombre'] }]
                });
                if (personaA == undefined || personaA == null) {
                    res.status(401);
                    res.json({ msg: "ERROR", tag: "No se encuentra el administrador", code: 401 });
                } else {
                    if (!MotaControl.validarIP(req.body.ip)) {
                        res.status(400);
                        res.json({ msg: "ERROR", tag: "IP Inválida", code: 400 });
                        return
                    }
                    var estadoMota = (req.body.rol === 'MAESTRO') ? true : false; // Establecer el estado según el rol
                    var data = {
                        ip: req.body.ip,
                        external_id: uuid.v4(),
                        rol: req.body.rol,
                        descripcion: req.body.descripcion,
                        id_persona: personaA.id,
                        estado: estadoMota // Asignar el estado calculado
                    }
                    let transaction = await models.sequelize.transaction();
                    try {
                        var result = await mota.create(data, {transaction});
                        await transaction.commit();
                        if (result === null) {
                            res.status(401);
                            res.json({ msg: "ERROR", tag: "No se puede crear", code: 401 });
                        } else {
                            res.status(200);
                            res.json({ msg: "OK", code: 200 });
                        }
                    } catch (error) {
                        if (transaction) await transaction.rollback();
                        res.status(203);
                        res.json({ msg: "Error", code: 200, error_msg: "Que paso bro la ip es unica como nuestro amor" });
                    }
                }
        } else {
            res.status(400);
            res.json({ msg: "ERROR", tag: "Faltan datos", code: 400 });
        }
    }

    async modificar(req, res) {
        const external = req.params.external;
        if (req.body.hasOwnProperty('ip') &&
            req.body.hasOwnProperty('rol') &&
            req.body.hasOwnProperty('descripcion')){
                const lista = await mota.findOne({
                    where: { external_id: external },
                });
            if (lista != undefined) {
                if (!MotaControl.validarIP(req.body.ip)) {
                    res.status(400);
                    res.json({ msg: "ERROR", tag: "IP Inválida", code: 400 });
                    return
                }
                var data = {
                    ip: req.body.ip,
                    external_id: lista.external_id,
                    rol: req.body.rol,
                    descripcion: req.body.descripcion,
                }

                let transaction = await models.sequelize.transaction();
                try {
                    var result = await lista.update(data, {transaction });     
                    await transaction.commit();
                    if (result === null) {
                        res.status(401);
                        res.json({ msg: "ERROR_Ronald", tag: "NO se puede crear", code: 401 });
                    } else {
                        res.status(200);
                        res.json({ msg: "OK", code: 200 });
                    }
                } catch (error) {
                    if (transaction) await transaction.rollback();
                    res.status(203);
                    res.json({ msg: "ERROR_Ronald", code: 200, error_msg: "Que paso bro la ip es unica"});
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
            var lista = await mota.findOne({
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

    static validarIP(ip) {
        const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipPattern.test(ip);
    }

}
module.exports = MotaControl;