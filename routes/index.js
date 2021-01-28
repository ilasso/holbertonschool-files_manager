import express from 'express';
import AppController from '../controllers/AppController';

const router = express.Router();

const routeController = (app) => {
  app.use(express.json());
  app.use(router);

  // App Controller

  router.get('/status', (req, res) => {
    AppController.getStatus(req, res);
  });

  router.get('/stats', (req, res) => {
    AppController.getStats(req, res);
  });
};

export default routeController;
