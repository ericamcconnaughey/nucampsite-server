const express = require('express');
const cors = require('./cors');
const authenticate = require('../authenticate');
const Favorite = require('../models/favorite');

const favoriteRouter = express.Router();

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
  Favorite.find() // not sure if I need to add a filter for only showing Users own favorites??
  .populate('user', 'campsites')
  .then(favorites => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(favorites);
  })
  .catch(err => next(err));
}) // TEST GET endpoint!!
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {})

//UPDATE ENDPOINTS (add next where needed)

favoriteRouter.route('/:campsiteId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, authenticate.verifyUser, (req, res) => {})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {})



module.exports = favoriteRouter;
