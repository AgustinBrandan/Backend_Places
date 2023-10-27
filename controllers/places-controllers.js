const HttpError = require("../models/http.error");
const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const fs = require("fs");
// const getCoordsForAddres = require('../util/location')

// Models
const Place = require("../models/place");
const User = require("../models/user");

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    return next(
      new HttpError("Algo salió mal, no se pudo encontrar un lugar", 500)
    );
  }
  if (!place) {
    return next(new HttpError("Lugar no encontrado.", 404)); // throw error;
  }
  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUser = async (req, res, next) => {
  const userId = req.params.uid;
  let userWhitPlaces;
  try {
    userWhitPlaces = await User.findById(userId).populate("places");
  } catch (err) {
    return next(
      new HttpError("Algo salió mal al buscar lugares del usuario.", 500)
    );
  }
  if (!userWhitPlaces || userWhitPlaces.places.length === 0) {
    return next(
      new HttpError("Usuario no encontrado o no tiene lugares.", 404)
    );
  }

  res.json({
    places: userWhitPlaces.places.map((place) =>
      place.toObject({ getters: true })
    ),
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  // console.log(errors)
  // if (!errors.isEmpty()) {
  //   next(new HttpError("Ingreso invalido, por favor revisar los datos", 422));
  // }
  if (!errors.isEmpty()) {
    const individualErrors = [];
  
    errors.array().forEach((error) => {
      if (error.path === "title" && error.value === "") {
        individualErrors.push("El titulo no puede estar vacio  ");
      } else if (error.path === "description" && error.msg === "Invalid value") {
        individualErrors.push("La descripcion debe tener minimo 5 caracteres  ");
      } else if (error.path === "address" && error.value === "") {
        individualErrors.push("La direccion no puede estar vacia  ");
      }
    });
  
    if (individualErrors.length > 0) {
      // Crear una instancia de HttpError solo si hay errores individuales
      return next(new HttpError(individualErrors, 422));
    }
  }
  

  const { title, description, address } = Place(req.body);
  // const title = req.body.title

  // try{
  //     coordinates = await getCoordsForAddres(address);

  // } catch(error){
  //     return next(error)
  // }

  const newPlace = new Place({
    title,
    description,
    address,
    location: {
      lat: 40.7128,
      lng: -74.006,
    },
    image: req.file.path,
    creator: req.userData.userId,
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    return next(new HttpError("Crear place fallo, intente de nuevo!", 500));
  }

  if (!user) {
    return next(new HttpError("No se encontro un id", 404));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    newPlace.save({ session: sess });
    user.places.push(newPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "No se pudo crear imagen,Intente de nuevo",
      500
    );
    return next(error);
  }
  res.status(201).json({ place: newPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new HttpError("Ingreso inválido, por favor revise los datos", 422);
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    return next(new HttpError("Algo salió mal al buscar el lugar.", 500));
  }

  if (place.creator.toString() !== req.userData.userId){
    const error = new HttpError("No tienes permiso para editar este lugar.", 401)
  }

  if (!place) {
    return next(new HttpError("No se encontró el lugar para actualizar.", 404));
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    return next(new HttpError("No se pudo actualizar el lugar.", 500));
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    // Busca el lugar por su ID y selecciona el campo "creator"
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    return next(new HttpError("Algo salió mal al buscar el lugar.", 500));
  }

  if (!place) {
    return next(new HttpError("No se encontró el lugar a eliminar.", 404));
  }

  if (place.creator.id !== req.userData.userId){
    const error = new HttpError("No tienes permiso para eliminar este lugar.", 401)
    return next(error)
  }

  const imagePath = place.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.deleteOne({ session: sess }); //await place.deleteOne();
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    return next(new HttpError("No se pudo eliminar el lugar.", 500));
  }

  fs.unlink(imagePath, (err) => {});

  res.status(200).json({ message: "Lugar eliminado." });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUser = getPlacesByUser;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
