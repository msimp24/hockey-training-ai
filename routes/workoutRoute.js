const express = require('express')
const router = express.Router()
const workoutController = require('../controllers/workoutController')
const authenticate = require('../middleware/authenticate')

router
  .route('/generate/')
  .post(authenticate.protectRoute, workoutController.generateWorkout)

router
  .route('/get-all-workouts/:id')
  .get(authenticate.protectRoute, workoutController.getAllWorkouts)

router
  .route('/get-current-phase/:id')
  .get(workoutController.getCurrentWorkoutPhase)

router
  .route('/program/:id')
  .get(authenticate.protectRoute, workoutController.getCurrentProgram)

router
  .route('/set-current-workout/:workoutId/:userId')
  .put(workoutController.setCurrentProgram)

router.route('/get-num-phases').get(workoutController.getNumberofPhases)

router.route('/workout-tutorials').get(workoutController.getWorkoutTutorialData)

module.exports = router
