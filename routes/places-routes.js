const express = require("express");

const { check } = require("express-validator");

const fileUpload = require("../middleware/file-upload");
const router = express.Router();
// Controlladores de Places-Routes
const placesControllers = require("../controllers/places-controllers");
const checkAuth = require('../middleware/check-auth')

// Muestra un place por id
router.get("/:pid", placesControllers.getPlaceById);
// Muestra place por usuario
router.get("/user/:uid", placesControllers.getPlacesByUser);

// Auth
router.use(checkAuth)

// Crear un nuevo place 
router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  placesControllers.createPlace
);

// Actuliza un place
router.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  placesControllers.updatePlace
);
// Eliminar un place
router.delete("/:pid", placesControllers.deletePlace);

module.exports = router;
