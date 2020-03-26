const express = require('express');
const bodyParser = require('body-parser');
const Campsite = require('../models/campsite'); //Go up a directory
const authenticate = require('../authenticate');

const campsiteRouter = express.Router();

campsiteRouter.use(bodyParser.json());

campsiteRouter.route('/') // Url endpoint
.get((req, res, next) => {
  //find all campsites via Mongoose find method
  Campsite.find() // This will find all docs in collection Campsite; returns as a promise
  .then(campsites => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json'); // tells the browser client what to expect; operating parameters of an HTTP operation
    res.json(campsites); // returns promise as a JSON object
  })
  .catch(err => next(err));
})
.post(authenticate.verifyUser, (req, res, next) => {
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
.put(authenticate.verifyUser, (req, res) => {
  res.statusCode = 403;
  res.end('PUT operation not supported on /campsites');
})
.delete(authenticate.verifyUser, (req, res, next) => {
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
.get((req, res, next) => {
  //finds the req campsite by route parameter (part of url)
  Campsite.findById(req.params.campsiteId)
  .then(campsite => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(campsite);
  })
  .catch(err => next(err));
})
.post(authenticate.verifyUser, (req, res) => {
  res.statusCode = 403;
  res.end(`POST operation not supported on /campsites/${req.params.campsiteId}`);
})
.put(authenticate.verifyUser, (req, res, next) => {
  Campsite.findByIdAndUpdate(req.params.campsiteId, {
      $set: req.body // $ is an operand from mongoose?
  }, { new: true })
  .then(campsite => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(campsite);
  })
  .catch(err => next(err));
})
.delete(authenticate.verifyUser, (req, res, next) => {
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
.get((req, res, next) => {
  Campsite.findById(req.params.campsiteId)
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
.post(authenticate.verifyUser, (req, res, next) => {
  Campsite.findById(req.params.campsiteId)
  .then(campsite => {
    if (campsite) {
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
.put(authenticate.verifyUser, (req, res) => {
  res.statusCode = 403;
  res.end(`PUT operation not supported on /campsites/${req.params.campsiteId}/comments`);
})
.delete(authenticate.verifyUser, (req, res, next) => {
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
.get((req, res, next) => {
  Campsite.findById(req.params.campsiteId)
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
.post(authenticate.verifyUser, (req, res) => {
  res.statusCode = 403;
  res.end(`POST operation not supported on /campsites/${req.params.campsiteId}/comments/
  ${req.params.commentId}`)
})
.put(authenticate.verifyUser, (req, res, next) => {
  Campsite.findById(req.params.campsiteId)
  .then(campsite => {
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
  })
  .catch(err => next(err));
  })
.delete(authenticate.verifyUser, (req, res, next) => {
  Campsite.findById(req.params.campsiteId)
  .then(campsite => {
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
  })
  .catch(err => next(err));
});

module.exports = campsiteRouter;