// globe.js
// draw and manipulate globe 
// uses data/world-countries.topojson.json.gz

var getGlobeAngle, setGlobeAngle, getGlobeVelocity, setGlobeVelocity;

yellINeedToLoad();
$.holdReady(true);
onDataReady(function(){
	var container = $("#globecontainer");
	var diameter = (container.width() < container.height() ? container.width() : container.height());
	var radius = diameter/2;
	var velocity = [0, 0, 0];
	var initialangle = [0, 0, 0];
	var then = Date.now();
	var mousescale = radius / 90;
	var flingscale = 100 / (90/500);
	
	var projection_front = d3.geo.orthographic()
		.scale(radius - 2)
		.translate([radius, radius])
		.clipAngle(90);
	
	var projection_back = d3.geo.orthographic()
		.scale(radius - 2)
		.translate([radius, radius])
		.clipAngle(90);
	
	var svg = d3.select("#globe")
		.attr("width", diameter)
		.attr("height", diameter);
	
	var pathGen_front = d3.geo.path()
		.projection(projection_front);
		
	var pathGen_back = d3.geo.path()
		.projection(projection_back);

	var globe = {type: "Sphere"};
	svg.append("g")
		.attr("transform", "translate(" + diameter + ",0) scale(-1,1)")
		.attr("class", "backcontainer");
	svg.append("path")
		.datum(globe)
		.attr("class", "boundingCircle")
		.attr("d", pathGen_front);
	svg.append("g")
		.attr("class", "frontcontainer");
		
	var graticule = d3.geo.graticule();
	svg.select(".frontcontainer").append("path")
		.datum(graticule)
		.attr("class", "graticule")
		.attr("d", pathGen_front);
		
	svg.select(".backcontainer").append("path")
		.datum(graticule)
		.attr("class", "graticule")
		.attr("d", pathGen_back);
	
	d3.jsonGz("data/world-countries.topojson.json.gz", function(error, world) {
		svg.select(".frontcontainer").selectAll(".country")
			.data(topojson.feature(world, world.objects.collection).features)
			.enter()
				.append("path")
				.attr("class", function(d) { return "country " + d.id; })
				.attr("countryCode", function(d) { return d.id; })
				.attr("title", function(d) { return iso_code_to_name(d.id); })
				.attr("d", pathGen_front);
				
		svg.select(".backcontainer").selectAll(".country")
			.data(topojson.feature(world, world.objects.collection).features)
			.enter()
				.append("path")
				.attr("class", function(d) { return "country " + d.id; })
				.attr("countryCode", function(d) { return d.id; })
				.attr("d", pathGen_back);
		$.holdReady(false);
		yellImDoneLoading();
	});
	
	var _timerActive = false;
	function runGlobeTimer() {
		if (!_timerActive) {
			_timerActive = true;
			d3.timer(function() {
				var x = velocity[0] * (Date.now() - then) + initialangle[0];
				var y = velocity[1] * (Date.now() - then) + initialangle[1];
				var z = velocity[2] * (Date.now() - then) + initialangle[2];
				setGlobeAngle([x, y, z]);
				
				if (velocity[0] == 0 && velocity[1] == 0 && velocity[2] == 0) {	
					_timerActive = false;
					return true;
				}
			}, 50);
		}
	}
	
	var _currentangle = [0, 0, 0];
	getGlobeAngle = function() {
		var angle = _currentangle;
		for (var i = 0; i < angle.length; i++) {
			angle[i] %= 360;
			if (angle[i] < 0) angle[i] += 360;
		}
		return angle;
	}
	setGlobeAngle = function(angle) {
		_currentangle = angle;
		projection_front.rotate(angle);
		var back_angle = [angle[0] + 180, -angle[1], angle[2]];
		projection_back.rotate(back_angle);
		svg.select(".frontcontainer").selectAll("path").attr("d", pathGen_front.projection(projection_front));
		svg.select(".backcontainer").selectAll("path").attr("d", pathGen_back.projection(projection_back));
		runGlobeTimer();
	}
	setGlobeAngle(initialangle);
	
	getGlobeVelocity = function() {
		return velocity;
	};
	setGlobeVelocity = function(newvelocity) {
		if (!(newvelocity[0] == 0 && newvelocity[1] == 0 && newvelocity[2] == 0)) {
			$("#mapradio_globe + label").addClass("globeRunning");
		} else {
			$("#mapradio_globe + label").removeClass("globeRunning");
		}
		velocity = newvelocity;
		initialangle = getGlobeAngle();
		then = Date.now();
		runGlobeTimer();
	};
	setGlobeVelocity(velocity);
	
	var mousePosX = -1;
	var mousePosY = -1;
	$("#globe").mousedown(function(event){
		setGlobeVelocity([0, 0, 0]);
		mousePosX = event.pageX;
		mousePosY = event.pageY;
	}).mousemove(function(event){
		if (mousePosX != -1 && mousePosY != -1) {
			setGlobeVelocity([0, 0, 0]);
			var angle = getGlobeAngle();
			angle[0] += (event.pageX - mousePosX) / mousescale;
			angle[1] -= (event.pageY - mousePosY) / mousescale;
			setGlobeAngle(angle);
			
			mousePosX = event.pageX;
			mousePosY = event.pageY;
		}
	}).mouseup(function(event){
		mousePosX = -1;
		mousePosY = -1;
	})/*.mousefling( function(powerX, powerY){
		mousePosX = -1;
		mousePosY = -1;
		if (Math.abs(powerX) < 10) powerX = 0;
		if (Math.abs(powerY) < 10) powerY = 0;
		var angle = getGlobeAngle();
		setGlobeVelocity([powerX / flingscale, (angle[1] > 90 ? 1 : -1) * (powerY / flingscale), 0]);
	}, 5, { x: 50, y: 50 } )*/;
	
	
});
