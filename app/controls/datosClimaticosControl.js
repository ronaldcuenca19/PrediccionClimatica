'use strict';

const cron = require('node-cron');
var models = require('../models');
var datosClimaticos = models.datosClimaticos;
var mota = models.mota
const axios = require('axios');
const { DATE } = require('sequelize');
class PrediccionControl {
    async listar(req, res) {
        var lista = await datosClimaticos.findAll({
            include: [
                { model: models.mota, as: "mota", attributes: ['ip'] },
            ],
            attributes: ['temperatura', 'presion', 'humedad',['external_id', 'id'], 'fecha']
        });
        res.status(200);
        res.json({ msg: "OK", code: 200, datos: lista });
    }

    async obtener(req, res) {
        const external = req.params.external;
        var lista = await mota.findOne({
            where: { external_id: external },
            include: [
                { model: models.mota, as: "mota", attributes: ['ip'] },
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

    //jobScheduler

        constructor() {
            // Programar una tarea cron que se ejecute cada 3 minutos
            cron.schedule('*/10 * * * * *', async () => {
                // Llama al método guardar cada 3 minutos
                this.guardar();
            });
        }

        async guardar() {
            try {
                const response = await axios.get('http://192.168.1.151/api/sensor');
                
                const datosClimaESP32 = response.data;
                console.log(datosClimaESP32); // Imprimir los datos en consola
                
                // Validar que los datos sean numéricos
                if (!isNaN(datosClimaESP32.temperatura) &&
                    !isNaN(datosClimaESP32.presion) &&
                    !isNaN(datosClimaESP32.humedad)) {
        
                    var uuid = require('uuid');
                    var motaA = await mota.findOne({
                        where: { external_id: 'a2691d60-a606-4fb6-953c-41490ccd8f1b' },
                    });
                    if (motaA == undefined || motaA == null) {
                        console.error("No se encuentra la mota hija");
                    } else {
                        if (motaA.rol == 'MAESTRO') {
                            var data = {
                                temperatura: datosClimaESP32.temperatura,
                                external_id: uuid.v4(),
                                presion: datosClimaESP32.presion,
                                humedad: datosClimaESP32.humedad,
                                fecha: new Date(),
                                id_mota: motaA.id
                            }
                            var result = await datosClimaticos.create(data);
                            if (result === null) {
                                console.error("No se puede crear");
                            } else {
                                console.log("Datos guardados exitosamente");
                            }
                        } else {
                            console.error("La mota debe ser mota maestra");
                        }
                    }
                } else {
                    console.error("Los datos deben ser numéricos");
                }
            } catch (error) {
                console.error("Error interno del servidor:", error.message);
            }
        }
    
}
module.exports = PrediccionControl;