const { v4: uuidv4 } = require("uuid");
const HttpError = require("../models/http.error");
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Model
const User = require("../models/user");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password"); // Recupera todos los usuarios, excluyendo la contraseña
  } catch (err) {
    return next(new HttpError("No se pudieron obtener los usuarios", 500));
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);

  // 1 forma de manejar los errores
  // if (!errors.isEmpty()) {
  //   const individualErrors = [];

  //   errors.array().forEach((error) => {
  //     if (error.path === "name" ) {
  //       individualErrors.push("El nombre no puede estar vacío");
  //     } else if (error.path === "email") {
  //       individualErrors.push("El correo electrónico no es válido");
  //     } else if (error.path === "password" ) {
  //       individualErrors.push("La contraseña debe tener al menos 6 caracteres");
  //     }
  //   });

  //   if (individualErrors.length > 0) {
  //     // Crear una instancia de HttpError solo si hay errores individuales
  //     return next(new HttpError(individualErrors, 422));
  //   }
  // }

  // 2 Forma
      // Comienza comprobando si existen errores de validación en el objeto `errors`.
      // Si hay errores se dispara y ejecuta el siguiente codigo
  if (!errors.isEmpty()) {
    // Se define un objeto `errorMap` que mapea los nombres de campo a los mensajes de error correspondientes.
    const errorMap = {
      name: "El nombre no puede estar vacío",
      email: "El correo electrónico no es válido",
      password: "La contraseña debe tener al menos 6 caracteres",
    };

    const individualErrors = errors.array().map((error) => {  // `errors.array()` convierte los errores en una matriz para su procesamiento.
      const message = errorMap[error.path];
      // Para cada error, se intenta buscar un mensaje de error correspondiente en el `errorMap`.
      return message ? message : "Revisar los datos";
      // Si se encuentra un mensaje de error en el `errorMap`, se agrega a `individualErrors`.
      // Si no se encuentra, se agrega un mensaje genérico de "Revisar los datos".
    });
  
    if (individualErrors.length > 0) {
      return next(new HttpError(individualErrors, 422));
    }
  }
  

  const { name, email, password } = User(req.body);

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(
      new HttpError("No se pudo verificar el usuario existente", 500)
    );
  }

  if (existingUser) {
    return next(
      new HttpError("El usuario ya existe, por favor inicia sesión", 422)
    );
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(
      new HttpError("No se pudo crear usuario, intentelo de nuevo", 500)
    );
  }

  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    image: req.file.path,
    places: [],
  });

  try {
    await newUser.save();
  } catch (err) {
    return next(
      new HttpError("No se pudo crear el usuario, inténtalo de nuevo", 500)
    );
  }

  let token;
  try {
    token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (error) {
    return next(
      new HttpError("No se pudo iniciar sesión, inténtalo de nuevo", 500)
    );
  }

  res
    .status(201)
    .json({ userId: newUser.id, email: newUser.email, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = User(req.body);

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(
      new HttpError("No se pudo iniciar sesión, inténtalo de nuevo", 500)
    );
  }

  if (!existingUser) {
    return next(new HttpError("Este usuario no existe", 403));
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    new HttpError("Contraseña incorrecta", 500);
  }

  if (!isValidPassword) {
    return next(
      new HttpError(
        "Credenciales incorrectas, por favor verifica e inténtalo de nuevo",
        403
      )
    );
  }
  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (error) {
    return next(
      new HttpError("No se pudo iniciar sesión, inténtalo de nuevo", 500)
    );
  }
  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
