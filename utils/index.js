const {
  createJWT,
  isVerifiedToken,
  attachCookiesToResponse,
} = require('./jwt');

const createUserToken = require('./createUserToken');
const checkPermissions = require('./checkPermissions');

module.exports = {
  createJWT,
  isVerifiedToken,
  attachCookiesToResponse,
  createUserToken,
  checkPermissions,
};
