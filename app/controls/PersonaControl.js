'use strict';
var models = require('../models')
var persona = models.persona;
var rol = models.rol;
class PersonaControl {
    async listar(req, res) {
        var lista = await persona.findAll({
            include: [
                { model: models.cuenta, as: "cuenta", attributes: ['correo','estado'] },
            ],
            attributes: ['apellidos', ['external_id', 'id'], 'nombres', 'cedula', 'celular']
        });
        res.status(200);
        res.json({ msg: "OK", code: 200, datos: lista });
    }

    async obtener(req, res) {
        const external = req.params.external;
        var lista = await persona.findOne({
            where: { external_id: external },
            include: [
                { model: models.cuenta, as: "cuenta", attributes: ['correo'] },
                { model: models.rol, as: "rol", attributes: ['nombre'] }
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

    async modificar(req, res) {
        const external = req.params.external;
        if (req.body.hasOwnProperty('nombres') &&
            req.body.hasOwnProperty('apellidos') &&
            req.body.hasOwnProperty('cedula') &&
            req.body.hasOwnProperty('celular') &&
            req.body.hasOwnProperty('correo') &&
            req.body.hasOwnProperty('clave')) {

                const lista = await persona.findOne({
                    where: { external_id: external },
                    include: [
                        { model: models.cuenta, as: "cuenta", attributes: ['correo'] }
                    ],
                });
                var data = {
                    nombres: req.body.nombres,
                    external_id: lista.external_id,
                    apellidos: req.body.apellidos,
                    cedula: req.body.cedula,
                    celular: req.body.celular,
                    cuenta: {
                        correo: req.body.correo,
                        clave: req.body.clave
                    }
                }

                let transaction = await models.sequelize.transaction();
                try {
                    var result = await lista.update(data, {transaction });     
                    await lista.getCuenta().then(async function(cuenta) {
                        await cuenta.update({
                            correo: req.body.correo,
                            clave: req.body.clave
                        }, { transaction });
                    });

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
                    res.json({ msg: "ERROR_Ronald", code: 200, error_msg: "Que paso bro el correo es unico"});
                }
        } else {
            res.status(401);
            res.json({ msg: "ERROR_Ronald", tag: "Faltan datos", code: 401 });
        }
    }
    

    async guardar(req, res) {
        if (req.body.hasOwnProperty('nombres') &&
            req.body.hasOwnProperty('apellidos') &&
            req.body.hasOwnProperty('cedula') &&
            req.body.hasOwnProperty('celular') &&
            req.body.hasOwnProperty('correo') &&
            req.body.hasOwnProperty('clave') &&
            req.body.hasOwnProperty('rol')) {
            var uuid = require('uuid');
            var rolA = await rol.findOne({ where: { external_id: req.body.rol } });
            if (rolA != undefined) {
                // Verificar la cédula antes de guardar la persona
                if (!PersonaControl.validarCedula(req.body.cedula)) {
                    res.status(400);
                    res.json({ msg: "ERROR", tag: "Cédula inválidisima", code: 400 });
                    return
                }
                var data = {
                    nombres: req.body.nombres,
                    external_id: uuid.v4(),
                    apellidos: req.body.apellidos,
                    cedula: req.body.cedula,
                    celular: req.body.celular,
                    id_rol: rolA.id,
                    cuenta: {
                        correo: req.body.correo,
                        clave: req.body.clave
                    }
                }
    
                let transaction = await models.sequelize.transaction();
                try {
                    var result = await persona.create(data, { include: [{ model: models.cuenta, as: "cuenta" }], transaction });
                    await transaction.commit();
                    if (result === null) {
                        res.status(401);
                        res.json({ msg: "ERROR", tag: "NO se puede crear", code: 401 });
                    } else {
                        rolA.external_id = uuid.v4();
                        await rolA.save();
                        res.status(200);
                        res.json({ msg: "OK", code: 200 });
                    }
                } catch (error) {
                    if (transaction) await transaction.rollback();
                    res.status(203);
                    res.json({ msg: "Error", code: 200, error_msg: "Que paso bro el correo es unico como nuestro amor" });
                }
    
            } else {
                res.status(401);
                res.json({ msg: "ERROR", tag: "El dato a buscar no existe", code: 401 });
            }
        } else {
            res.status(400);
            res.json({ msg: "ERROR", tag: "Faltan datos", code: 400 });
        }
    }
    

    static validarCedula(cedula) {
        // Verificar que la longitud sea correcta
        if (cedula.length !== 10) {
            return false;
        }
    
        // Verificar que todos los caracteres sean dígitos
        if (!/^\d+$/.test(cedula)) {
            return false;
        }
    
        // Algoritmo de validación de cédulas ecuatorianas
        let total = 0;
        let longitud = cedula.length;
        let numeroProvincia = cedula.substring(0, 2);
        if (numeroProvincia >= 1 && numeroProvincia <= 24) {
            let tercerDigito = parseInt(cedula.substring(2, 3));
            if (tercerDigito >= 0 && tercerDigito < 6) {
                let coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
                let digitos = cedula.split('').slice(0, longitud - 1);
                digitos.forEach((digito, indice) => {
                    let valor = coeficientes[indice] * parseInt(digito);
                    total += valor > 9 ? valor - 9 : valor;
                });
                total = total % 10 === 0 ? 0 : 10 - total % 10;
                if (total === parseInt(cedula.charAt(longitud - 1))) {
                    return true;
                }
            }
        }
        return false;
    }

    async cambiarEstado(req, res) {
        const external = req.params.external;
        const nuevoEstado = req.params.nuevoEstado;
        try {
            const personaEncontrada = await persona.findOne({
                where: { external_id: external },
                include: [{ model: models.cuenta, as: "cuenta" }]
            });
    
            if (!personaEncontrada) {
                return res.status(404).json({ mensaje: "Persona no encontrada", code: 404 });
            }
    
            // Obtener la cuenta asociada a la persona
            const cuenta = personaEncontrada.cuenta;
    
            if (!cuenta) {
                return res.status(404).json({ mensaje: "Cuenta no encontrada", code: 404 });
            }
    
            // Cambiar el estado de la cuenta
            cuenta.estado = nuevoEstado;
            await cuenta.save();
    
            return res.status(200).json({ mensaje: "Estado de cuenta actualizado", code: 200 });
        } catch (error) {
            console.log("Error al cambiar estado de cuenta:", error);
            return res.status(500).json({ mensaje: "Error en el servidor", code: 500 });
        }
    }
    
}
module.exports = PersonaControl;