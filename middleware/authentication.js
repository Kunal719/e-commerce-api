const CustomError = require('../errors');
const { StatusCodes } = require('http-status-codes');
const { isVerifiedToken } = require('../utils');

const authenticateUser = async (req, res, next) => {
  const token = req.signedCookies.token;
  if (!token) {
    throw new CustomError.UnauthenticatedError('Authentication Invalid');
  }
  try {
    const { name, userID, role } = isVerifiedToken(token);
    // console.log(payload)
    req.user = { name, userID, role };
  } catch (error) {
    throw new CustomError.UnauthenticatedError('Authentication Invalid');
  }

  next();
};

const authorizePermission = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new CustomError.UnauthorizedError(
        'Not authorized to access this path'
      );
    }
    next();
  };
}; // we return a callback function within a function because so that we can pass the middleware in user route

module.exports = { authenticateUser, authorizePermission };
