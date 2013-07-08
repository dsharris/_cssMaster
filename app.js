var express 	= require('express'),
	app 		= express(),
	chokidar 	= require('chokidar'),
	config 		= require('./config'),
	server 		= require('http').createServer(app),
	cleanCSS 	= require('clean-css'),
	walk 		= require('walk'),
	fs 			= require('fs'),
	watching 	= [];

app.set('port', process.env.PORT || 3999);

console.log(config);

for( i=0; i<config.sets.length; i++ ){
	settings = {
		ignored: /^\./,
		persistent: true
	};

	var dir 	= config.sets[i].directory,
		file 	= config.sets[i].file,
		name 	= config.sets[i].name;

	watching[i] = chokidar.watch(dir, settings);
	console.log("watching "+config.sets[i].directory);

	watching[i] 		.on('add', function(path) {console.log('File', path, 'has been added');})
		.on('change', function(path) {console.log('File', path, 'has been changed');})
		.on('unlink', function(path) {console.log('File', path, 'has been removed');})
		.on('error', function(error) {console.error('Error happened', error);})

	watching[i].on('change', function(path, stats) {
		runUpdater(dir, file, name);
	});

	watching[i].on('unlink', function(path, stats) {
		runUpdater(dir, file, name);
	});

	watching[i].on('add', function(path, stats) {
		runUpdater(dir, file, name);
	});

	watching[i].close();
}

server.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'))
})


function runUpdater(dir, file, name){
	var files   	= [],
		walker  	= walk.walk(dir, { followLinks: false })
		finalCssArr	= [];

	walker.on('file', function(root, stat, next) {
	    // Add this file to the list of files
	    files.push(root + '/' + stat.name);
	    next();
	});

	walker.on('end', function() {
		readTheFiles(files, name);
	});
}
function readTheFiles(theFiles, name){
	for( i=0; i<theFiles.length; i++){
		var file=theFiles[i];
		fs.readFile(file, 'utf8', function (err, data) {
			
			if (err) throw err;

			finalCssArr.push( cleanCSS.process(data) );

			if(finalCssArr.length == theFiles.length){ // This seems like a shitty way to do this
				writeTheFile(finalCssArr, name);
			}
		});

    }
}
function writeTheFile(arr, name){
	fs.writeFile(file, arr.join(' '), function (err) {
		if (err) throw err;
		console.log(name+' has been updated!');
	});
}
