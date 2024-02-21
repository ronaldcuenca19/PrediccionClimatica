'use strict';
var models = require('../models')
var persona = models.persona;
var rol = models.rol;
var cuenta = models.cuenta;
let jwt = require('jsonwebtoken');
class CuentaControl {
    
    async inicio_sesion(req, res) {
        if (req.body.hasOwnProperty('correo') &&
            req.body.hasOwnProperty('clave')) {
            let cuentaA = await cuenta.findOne({
                where: { correo: req.body.correo },
                include: [
                    { model: models.persona, as: "persona", attributes: ['apellidos','nombres','id_rol','external_id'] },
                ],
            });
            if (cuentaA === null) {
                res.status(400);
                res.json({ msg: "ERROR", tag: "Cuenta no existe", code: 400 });
            } else {
                if (cuentaA.estado == true) {
                    if (cuentaA.clave === req.body.clave) {
                        var rolA = await rol.findOne({ where: {id: cuentaA.persona.id_rol}, attributes: ['nombre']});
                        const token_data = {
                            external: cuentaA.external_id,
                            check: true
                        };
                        require('dotenv').config();
                        const key = process.env.KEY_JWT;
                        const token = jwt.sign(token_data, key, {
                            expiresIn: '2h'
                        });
                        var info =  {
                            token: token,
                            user: cuentaA.persona.apellidos+' '+cuentaA.persona.nombres,
                            rol: rolA.nombre,
                            external: cuentaA.persona.external_id,

                        };
                        res.status(200);
                        res.json({ msg: "OK", tag: "Listo", data:info, code: 200 });
                    } else {
                        res.status(400);
                        res.json({ msg: "ERROR", tag: "Clave incorrecta", code: 400 });
                    }
                } else {
                    res.status(400);
                    res.json({ msg: "ERROR", tag: "Cuenta desactivada", code: 400 });
                }
            }

        } else {
            res.status(400);
            res.json({ msg: "ERROR", tag: "Faltan datos", code: 400 });
        }
    }
}

module.exports = CuentaControl;