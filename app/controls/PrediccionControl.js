'use strict';
var models = require('../models');
const cron = require('node-cron');
var prediccion = models.prediccion;
var prediccionClima = models.prediccionClima;
var datosClimaticos = models.datosClimaticos;

class PrediccionControl {
    async listar(req, res) {
        var lista = await prediccionClima.findAll({
            include: [
                { model: models.prediccion, as: "prediccion", attributes: ['prediccion', 'tipoDato']}
            ],
            attributes: [['external_id', 'id'], 'fecha']
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

    constructor() {
        cron.schedule('*/30 * * * *', async () => {
            // Llama al método guardar cada 30 minutos
            this.guardar();
        });
    }

    async guardar() {
        try {
            var uuid = require('uuid');
            let req = {
                body: {
                    fecha: new Date().toISOString()
                }
            };
            let res = {
                status: function (code) {
                    console.log('Status code:', code);
                    return this; // Permite el encadenamiento de métodos
                },
                json: function (obj) {
                    console.log('Response:', obj);
                }
            };

            // Ejecutar los tres métodos de extrapolación
            const resultadoPresion = await this.extapolacionLinealPresion(req, res);
            console.log("AQUIIIII: " + resultadoPresion[0]);
            const resultadoHumedad = await this.extapolacionLinealhumedad(req, res);
            const resultadoTemperatura = await this.extapolacionLinealTemperatura(req, res);

            // Crear los objetos de datos a guardar en la base de datos
            const id = uuid.v4();
            const id2 = uuid.v4();
            const id3 = uuid.v4();
            var ultimoRegistro = await prediccionClima.findOne({
                order: [
                    ['id', 'DESC']
                ]
            });

            const fecha = new Date(ultimoRegistro.fecha);

            // Sumar 5 horas
            fecha.setHours((fecha.getHours() + 5)-5);

            // Formatear la fecha al formato deseado
            const fechaFormateada = fecha.toISOString().slice(0, 16).replace('T', ' ');

            var dataPresion = {
                prediccion: resultadoPresion[0],
                external_id: id,
                tipoDato: 'presion',
            };
            await prediccion.create(dataPresion);
            var presionA = await prediccion.findOne({ where: { external_id: id } });
            console.log("POR AQUI SE SUPONE QUE DEBE ESTAR: " + presionA.id);

            var dataPresion2 = {
                fecha: fechaFormateada,
                id_prediccion: presionA.id,
                external_id: uuid.v4(),
                id_datoClimatico: resultadoPresion[1]
            }
            await prediccionClima.create(dataPresion2);

            var dataHumedad = {
                prediccion: resultadoHumedad[0],
                external_id: id2,
                tipoDato: 'humedad',
            };
            await prediccion.create(dataHumedad);
            var humedadA = await prediccion.findOne({ where: { external_id: id2 } });
            var dataHumedad2 = {
                fecha: fechaFormateada,
                external_id: uuid.v4(),
                id_prediccion: humedadA.id,
                id_datoClimatico: resultadoHumedad[1]
            };
            await prediccionClima.create(dataHumedad2);

            var dataTemperatura = {
                prediccion: resultadoTemperatura[0],
                external_id: id3,
                tipoDato: 'temperatura',
            };
            await prediccion.create(dataTemperatura);
            var temperaturaA = await prediccion.findOne({ where: { external_id: id3 } });

            var dataTemperatura2 = {
                fecha: fechaFormateada,
                external_id: uuid.v4(),
                id_prediccion: temperaturaA.id,
                id_datoClimatico: resultadoTemperatura[1]
            };
            await prediccionClima.create(dataTemperatura2);

            console.log('Datos guardados con éxito.');
        } catch (error) {
            console.error('Error al obtener los datos de extrapolación o al guardarlos:', error);
        }
    }



    async extapolacionLinealPresion(req, res) {
        try {
            // Consumir la API para obtener los datos climáticos
            const response = await fetch('http://localhost:3001/api/admin/datosClimaticos');
            const data = await response.json();
            const fechaSolicitud = new Date(req.body.fecha).getTime();
            // Extracción de los datos relevantes (fecha y presión)
            const dates = data.datos.map(entry => new Date(entry.fecha).getTime());
            const pressures = data.datos.map(entry => entry.presion);
            const ids = data.datos.map(entry => entry.id);
            const lastId = ids[ids.length - 1];
            var datoClimaA = await datosClimaticos.findOne({ where: { external_id: lastId } });

            // Calcula la pendiente (m) e intercepto (b) de la línea de regresión lineal
            const n = dates.length;
            const xy = dates.map((date, index) => date * pressures[index]);
            const x2 = dates.map(date => date ** 2);

            const sumX = dates.reduce((acc, date) => acc + date, 0);
            const sumY = pressures.reduce((acc, pressure) => acc + pressure, 0);
            const sumXY = xy.reduce((acc, value) => acc + value, 0);
            const sumX2 = x2.reduce((acc, value) => acc + value, 0);

            const m = ((n * sumXY) - (sumX * sumY)) / ((n * sumX2) - (sumX ** 2));
            const b = ((sumY * sumX2) - (sumX * sumXY)) / ((n * sumX2) - (sumX ** 2));

            // Función para calcular el valor de y en función de x
            const getY = x => (m * x) + b;
            const valorFuncion = "(" + m + "*" + "x" + ")" + "+" + b;
            // Devuelve la función de regresión y el valor extrapolado para x = 120
            res.status(200);
            res.json({ msg: "OKI DOKI", code: 200, datos: { regressionFunction: valorFuncion, extrapolatedValue: getY(fechaSolicitud) } });
            return [getY(fechaSolicitud), datoClimaA.id];
        } catch (error) {
            console.error('Error al obtener datos climáticos:', error);
            throw error;
        }
    }

    async extapolacionLinealhumedad(req, res) {
        try {
            // Consumir la API para obtener los datos climáticos
            const response = await fetch('http://localhost:3001/api/admin/datosClimaticos');
            const data = await response.json();
            const fechaSolicitud = new Date(req.body.fecha).getTime();
            // Extracción de los datos relevantes (fecha y presión)
            const dates = data.datos.map(entry => new Date(entry.fecha).getTime());
            const humidity = data.datos.map(entry => entry.humedad);
            const ids = data.datos.map(entry => entry.id);
            const lastId = ids[ids.length - 1];
            var datoClimaA = await datosClimaticos.findOne({ where: { external_id: lastId } });

            // Calcula la pendiente (m) e intercepto (b) de la línea de regresión lineal
            const n = dates.length;
            const xy = dates.map((date, index) => date * humidity[index]);
            const x2 = dates.map(date => date ** 2);

            const sumX = dates.reduce((acc, date) => acc + date, 0);
            const sumY = humidity.reduce((acc, humidity) => acc + humidity, 0);
            const sumXY = xy.reduce((acc, value) => acc + value, 0);
            const sumX2 = x2.reduce((acc, value) => acc + value, 0);

            const m = ((n * sumXY) - (sumX * sumY)) / ((n * sumX2) - (sumX ** 2));
            const b = ((sumY * sumX2) - (sumX * sumXY)) / ((n * sumX2) - (sumX ** 2));

            // Función para calcular el valor de y en función de x
            const getY = x => (m * x) + b;
            const valorFuncion = "(" + m + "*" + "x" + ")" + "+" + b;
            // Devuelve la función de regresión y el valor extrapolado para x = 120
            res.status(200);
            res.json({ msg: "OKI DOKI", code: 200, datos: { regressionFunction: valorFuncion, extrapolatedValue: getY(fechaSolicitud) } });
            return [getY(fechaSolicitud), datoClimaA.id];

        } catch (error) {
            console.error('Error al obtener datos climáticos:', error);
            throw error;
        }
    }
    async extapolacionLinealTemperatura(req, res) {
        try {
            // Consumir la API para obtener los datos climáticos
            const response = await fetch('http://localhost:3001/api/admin/datosClimaticos');
            const data = await response.json();
            const fechaSolicitud = new Date(req.body.fecha).getTime();
            // Extracción de los datos relevantes (fecha y presión)
            const dates = data.datos.map(entry => new Date(entry.fecha).getTime());
            const temp = data.datos.map(entry => entry.temperatura);
            const ids = data.datos.map(entry => entry.id);
            const lastId = ids[ids.length - 1];
            var datoClimaA = await datosClimaticos.findOne({ where: { external_id: lastId } });

            // Calcula la pendiente (m) e intercepto (b) de la línea de regresión lineal
            const n = dates.length;
            const xy = dates.map((date, index) => date * temp[index]);
            const x2 = dates.map(date => date ** 2);

            const sumX = dates.reduce((acc, date) => acc + date, 0);
            const sumY = temp.reduce((acc, temp) => acc + temp, 0);
            const sumXY = xy.reduce((acc, value) => acc + value, 0);
            const sumX2 = x2.reduce((acc, value) => acc + value, 0);

            const m = ((n * sumXY) - (sumX * sumY)) / ((n * sumX2) - (sumX ** 2));
            const b = ((sumY * sumX2) - (sumX * sumXY)) / ((n * sumX2) - (sumX ** 2));

            // Función para calcular el valor de y en función de x
            const getY = x => (m * x) + b;
            const valorFuncion = "(" + m + "*" + "x" + ")" + "+" + b;
            // Devuelve la función de regresión y el valor extrapolado para x = 120
            res.status(200);
            res.json({ msg: "OKI DOKI", code: 200, datos: { regressionFunction: valorFuncion, extrapolatedValue: getY(fechaSolicitud) } });
            console.log(getY(fechaSolicitud));
            return [getY(fechaSolicitud), datoClimaA.id];

        } catch (error) {
            console.error('Error al obtener datos climáticos:', error);
            throw error;
        }
    }
}
module.exports = PrediccionControl;