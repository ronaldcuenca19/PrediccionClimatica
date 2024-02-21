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
const PrediccionControl = require('../app/controls/PrediccionControl');
let prediccionControl = new PrediccionControl();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('reporte de quinto');
});

//MIDDLEWARE
const auth = function middleware(req, res, next){
  //AUTENTICACION
  const token = req.headers['pis-token'];
  if(token === undefined){
    res.status(400);
    res.json({ msg: "ERROR", tag: "Falta token", code: 400 });
  }else{
    require('dotenv').config();
    const key = process.env.KEY_JWT;
    jwt.verify(token, key, async(error, decoded) => {
      if(error){
        res.status(400);
        res.json({ msg: "ERROR", tag: "TOKEN NO VALIDO O EXPIRADO", code: 400 });
      }else{
        console.log(decoded.external);
        const models = require('../app/models');
        const cuenta = models.cuenta;
        const aux = await cuenta.findOne({
          where: {external_id : decoded.external}
        });
        if(aux === null){
          res.status(400);
        res.json({ msg: "ERROR", tag: "TOKEN NO VALIDO", code: 400 });
        }else{
          //AUTORIZACION
          next();
        }
      }
      
    });
    
  }
}

//router.get('/hola', function(req, res, next) {
  //console.log(req);
  //res.send("data":"hola1");
  //res.render('index', { title: 'Express' });
//});

router.get('/admin/personas', auth, personaControl.listar);
router.get('/admin/personas/get/:external', auth, personaControl.obtener);
router.post('/admin/personas/save', auth,  personaControl.guardar);
router.put('/admin/personas/put/:external', auth, personaControl.modificar);
router.get('/admin/personas/cambiarEstado/:external/:nuevoEstado', auth, personaControl.cambiarEstado);

router.get('/admin/rol', auth, rolControl.listar);
router.post('/admin/rol/save', auth, rolControl.guardar);

router.get('/admin/mota', auth, motaControl.listar);
router.post('/admin/mota/save', auth, motaControl.guardar);
router.get('/admin/mota/get/:external', auth, motaControl.obtener);
router.get('/admin/mota/cambiarEstado/:external/:nuevoEstado', auth, motaControl.cambiarEstado);
router.put('/admin/mota/put/:external', auth, motaControl.modificar);

router.get('/admin/sensor', auth, sensorControl.listar);
router.post('/admin/sensor/save', auth, sensorControl.guardar);
router.get('/admin/sensor/cambiarEstado/:external/:nuevoEstado', auth, sensorControl.cambiarEstado);
router.get('/admin/sensor/get/:external', auth, sensorControl.obtener);
router.put('/admin/sensor/put/:external', auth, sensorControl.modificar);

router.get('/admin/datosClimaticos', datosClimaControl.listar);
router.post('/admin/datosClimaticos/save', datosClimaControl.guardar);

router.post('/admin/prediccionClimatica/extrapolarPresion', prediccionControl.extapolacionLinealPresion);
router.post('/admin/prediccionClimatica/extrapolarHumedad', prediccionControl.extapolacionLinealhumedad);
router.post('/admin/prediccionClimatica/extrapolarTemp', prediccionControl.extapolacionLinealTemperatura);
router.get('/admin/prediccion', prediccionControl.listar);

router.post('/login', cuentaControl.inicio_sesion);
module.exports = router;