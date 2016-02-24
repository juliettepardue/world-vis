// map.js
// draw and manipulate 2D map of the Earth
// uses data/world-countries.topojson.json (why not .gz?)

var svg = null;

yellINeedToLoad();
$.holdReady(true);
onDataReady(function(){
	var container = $("#mapcontainer");
	
	var projection = d3.geo.naturalEarth()
		.scale(215)
		.translate([container.width() / 2, container.height() / 2]);
	
	var svg = d3.select("#map")
		.attr("width", container.width())
		.attr("height", container.height());
	
	var pathGen = d3.geo.path()
		.projection(projection);
		
	var globe = {type: "Sphere"};
	svg.append("path")
		.datum(globe)
		.attr("class", "boundingCircle")
		.attr("d", pathGen);
		
	var graticule = d3.geo.graticule();
	svg.append("path")
		.datum(graticule)
		.attr("class", "graticule")
		.attr("d", pathGen);
	
	d3.json("data/world-countries.topojson.json", function(error, world) {
		svg.selectAll(".country")
			.data(topojson.feature(world, world.objects.collection).features)
			.enter()
				.append("path")
				.attr("class", function(d) { return "country " + d.id; })
				.attr("countryCode", function(d) { return d.id; })
				.attr("title", function(d) { return iso_code_to_name(d.id); })
				.attr("d", pathGen);
		
		$.holdReady(false);
		yellImDoneLoading();
	});
});
