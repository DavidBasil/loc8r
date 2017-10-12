var mongoose = require('mongoose')

var dbURI = 'mongodb://localhost/Loc8r'
mongoose.connect(dbURI)

mongoose.connection.on('connected', function(){
	console.log('Mongoose connected to ' + dbURI)
})

mongoose.connection.on('error', function(err){
	console.log('Mongoose connection error: ' + err)
})

mongoose.connection.on('disconnected', function(){
	console.log('Mongoose disconnected')
})

// shutdown function
var gracefulShutDown = function(msg, callback){
	mongoose.connection.close(function(){
		console.log('Mongoose disconnected through ' + msg)
		callback()
	})
}

// shutdown processes
// nodemon
process.once('SIGUSR2', function() {
	gracefulShutDown('nodemon restart', function() {
		process.kill(process.pid, 'SIGUSR2')	
	})	
})
// app
process.on('SIGINT', function() {
	gracefulShutDown('app termination', function() {
		process.exit(0)	
	})	
})
// heroku
process.on('SIGTERM', function() {
	gracefulShutDown('Heroku app shutdown', function() {
		process.exit(0)		
	})
})

// require locations
require('./locations')
