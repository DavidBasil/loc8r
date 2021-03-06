var mongoose = require('mongoose')
var Loc = mongoose.model('Location')

var sendJsonResponse = function(res, status, content){
	res.status(status)
	res.json(content)
}

// the Earth
var theEarth = (function(){
	var earthRadius = 6371
	var getDistanceFromRads = function(rads){
		return parseFloat(rads * earthRadius)
	}
	var getRadsFromDistance = function(distance){
		return parseFloat(distance / earthRadius)
	}
	return {
		getDistanceFromRads: getDistanceFromRads,
		getRadsFromDistance: getRadsFromDistance
	}
})()

// ListByDistance
module.exports.locationsListByDistance = function(req, res){
	var lng = parseFloat(req.query.lng)
	var lat = parseFloat(req.query.lat)
	var point = {
		type: "Point",
		coordinates: [lng, lat]
	}
	var geoOptions = {
		spherical: true,
		maxDistance: theEarth.getRadsFromDistance(20),
		num: 10
	}
	if (!lng || !lat || !maxDistance){
		console.log('locationsListByDistance missing params')
		sendJsonResponse(res, 404, {
			"message": "lng, lat and maxDistance query parameters are all required"
		})
		return
	}
	Loc.geoNear(point, getOptions, function(err, results, stats){
		var locations
		console.log('Geo results', results)
		console.log('Geo stats', stats)
		if (err){
			console.log('geoNear error: ', err)
			sendJsonResponse(res, 404, err)
		} else {
			locations = buildLocationList(req, res, results, stats)
			sendJsonResponse(res, 200, locations)
		}
	})
}

// ReadOne
module.exports.locationsReadOne = function(req, res){
	if (req.params && req.params.locationid){
		Loc
			.findById(req.params.locationid)
			.exec(function(err, location){
				if (!location){
					sendJsonResponse(res, 404, {
						"message": "location not found"
					})
					return
				} else if (err){
					sendJsonResponse(res, 404, err)
					return
				}
				sendJsonResponse(res, 200, location)
			})
	} else {
		sendJsonResponse(res, 404, {
			"message": "No locationid in request"
		})
	}
}

// create a location
module.exports.locationsCreate = function(req, res) {
  console.log(req.body);
  Loc.create({
    name: req.body.name,
    address: req.body.address,
    facilities: req.body.facilities.split(","),
    coords: [parseFloat(req.body.lng), parseFloat(req.body.lat)],
    openingTimes: [{
      days: req.body.days1,
      opening: req.body.opening1,
      closing: req.body.closing1,
      closed: req.body.closed1,
    }, {
      days: req.body.days2,
      opening: req.body.opening2,
      closing: req.body.closing2,
      closed: req.body.closed2,
    }]
  }, function(err, location) {
    if (err) {
      console.log(err);
      sendJSONresponse(res, 400, err);
    } else {
      console.log(location);
      sendJSONresponse(res, 201, location);
    }
  });
};

// update location
module.exports.locationsUpdateOne = function(req, res){
	if (!req.params.locationid){
		sendJsonResponse(res, 404, {
			"message": "Not found, locationid is required"
		})
		return
	}
	Loc
		.findById(req.params.locationid)
		.select('-reviews -rating')
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
			location.name = req.body.name
			location.address = req.body.address
			location.facilities = req.body.facilities.split(',')
			locations.coords = [parseFloat(req.body.lng), parseFloat(req.body.lat)]
			location.openingTimes = [{
				days: req.body.days1,
				opening: req.body.opening1,
				closing: req.body.closing1,
				closed: req.body.closed1
			}, {
				days: req.body.days2,
				opening: req.body.opening2,
				closing: req.body.closing2,
				closed: req.body.closed2
			}]
			location.save(function(err, location){
				if (err){
					sendJsonResponse(res, 404, err)
				} else {
					sendJsonResponse(res, 200, location)
				}
			})
		})
}

// delete location
module.exports.locationsDeleteOne = function(req, res){
	var locationid = req.params.locationid
	if (locationid){
		Loc
			.findByIdAndRemove(locationid)
			.exec(function(err, location){
				if (err){
					sendJsonResponse(res, 404, err)
					return
				}
				sendJsonResponse(res, 204, null)
			})
	} else {
		sendJsonResponse(res, 404, {
			"message": "No locationid"
		})
	}
}
