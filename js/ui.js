// ui.js
// main UI components, including timeline slider and country pop-up

var data_colors = d3.scale.category10();

//functions
var updateUIForYearNum, playFunction, pauseFunction;

var subtypes = [];
var currentSubtypeSet = null;
var subtypeChangeCounter = 0;

(function(){
	var _yearnum = null;
	updateUIForYearNum = function(yearnum) {
		_yearnum = yearnum;
		$(document).trigger("flunet-update");
	};
	$(document).on("flunet-update", function(){
		var year = yearForYearNum(_yearnum);
		$("#timelabel").text(year);
		updateMapStylesForYear(year);
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
		
		updateUIForYearNum(_yearnum < years_by_index[selected].length-1 ? _yearnum+1 : 0);
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
	$("#filename").button();
	$("#filename").change(function(e) {
		var ext = $("input#filename").val().split(".").pop().toLowerCase();
		var filename = $("input#filename").val().split(".")[0].split("\\").pop();

		if($.inArray(ext, ["json"]) == -1) {
			alert('Only JSON files are accepted');
			this.value = null;
			return false;
		}
	
		if(e.target.files != undefined) {
			var reader = new FileReader();
			reader.onload = function(e) {
				selected = subtypes.length;
				var data = $.parseJSON(e.target.result);
				dataset[selected] = data.sort(function(a, b){
					if(a.year != b.year) {
						return a.year - b.year;
					}
				});
								
				var firstyear = dataset[selected][0].year;
				years_by_index[selected] = [];
		
				for(var i=0; i<dataset[selected].length; i++) {
					var row = dataset[selected][i];
			
					row.yearnum = years_by_index[selected].length;
					var lastyear = (years_by_index[selected].length > 0 ? years_by_index[selected][maxYearIndex()] : null);
					if(lastyear == null || row.year != lastyear.year) {
						years_by_index[selected].push({year: row.year, yearnum: row.yearnum});
					}
					row.yearindex = maxYearIndex();
					row.scalefactors = {};
				}
				
				console.log(JSON.stringify(years_by_index[selected]));
				
				subtypes.push({name: "value", prettyname: filename, color: data_colors(selected), id: selected});
				currentSubtypeSet = subtypes[selected];
				for(var i=0; i<subtypes.length; i++) {
					if(i != selected) {
						$('label[for="'+ i +'"]').css("color", data_colors(i));
						$('label[for="'+ i +'"]').css("background-color", "#eee");
					}
				}
				renormalizeData(currentSubtypeSet);
				
				var r= $('<input type="checkbox" class="datasets" id="' + selected + '" checked="checked"><label for="' + selected + '" style="background-color:' + data_colors(selected) + ';">' + filename + '</label>');
        		$("#input_data").append(r);
        		$("#" + selected).button();
				
				$(".datasets").click(function() {
					if(selected == this.id) {
						$("#"+this.id).prop("checked", true);
						return;
					}
					
					selected = this.id;
					$('label[for="'+ selected +'"]').css("color", "white");
					$('label[for="'+ selected +'"]').css("background-color", data_colors(selected));
					
					for(var i=0; i<subtypes.length; i++) {
						if(i != selected) {
							$('label[for="'+ i +'"]').css("color", data_colors(i));
							$('label[for="'+ i +'"]').css("background-color", "#eee");
							$("#"+i).prop("checked", false);
						}
					}
					
					currentSubtypeSet = subtypes[selected];
					scheduleSubtypeChangeEvent();
				});
        		
				scheduleSubtypeChangeEvent();
			};
			
			reader.readAsText(e.target.files.item(0));
		}

		this.value = null;
	});
	
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
	
	var dialogJQ = null;
	$(".country").click(function(){
		console.log("clicked");
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
		
	var _subtypeChangeCallbacks = [];
	var _subtypeChangeTriggerTimeout = null;
	var _subtypeChangeTriggerFunction = function() {
		var callbacks = _subtypeChangeCallbacks;
		_subtypeChangeCallbacks = [];
		if (_subtypeChangeTriggerTimeout != null) {
			clearTimeout(_subtypeChangeTriggerTimeout);
			_subtypeChangeTriggerTimeout = null;
		}
		
		subtypeChangeCounter++;
		yellINeedToLoad();
		$(document).on("flunet-update", function thisfunc() {
			yellImDoneLoading();
			$(document).off("flunet-update", thisfunc);
			callbacks.forEach(function(item){ item(); });
		});
		setTimeout(function(){
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
		
    	$("#mapradio_2d").trigger("click");
	
	yellImDoneLoading();
});
