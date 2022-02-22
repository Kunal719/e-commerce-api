const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { attachCookiesToResponse, createUserToken } = require('../utils');

const register = async (req, res) => {
  const { name, email, password } = req.body;
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    throw new CustomError.BadRequestError('Email already exists');
  }
  // First user to be registered as an admin
  const isFirstDocument = (await User.countDocuments({})) === 0;
  const role = isFirstDocument ? 'admin' : 'user';
  const user = await User.create({ name, email, password, role });

  // Setup JWT
  const tokenUser = createUserToken(user);
  attachCookiesToResponse(res, tokenUser);

  res.status(StatusCodes.CREATED).json({ user: tokenUser });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new CustomError.BadRequestError(
      'Please provide email and password to login'
    );
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new CustomError.UnauthenticatedError('Incorrect email/password');
  }

  const checkPassword = await user.checkPassword(password);
  if (!checkPassword) {
    throw new CustomError.UnauthenticatedError('Incorrect email/password');
  }

  // If everything is correct
  const tokenUser = createUserToken(user);
  attachCookiesToResponse(res, tokenUser);

  res.status(StatusCodes.OK).json({ user: tokenUser });
};

const logout = async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(Date.now()),
  });

  res.status(StatusCodes.OK).json({ msg: 'Logged out succesfully' });
};

module.exports = { register, login, logout };
