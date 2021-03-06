const express = require('express');
const bodyParser = require('body-parser');
const Campsite = require('../models/campsite'); //Go up a directory
const authenticate = require('../authenticate');
const cors = require('./cors');

const campsiteRouter = express.Router();

campsiteRouter.use(bodyParser.json());

campsiteRouter.route('/') // Url endpoint
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200)) //receive preflight request 
.get(cors.cors, (req, res, next) => {
  //find all campsites via Mongoose find method
  Campsite.find() // This will find all docs in collection Campsite; returns as a promise
  .populate('comments.author') // Populate  field of comment subdocument, by finding the user doc that matches the objectid
  .then(campsites => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json'); // tells the browser client what to expect; operating parameters of an HTTP operation
    res.json(campsites); // returns promise as a JSON object
  })
  .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
  //add campsite from req
  Campsite.create(req.body) // model used as template to create a JSON object from req.body
  .then(campsite => {
    console.log('Campsite Created', campsite);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(campsite);
  })
  .catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
  res.statusCode = 403;
  res.end('PUT operation not supported on /campsites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
  //dangerous and would want to check authorization before using
  Campsite.deleteMany()
  .then(response => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(response);
  })
  .catch(err => next(err));
});


campsiteRouter.route('/:campsiteId') // URL Parameter (or route parameter)
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
  //finds the req campsite by route parameter (part of url)
  Campsite.findById(req.params.campsiteId)
  .populate('comments.author')
  .then(campsite => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(campsite);
  })
  .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
  res.statusCode = 403;
  res.end(`POST operation not supported on /campsites/${req.params.campsiteId}`);
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
  Campsite.findByIdAndUpdate(req.params.campsiteId, {
      $set: req.body // $ is an operand from mongodb
  }, { new: true })
  .then(campsite => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(campsite);
  })
  .catch(err => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
  // also need to check authorization of user
  Campsite.findByIdAndDelete(req.params.campsiteId)
  .then(response => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(response);
  })
  .catch(err => next(err));
});

campsiteRouter.route('/:campsiteId/comments')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
  Campsite.findById(req.params.campsiteId)
  .populate('comments.author')
  .then(campsite => {
    if (campsite) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(campsite.comments);
    } else {
      err = new Error(`Campsite ${req.params.campsiteId} not found`);
      err.status = 404;
      return next(err);
    }
  })
  .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  Campsite.findById(req.params.campsiteId)
  .then(campsite => {
    if (campsite) {
      req.body.author = req.user._id; // grab id of author/user which will be used to populate author field
      //add comment to campsite
      campsite.comments.push(req.body);
      //save comment to mongodb server -- save is not static
      campsite.save()
      .then(campsite => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(campsite);
      })
      .catch(err => next(err));
    } else {
      err = new Error(`Campsite ${req.params.campsiteId} not found`);
      err.status = 404;
      return next(err);
    }
  })
  .catch(err => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
  res.statusCode = 403;
  res.end(`PUT operation not supported on /campsites/${req.params.campsiteId}/comments`);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
  Campsite.findById(req.params.campsiteId)
  .then(campsite => {
    if (campsite) {
      //delete all comments from one campsite
      for (let i = (campsite.comments.length-1); i >= 0; i--) {
        campsite.comments.id(campsite.comments[i]._id).remove();
      }
      //save comment to mongodb server -- save is not static
      campsite.save()
      .then(campsite => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(campsite);
      })
      .catch(err => next(err));
    } else {
      err = new Error(`Campsite ${req.params.campsiteId} not found`);
      err.status = 404;
      return next(err);
    }
  })
  .catch(err => next(err));
});

campsiteRouter.route('/:campsiteId/comments/:commentId')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.get(cors.cors, (req, res, next) => {
  Campsite.findById(req.params.campsiteId)
  .populate('comments.author')
  .then(campsite => {
    if (campsite && campsite.comments.id(req.params.commentId)) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(campsite.comments.id(req.params.commentId));
    } else if (!campsite) {
      err = new Error(`Campsite ${req.params.campsiteId} not found`);
      err.status = 404;
      return next(err);
    } else {
      err = new Error(`Comment ${req.params.commentId} not found`);
      err.status = 404;
      return next(err);
    }
  })
  .catch(err => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res) => {
  res.statusCode = 403;
  res.end(`POST operation not supported on /campsites/${req.params.campsiteId}/comments/
  ${req.params.commentId}`)
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  Campsite.findById(req.params.campsiteId)
  .then(campsite => {
    //checks if user is the comment author
    if (req.user._id.equals(campsite.comments.id(req.params.commentId).author._id)) {
      //if campsite exists and 
      if (campsite && campsite.comments.id(req.params.commentId)) {
        if (req.body.rating) {
          campsite.comments.id(req.params.commentId).rating = req.body.rating;
        }
        if (req.body.text) {
          campsite.comments.id(req.params.commentId).text = req.body.text;
        }
        //save updated comment to mongodb, then send response to client
        campsite.save()
        .then(campsite => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(campsite);
        })
        .catch(err => next(err));
      } else if (!campsite) {
        err = new Error(`Campsite ${req.params.campsiteId} not found`);
        err.status = 404;
        return next(err);
      } else {
        err = new Error(`Comment ${req.params.commentId} not found`);
        err.status = 404;
        return next(err);
      }
    } else { //user is not author
      err = new Error(`You are not authorized for this operation.`);
      err.status = 403;
      return next(err);
    }
  })
  .catch(err => next(err));
  })
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  Campsite.findById(req.params.campsiteId)
  .then(campsite => {
    //if user is the comment author
    if (req.user._id.equals(campsite.comments.id(req.params.commentId).author._id)) {
      if (campsite && campsite.comments.id(req.params.commentId)) {
        campsite.comments.id(req.params.commentId).remove();
        //delete comment from mongodb, then send response to client
        campsite.save()
        .then(campsite => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json(campsite);
        })
        .catch(err => next(err));
      } else if (!campsite) {
        err = new Error(`Campsite ${req.params.campsiteId} not found`);
        err.status = 404;
        return next(err);
      } else {
        err = new Error(`Comment ${req.params.commentId} not found`);
        err.status = 404;
        return next(err);
      }
    } else {
      err = new Error(`You are not authorized for this operation.`);
      err.status = 403;
      return next(err);
    }
  })
  .catch(err => next(err));
});

module.exports = campsiteRouter;