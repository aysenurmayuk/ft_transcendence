import { Router } from 'express';

const router = Router();

// An example route for the home page
router.get('/', (req, res) => {
    res.send('Welcome to the Pong Game API!');
});

// Add more routes here as needed

export default router;