// ui.js
// main UI components, including timeline slider and country pop-up

var updateUIForWeekNum, playFunction, pauseFunction;
var subtypes = [
	{
		name: "num_a",
		prettyname: "Influenza Type A (total)",
		color: "#AF2F35"
	},
	{
		name: "num_b",
		prettyname: "Influenza Type B (total)",
		color: "#2968A7"
	},
];
var currentSubtypeSet = [subtypes[0], subtypes[1]];
var subtypeChangeCounter = 0;

(function(){
	var _weeknum = null;
	updateUIForWeekNum = function(weeknum) {
		_weeknum = weeknum;
		$(document).trigger("flunet-update");
	};
	$(document).on("flunet-update", function(){
		var yearAndWeek = yearAndWeekForWeekNum(_weeknum);
		$("#timelabel").text(yearAndWeek.year + ", Week " + yearAndWeek.week);
		updateMapStylesForYearAndWeek(yearAndWeek.year, yearAndWeek.week);
	});

	var _playTimeout = null;
	playFunction = function() {
		if (_playTimeout == null) {
			$("#play").button("option", {
				label: "pause",
				icons: {
					primary: "ui-icon-pause"
				}
			});
		}
		_playTimeout = setTimeout(playFunction, 500);
	
		var slider = $("#slider");
		var newValue = slider.slider("value") + slider.slider("option", "step");
		if (newValue > slider.slider("option", "max")) newValue = slider.slider("option", "min");
		slider.slider("value", newValue);
	};
	pauseFunction = function() {
		if (_playTimeout != null) {
			clearTimeout(_playTimeout);
			_playTimeout = null;
			$("#play").button("option", {
				label: "play",
				icons: {
					primary: "ui-icon-play"
				}
			});
		}
	};
})();

yellINeedToLoad();
$(function(){
	// Activate tooltips
	$(".country").tooltip({
		position: {
			my: "left+15 center",
			at: "right center"
		}
	});
	
        // Set up map selectors
        $("#mapradio").buttonset();
        $("#mapradio_2d").click(function() {
               $("#globecontainer").fadeOut(1000, function() {
                       setGlobeVelocity([0, 0, 0]);
               });
               $("#mapcontainer").fadeIn(1000);
        });
        $("#mapradio_globe").click(function() {
               if (!($("#globec7ontainer").is(":visible"))) setGlobeAngle([0, -30, 0]);
               setGlobeVelocity([0.01, 0, 0]);
               $("#mapcontainer").fadeOut(1000);
               $("#globecontainer").fadeIn(1000);
        });
        $("#mapcontainer").fadeIn(1000);
	
	// Set up play/pause button
	$("#play").button({
		text: false,
		icons: {
			primary: "ui-icon-play"
		}
	}).click(function() {
		if ($(this).text() == "play") {
			playFunction();
		} else {
			pauseFunction();
		}
    });
	
	// Set up toolbox buttons
	$("#settingsbox").dialog({
		modal: false,
		autoOpen: false,
		resizable: true,
		draggable: true,
		show: true,
		height: 178,
		width: 300,
		position: "right",
		title: "Map Color Filters"
	});
	$("#settingsbox button").button({
		text:false,
		icons:{
			primary: "ui-icon-help"
		}
	}).click(function(event,ui){
		$("#" + $(this).attr("id") + "_text").dialog("option", "title", $(this).text()).dialog("open");
	});
	$("#settingsbox p").dialog({
		modal: true,
		autoOpen: false,
		show: true,
		height: 200,
		width: 400,
		position: "center"
	});
	$("#settings").button({
		text:false,
		icons:{
			primary: "ui-icon-gear"
		}
	}).click(function(event,ui){
		if (!$("#settingsbox").dialog("isOpen")) {
			$("#settingsbox").dialog("open");
		} else {
			$("#settingsbox").dialog("close");
		}
	});
	$("#aboutbox").dialog({
		modal: true,
		autoOpen: false,
		resizable: false,
		draggable: false,
		show: true,
		height: 600,
		width: 800,
		position: "center",
		title: "About This Program"
	});
	$("#about").button({
		text:false,
		icons:{
			primary: "ui-icon-help"
		}
	}).click(function(event,ui){
		$("#aboutbox").dialog("open");
	});
	
	// Set up filter buttons
	$("#pop_box").button().data("filterName", "population");
	$("#area_box").button().data("filterName", "area");
	$("#ff_box").button().data("filterName", "fudgefactor");
	$("#bb_box").button().data("filterName", "blueboost");
	
	$("#settingsbox input").change(function(event, ui){
		$(this).button("refresh");
		activeFilters = [];
		$("#settingsbox input").each(function(index, item){
			var filtername = $(item).data("filterName");
			if ($(item).is(":checked") && filtername) {
				activeFilters.push(dataFilters.where(function(item){ return item.name == filtername; })[0]);
			}
		});
		scheduleSubtypeChangeEvent();
	});
	
	
	// Set up slider
	$("#slider").slider({
		min: 1,
		max: maxWeekNum(),
		step: 1,
		slide: function( event, ui ) {
			updateUIForWeekNum(ui.value);
			pauseFunction();
		},
		change: function( event, ui ) {
			updateUIForWeekNum(ui.value);
		}
	}).slider("value", weekNumForYearAndWeek(2009, 25));
	
	// Set up slider graph
	nv.addGraph(function() {
		var chart = nv.models.stackedAreaChart();
		chart.showLegend(false);
		chart.showControls(false);
		chart.showXAxis(true);
		chart.showYAxis(false);
		chart.useInteractiveGuideline(false);
		chart.margin({top:0,left:0,bottom:0,right:0});
		chart.tooltip(null);
		
		chart.xScale(d3.scale.linear());
		chart.yScale(d3.scale.pow().exponent(0.33));
		
		var tickValues = [];
		for (var i = 1; i <= maxWeekNum(); i+= 53) tickValues.push(i);
		chart.xAxis.tickValues(tickValues);
		
		var svg = d3.select('#chart1svg');
		
		svg.datum([]).call(chart);
			
		updateChartFunction = function(){
		    // only Influenza A
		    svg.datum(makeNVD3Data(subtypes[0].name));
		    chart.color([subtypes[0].color]);
		    chart.update();
		}
		$(document).bind("flunet-update", updateChartFunction);

		updateChartFunction();
		return chart;
	});
	
        // MCW: add 2nd graph 
	nv.addGraph(function() {
		var chart = nv.models.stackedAreaChart();
		chart.showLegend(false);
		chart.showControls(false);
		chart.showXAxis(true);
		chart.showYAxis(false);
		chart.useInteractiveGuideline(false);
		chart.margin({top:0,left:0,bottom:0,right:0});
		chart.tooltip(null);
		
		chart.xScale(d3.scale.linear());
		chart.yScale(d3.scale.pow().exponent(0.33));
		
		var tickValues = [];
		for (var i = 1; i <= maxWeekNum(); i+= 53) tickValues.push(i);
		chart.xAxis.tickValues(tickValues);
		
		var svg = d3.select('#chart2svg');
		
		svg.datum([]).call(chart);
			
		updateChartFunction = function(){
		    // only Influenza B
		    svg.datum(makeNVD3Data(subtypes[1].name));
		    chart.color([subtypes[1].color]);
		    chart.update();
		}
		$(document).bind("flunet-update", updateChartFunction);

		updateChartFunction();
		return chart;
	});


	var dialogJQ = null;
	$(".country").click(function(){
		if (dialogJQ != null) dialogJQ.dialog("close");
		pauseFunction();
		
		var countryCode = d3.select(this).attr("countryCode");
		var updateChartFunction;
		dialogJQ = $("<div class='countryPopoutDialog'></div>");
		dialogJQ.append($("<div class='xLabel'>Time</div>"));
		dialogJQ.append($("<div class='yLabel'>Number of Infected Samples</div>"));
		
		nv.addGraph(function() {
			var chart = nv.models.stackedAreaChart();

			chart.showLegend(false);
			chart.showControls(true);
			chart.tooltip(function(key, x, y, e, graph){
				var weekAndYear = yearAndWeekForWeekNum(e.point.x);
				var prettyname = subtypes.where(function(type){ return type.name == key; })[0].prettyname;
				return "<h3>" + prettyname + "</h3><p>" + e.point.y + " samples reported on week " + weekAndYear.week + " of " + weekAndYear.year + "</p>";
			});
			//chart.stacked.style("stacked");
			
			chart.xScale(d3.scale.linear());
			chart.yScale(d3.scale.linear());
			//chart.yScale(d3.scale.pow().exponent(0.33));
			chart.forceX([300 - 26, 300 + 26]);
			
			//chart.color(["#AF2F35","#2968A7"]);
			
			var tickValues = [];
			for (var i = 1; i <= maxWeekNum(); i+= 53/12) tickValues.push(i);
			chart.xAxis.tickValues(tickValues);
			
			var tickDescFunc = function(x){
				var yearAndWeek = yearAndWeekForWeekNum(x);
				var date = new Date((new Date(yearAndWeek.year, 0)).getTime() + 1000*60*60*24*7*yearAndWeek.week);
				return d3.time.format("%m/%Y")(date);
			};
			chart.xAxis.showMaxMin(false).tickFormat(tickDescFunc);
			
			var svg = d3.select(dialogJQ.get()[0]).append("svg");
			svg.datum([]).transition().duration(0).call(chart);
			
			var countryData;
			updateChartFunction = function(){
				var thisweeknum = $("#slider").slider("value");
				var subtypeNames = currentSubtypeSet.map(function(item){ return item.name; });
				var subtypeColors = currentSubtypeSet.map(function(item){ return item.color; });
				
				var forceDataUpdate = false;
				if (dialogJQ.data("subtypeChangeCounter") != subtypeChangeCounter) {
					dialogJQ.data("subtypeChangeCounter", subtypeChangeCounter)
					countryData = makeNVD3Data(subtypeNames, function(row) {
						return (row.country == countryCode);
					});
					forceDataUpdate = true;
					chart.color(subtypeColors);
				}
				if (forceDataUpdate || dialogJQ.data("currentweek") != thisweeknum) {
					dialogJQ.data("currentweek", thisweeknum);
					chart.forceX([thisweeknum - 26, thisweeknum + 26]);
					var newData = countryData.map(function(item) {
						item = $.extend({}, item);
						item.values = item.values.slice(0).where(function(point){ return (point.x >= thisweeknum - 26 && point.x <= thisweeknum + 26);});
						return item;
					});
					svg.datum(newData);
					
					//var legitTicks = tickValues.where(function(item){ return ((item >= thisweeknum - 26 && item <= thisweeknum + 26)); });
					
					//$(".countryPopoutDialog .nv-x .tick").css("visibility", "hidden").filter("* text:contains('01/1995')").css("visibility", "visible");
					
					
					/*.each(function(index, item){
						var isLegit = false;
						legitTicks.some(function(tickVal){
							return ($(item).children("text").first().text().indexOf(tickDescFunc(tickVal)) != -1);
						});
						
						$(item).css("visibility", (isLegit ? "visible" : "hidden"));
					});*/
				}
				chart.update();
			}
			
			dialogJQ.on("dialogresize", updateChartFunction);
			$(document).bind("flunet-update", updateChartFunction);
			
			updateChartFunction();
			return chart;
		});
		
		dialogJQ.dialog({
			title: iso_code_to_name(countryCode),
			minWidth: 850,
			minHeight: 415,
			width: 850,
			height: 415,
			close: function(event, ui) {
				$(document).unbind("flunet-update", updateChartFunction);
				dialogJQ = null;
			}
		});
	});
	
	
	/*document.addEventListener("DOMNodeInserted", function(event) {
		var node = $(event.target);
		if (node.is(".countryPopoutDialog .nvtooltip")){
			node.on("click", function(event){
				event.stopPropagation();
				event.stopImmediatePropagation();
				event.preventDefault();
				return false;
			});
		}
	});*/
	
	// Set up subtype buttons
	$("#a_total").button().data("subtypeName", "num_a");
	$("#b_total").button().data("subtypeName", "num_b");
	
	/*$("#subtypecontainer input").change(function(event,ui){
		if (this.checked) {
			
		} else {
			
		}
	});*/
	
	var _subtypeChangeCallbacks = [];
	var _subtypeChangeTriggerTimeout = null;
	var _subtypeChangeTriggerFunction = function() {
		var callbacks = _subtypeChangeCallbacks;
		_subtypeChangeCallbacks = [];
		if (_subtypeChangeTriggerTimeout != null) {
			clearTimeout(_subtypeChangeTriggerTimeout);
			_subtypeChangeTriggerTimeout = null;
		}
		
		console.log("now showing " + currentSubtypeSet.map(function(subtype){ return subtype.name; }).join(", "));
		subtypeChangeCounter++;
		yellINeedToLoad();
		$(document).on("flunet-update", function thisfunc() {
			yellImDoneLoading();
			$(document).off("flunet-update", thisfunc);
			callbacks.forEach(function(item){ item(); });
		});
		setTimeout(function(){
			applyActiveFilters();
			$(document).trigger("flunet-update");
		}, 100);
	}
	var scheduleSubtypeChangeEvent = function(callback) {
		if (typeof(callback) != "undefined") _subtypeChangeCallbacks.push(callback);
		pauseFunction();
		if (_subtypeChangeTriggerTimeout != null) {
			clearTimeout(_subtypeChangeTriggerTimeout);
			_subtypeChangeTriggerTimeout = null;
		}
		_subtypeChangeTriggerTimeout = setTimeout(_subtypeChangeTriggerFunction, 1000);
	}
	$("#a_total").change(function(event, ui){
		var buttons = $("#a_container input");
		var callback = null;
		if (this.checked) {
			buttons.prop("checked", false).trigger("change");
			callback = function(){
				$("#a_container").hide("slide", {
					direction: "right"
				});
			};
		} else {
			buttons.prop("checked", true).trigger("change");
			callback = function(){
				$("#a_container").show("slide", {
					direction: "right"
				});
			};
		}
		scheduleSubtypeChangeEvent(callback);
	});
	$("#b_total").change(function(event, ui){
		var buttons = $("#b_container input");
		if (this.checked) {
			buttons.prop("checked", false).trigger("change");
			callback = function(){
				$("#b_container").hide("slide", {
					direction: "left"
				});
			};
		} else {
			buttons.prop("checked", true).trigger("change");
			callback = function(){
				$("#b_container").show("slide", {
					direction: "left"
				});
			};
		}
		scheduleSubtypeChangeEvent(callback);
	});
	
	$("#subtypecontainer input").change(function(event, ui){
		if (this.checked == false && currentSubtypeSet.length <= 1) this.checked = true;
		$(this).button("refresh");
		currentSubtypeSet = [];
		$("#subtypecontainer input").each(function(index, item){
			var typename = $(item).data("subtypeName");
			if ($(item).is(":checked") && typename) {
				currentSubtypeSet.push(subtypes.where(function(item){ return item.name == typename; })[0]);
			}
		});
		scheduleSubtypeChangeEvent();
	});

        $("#mapradio_globe").trigger("click");
	
	yellImDoneLoading();
});