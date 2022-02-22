const User = require('../models/User');
const CustomError = require('../errors');
const { StatusCodes } = require('http-status-codes');
const {
  createUserToken,
  attachCookiesToResponse,
  checkPermissions,
} = require('../utils');

const getAllUsers = async (req, res) => {
  console.log(req.user);
  const users = await User.find({ role: 'user' }).select('-password');
  if (!users) {
    throw new CustomError.BadRequestError('No users available');
  }
  res.status(StatusCodes.OK).json({ users, totalUsers: users.length });
};

const getSingleUser = async (req, res) => {
  const user = await User.findOne({ _id: req.params.id }).select('-password');

  if (!user) {
    throw new CustomError.NotFoundError(`No user with id : ${req.params.id}`);
  }
  checkPermissions(req.user, user._id);
  res.status(StatusCodes.OK).json({ user });
};

const showCurrentUser = async (req, res) => {
  res.status(StatusCodes.OK).json(req.user); // comes from authenticate middleware
};

const updateUser = async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    throw new CustomError.BadRequestError(
      'Please provide name and email to update'
    );
  }

  const user = await User.findOne({ _id: req.user.userID });

  user.name = name;
  user.email = email;

  await user.save();

  const tokenUser = createUserToken(user);
  attachCookiesToResponse(res, tokenUser); // we attach a new cookie so values can be updated on the frontend

  res.status(StatusCodes.OK).json({ user: tokenUser });
};

const updateUserPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new CustomError.BadRequestError(
      'Please provide the current password and new password'
    );
  }

  const user = await User.findOne({ _id: req.user.userID });
  const isOldPasswordCorrect = await user.checkPassword(oldPassword);

  if (!isOldPasswordCorrect) {
    throw new CustomError.UnauthenticatedError(
      'The current password is not correct'
    );
  }
  user.password = newPassword;

  await user.save();
  res.status(StatusCodes.OK).json({ msg: 'Password updated succesfully' });
};

module.exports = {
  getAllUsers,
  getSingleUser,
  showCurrentUser,
  updateUser,
  updateUserPassword,
};

// Updating User with findOneAndUpdate :
// const updateUser = async (req, res) => {
//   const { name, email } = req.body;
//   if (!name || !email) {
//     throw new CustomError.BadRequestError(
//       'Please provide name and email to update'
//     );
//   }

//   const user = await User.findOneAndUpdate(
//     { _id: req.user.userID },
//     { name, email },
//     { new: true, runValidators: true }
//   );
//   const tokenUser = createUserToken(user);
//   attachCookiesToResponse(res, tokenUser); // we attach a new cookie so values can be updated on the frontend
//   res.status(StatusCodes.OK).json({ user: tokenUser });
// };
