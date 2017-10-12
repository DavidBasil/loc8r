var mongoose = require('mongoose');
var Loc = mongoose.model('Location');

var sendJSONresponse = function(res, status, content) {
  res.status(status);
  res.json(content);
};

module.exports.reviewsReadOne = function(req, res) {
  console.log("Getting single review");
  if (req.params && req.params.locationid && req.params.reviewid) {
    Loc
      .findById(req.params.locationid)
      .select('name reviews')
      .exec(
        function(err, location) {
          console.log(location);
          var response, review;
          if (!location) {
            sendJSONresponse(res, 404, {
              "message": "locationid not found"
            });
            return;
          } else if (err) {
            sendJSONresponse(res, 400, err);
            return;
          }
          if (location.reviews && location.reviews.length > 0) {
            review = location.reviews.id(req.params.reviewid);
            if (!review) {
              sendJSONresponse(res, 404, {
                "message": "reviewid not found"
              });
            } else {
              response = {
                location: {
                  name: location.name,
                  id: req.params.locationid
                },
                review: review
              };
              sendJSONresponse(res, 200, response);
            }
          } else {
            sendJSONresponse(res, 404, {
              "message": "No reviews found"
            });
          }
        }
    );
  } else {
    sendJSONresponse(res, 404, {
      "message": "Not found, locationid and reviewid are both required"
    });
  }
};

// create a review
module.exports.reviewsCreate = function(req, res){
	if (req.params.locationid){
		Loc
			.findById(req.params.locationid)
			.select('reviews')
			.exec(function(err, location){
				if (err){
					sendJsonResponse(res, 400, err)
				} else {
					doAddReview(req, res, location)
				}
			})
	} else {
		sendJsonResponse(res, 404, {
			"message": "Not found, locationid required"
		}
)}
}

// doAddReview
var doAddReview = function(req, res, location){
	if (!location){
		sendJSONresponse(res, 404, 'locationid not found')
	} else {
		location.reviews.push({
			author: req.body.author,
			rating: req.body.rating,
			reviewText: req.body.reviewText
		})
		location.save(function(err, location){
			var thisReview
			if (err) {
				sendJSONresponse(res, 404, err)	
			} else {
				updateAverageRating(location._id)
				thisReview = location.reviews[location.reviews.length - 1]
				sendJsonResponse(res, 201, thisReview)
			}
		})
	}
}

// update average rating
var updateAverateRating = function(locationid) {
	console.log("Update rating average for ", locationid)	
	Loc
		.findById(locationid)
		.select('reviews')
		.exec(function(err, location){
			if (!err){
				doSetAverageRating(location)
			}
		})
}

// set average rating
var doSetAverageRating = function(location){
	var i, reviewCount, ratingAverage, ratingTotal
	if (location.reviews && location.reviews.length > 0){
		reviewCount = location.reviews.length
		ratingTotal = 0
		for (i = 0; i < reviewCount; i++){
			ratingTotal = ratingTotal + location.reviews[i].rating
		}
		ratingAverage = parseInt(ratingTotal / reviewCount, 10)
		location.rating = ratingAverage
		location.save(function(err){
			if (err){
				console.log(err)
			} else {
				console.log("Average rating updated to ", ratingAverage)
			}
		})
	}
}

// update review
module.exports.locationsUpdateOne = function(req, res) {
  if (!req.params.locationid) {
    sendJSONresponse(res, 404, {
      "message": "Not found, locationid is required"
    });
    return;
  }
  Loc
    .findById(req.params.locationid)
    .select('-reviews -rating')
    .exec(
      function(err, location) {
        if (!location) {
          sendJSONresponse(res, 404, {
            "message": "locationid not found"
          });
          return;
        } else if (err) {
          sendJSONresponse(res, 400, err);
          return;
        }
        location.name = req.body.name;
        location.address = req.body.address;
        location.facilities = req.body.facilities.split(",");
        location.coords = [parseFloat(req.body.lng), parseFloat(req.body.lat)];
        location.openingTimes = [{
          days: req.body.days1,
          opening: req.body.opening1,
          closing: req.body.closing1,
          closed: req.body.closed1,
        }, {
          days: req.body.days2,
          opening: req.body.opening2,
          closing: req.body.closing2,
          closed: req.body.closed2,
        }];
        location.save(function(err, location) {
          if (err) {
            sendJSONresponse(res, 404, err);
          } else {
            sendJSONresponse(res, 200, location);
          }
        });
      }
  );
};

// delete review
module.exports.reviewsDeleteOne = function(req, res){
	if (!req.params.locationid || !req.params.reviewid){
		sendJsonResponse(req, 404, {
			"message": "Not found, locationid and reviewid are both required"
		})	
		return
	}
	Loc
		.findById(req.params.locationid)
		.select('reviews')
		.exec(function(err, location){
			if (!location){
				sendJsonResponse(res, 404, {
					"message": "locationid not found"
				})
				return
			} else if (err){
				sendJsonResponse(res, 404, err)
				return
			}
			if (location.reviews && location.reviews.length > 0){
				if (!location.reviews.id(req.params.reviewid)){
					sendJsonResponse(res, 404, {
						"message": "reviewid not found"
					})
				} else {
					location.reviews.id(req.params.reviewid).remove()
					location.save(function(err){
						if (err){
							sendJsonResponse(res, 404, err)
						} else {
							updateAverageRating(location._id)
							sendJsonResponse(res, 204, null)
						}
					})
				}
			} else {
				sendJsonResponse(res, 404, {
					"message": "No review to delete"
				})
			}
		})
}
