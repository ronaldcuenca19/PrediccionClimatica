'use strict';

const cron = require('node-cron');
var models = require('../models');
var express = require('express');
var datosClimaticos = models.datosClimaticos;
var mota = models.mota
const axios = require('axios');
const { DATE } = require('sequelize');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors'); 
const app = express();

const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

server.listen(3002, () => {
    console.log('Servidor escuchando en el puerto 3000');
  });

class PrediccionControl {

    async listar(req, res) {
        var lista = await datosClimaticos.findAll({
            include: [
                { model: models.mota, as: "mota", attributes: ['ip'] },
            ],
            attributes: ['temperatura', 'presion', 'humedad',['external_id', 'id'], 'fecha', 'id_mota']
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
            cron.schedule('*/10 * * * * *', async () => {
                // Llama al método guardar cada 3 minutos
                this.mostrarDatos();
            });

            cron.schedule('*/15 * * * *', async () => {
                // Llama al método guardar cada 30 minutos
                this.guardar();
            });
        }

        async guardar() {
            try {
                var motas = await mota.findAll();
                var uuid = require('uuid');
                if (motas.length === 0) {
                    console.error("No se encontraron motas registradas");
                    return;
                }
                for (let i = 0; i < motas.length; i++) {
                    var motaA = motas[i];
                    if (motaA.estado == true) {
                        var url = 'http://' + motaA.ip + motaA.recurso;
                        let datosClimaESP32;
                            const response = await axios.get(url, {timeout:3000})
                            datosClimaESP32 = response.data;
                            console.log(datosClimaESP32); // Imprimir los datos en consola
        
                        // Validar que los datos sean numéricos
                        if (!isNaN(datosClimaESP32.temperatura) &&
                            !isNaN(datosClimaESP32.presion) &&
                            !isNaN(datosClimaESP32.humedad)) {
        
                            var data = {
                                temperatura: datosClimaESP32.temperatura,
                                presion: datosClimaESP32.presion,
                                humedad: datosClimaESP32.humedad,
                                external_id: uuid.v4(),
                                fecha: new Date().toISOString(),
                                id_mota: motaA.id
                            }
                            var result = await datosClimaticos.create(data);
                            if (result === null) {
                                console.error("No se puede crear");
                            } else {
                                console.log("Datos guardados exitosamente para la mota con ID:", motaA.id);
                            }
                        } else {
                            console.error("Los datos deben ser numéricos");
                        }

                    } else {
                        console.error("La mota debe ser mota maestra");
                    }
                }
                io.emit('actualizarDato', data); // Emitir el arreglo data
            } catch (error) {
                console.error("Error interno del servidor:", error.message);
            }
        }
        

        async mostrarDatos() {
            try {
                var motas = await mota.findAll();
                var data = []; // Inicializar data como un arreglo vacío
                if (motas.length === 0) {
                    console.error("No se encontraron motas registradas");
                    return;
                }
                for (let i = 0; i < motas.length; i++) {
                    var motaA = motas[i];
                    if (motaA.estado == true) {
                        var url = 'http://' + motaA.ip + motaA.recurso;
                        let datosClimaESP32;
                        try {
                            const response = await axios.get(url, {timeout:3000})
                            datosClimaESP32 = response.data;
                            console.log(datosClimaESP32); // Imprimir los datos en consola
        
                        // Validar que los datos sean numéricos
                        if (!isNaN(datosClimaESP32.temperatura) &&
                            !isNaN(datosClimaESP32.presion) &&
                            !isNaN(datosClimaESP32.humedad)) {
        
                            var dato = {
                                temperatura: datosClimaESP32.temperatura,
                                presion: datosClimaESP32.presion,
                                humedad: datosClimaESP32.humedad,
                                fecha: new Date().toISOString(),
                                id_mota: motaA.id
                            }
                            data.push(dato); // Agregar el dato al arreglo data
                            console.log("Datos traidos exitosamente para la mota con ID:", motaA.id);
                        } else {
                            console.error("Los datos deben ser numéricos");
                        }
                        } catch (error) {
                            console.error("Error al obtener datos de la mota:", error.message);
                            var datito = {
                                temperatura: '',
                                presion: '',
                                humedad: '',
                                fecha: '',
                                id_mota: motaA.id
                            }
                            data.push(datito);
                            
                        }
                    } else {
                        console.error("La mota debe ser mota maestra");
                    }
                }
                io.emit('actualizarDato', data); // Emitir el arreglo data
            } catch (error) {
                console.error("Error interno del servidor:", error.message);
            }
        }
        
    
}
module.exports = PrediccionControl;