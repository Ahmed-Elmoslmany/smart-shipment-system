const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const {uploadFileCloud} = require('../utils/multerCloud')

const router= express.Router()


router.route('/signup').post(uploadFileCloud().array("files"), authController.signup)
router.route('/confirmAccount').post(authController.confirmAccount)
router.route('/login').post(authController.login)


router.route('/forgetPassword').post(authController.forgetPassword)
router.route('/resetPassword').patch(authController.resetPassword)

router.patch(
    '/updatePassword',
    authController.protect,
    authController.updateMyPassword
  );

router.get('/me', authController.protect, userController.getMe, userController.getUser)

  router.patch(
    '/updateMe',
    authController.protect,
    userController.updateMe
  );

  router.delete(
    '/deleteMe',
    authController.protect,
    userController.deleteMe
  );

router.route('/updateImg').patch(authController.protect,uploadFileCloud().single("pp") , userController.uploadProfileImg)
module.exports = router;