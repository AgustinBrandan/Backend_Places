const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const fs = require('fs')
const path = require('path')
// Rutas
const placesRoutes = require("./routes/places-routes");
const userRoutes = require("./routes/users-routes");
// Error
const HttpError = require("./models/http.error");

const app = express();

app.use(bodyParser.json());

app.use('/uploads/images', express.static(path.join('uploads','images')))

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  next();
});


app.use("/api/places", placesRoutes); // /Api/places
app.use("/api/users", userRoutes); // /api/users

// Manejo rutas no definidas
app.use((req, res, next) => {
  throw new HttpError("Esta Ruta no existe", 404);
});
// Manejo de errores
app.use((error, req, res, next) => {
  if(req.file){
    fs.unlink(req.file.path, (err) => {
      console.log(err)
    })
  }
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "Ocurrió un error" });
});

const mongoURL =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.gh2t0ok.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
// Conexión a la base de datos
mongoose
  .connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(5000);
    console.log("Conexión a la base de datos establecida");
  })
  .catch((error) => {
    console.error("Error al conectar a la base de datos:", error);
  });

// i
