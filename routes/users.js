var express = require('express');
var router = express.Router();
let jwt = require("jsonwebtoken");
const personaC = require('../app/controls/PersonaControl');
let personaControl = new personaC();
const rolC = require('../app/controls/RolControl');
let rolControl = new rolC();
const cuentaC = require('../app/controls/CuentaControl');
let cuentaControl = new cuentaC();
const motaC = require('../app/controls/MotaControl');
let motaControl = new motaC();
const sensorC = require('../app/controls/SensorControl');
let sensorControl = new sensorC();
const datosClimaC = require('../app/controls/datosClimaticosControl');
let datosClimaControl = new datosClimaC();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('reporte de quinto');
});

var auth = function middleware(req, res, next) {
  const token = req.headers["TOKEN-API"];
  if (token) {
    require("dotenv").config();
    const llave = process.env.KEY_PRI;
    jwt.verify(token, llave, async (err, decoded) => {
      if (err) {
        res.status(401);
        res.json({ msg: "token expirado o no valido", code: 401 });
      } else {
        var models = require("../app/models");
        req.decoded = decoded;
        let aux = await models.cuenta.findOne({
          where: { external_id: req.decoded.external },
        });
        if (!aux) {
          res.status(401);
          res.json({ msg: "token no valido", code: 401 });
        } else {
          next();
        }
      }
    });
  } else {
    res.status(401);
    res.json({ msg: "No existe token", code: 401 });
  }
};



//router.get('/hola', function(req, res, next) {
  //console.log(req);
  //res.send("data":"hola1");
  //res.render('index', { title: 'Express' });
//});

router.get('/admin/personas', personaControl.listar);
router.get('/admin/personas/get/:external', personaControl.obtener);
router.post('/admin/personas/save', personaControl.guardar);
router.put('/admin/personas/put/:external', personaControl.modificar);
router.get('/admin/personas/cambiarEstado/:external/:nuevoEstado', personaControl.cambiarEstado);

router.get('/admin/rol', rolControl.listar);
router.post('/admin/rol/save', rolControl.guardar);

router.get('/admin/mota', motaControl.listar);
router.post('/admin/mota/save', motaControl.guardar);
router.get('/admin/mota/get/:external', motaControl.obtener);
router.get('/admin/mota/cambiarEstado/:external/:nuevoEstado', motaControl.cambiarEstado);
router.put('/admin/mota/put/:external', motaControl.modificar);

router.get('/admin/sensor', sensorControl.listar);
router.post('/admin/sensor/save', sensorControl.guardar);
router.get('/admin/sensor/cambiarEstado/:external/:nuevoEstado', sensorControl.cambiarEstado);
router.get('/admin/sensor/get/:external', sensorControl.obtener);
router.put('/admin/sensor/put/:external', sensorControl.modificar);

router.get('/admin/datosClimaticos', datosClimaControl.listar);
router.post('/admin/datosClimaticos/save', datosClimaControl.guardar);


router.post('/login', cuentaControl.inicio_sesion);
module.exports = router;