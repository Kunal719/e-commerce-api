const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  getSingleUser,
  showCurrentUser,
  updateUser,
  updateUserPassword,
} = require('../controllers/userController');

const { authorizePermission } = require('../middleware/authentication');

router.route('/').get(authorizePermission('admin'), getAllUsers);
router.route('/showMe').get(showCurrentUser);
router.route('/updateUser').patch(updateUser);
router.route('/updateUserPassword').patch(updateUserPassword);
router.route('/:id').get(getSingleUser); // pass the :id at end because if above, then it will treat the
// routes as ids, For eg - updateUser is id if we place id route above updateUser

module.exports = router;
