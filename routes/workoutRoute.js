const express = require('express')
const router = express.Router()
const workoutController = require('../controllers/workoutController')
const authenticate = require('../middleware/authenticate')

router.route('/generate/').post(workoutController.generateWorkout)

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
  .route('/set-current-workout/:workoutId')
  .put(workoutController.setCurrentProgram)

router.route('/get-num-phases').get(workoutController.getNumberofPhases)

module.exports = router
