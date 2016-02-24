// data.js
// reading in data for flunet vis

var flunet, population, averagepop, area, averagearea, fudgefactor, averagefudge;
var maxWeekNum, weekNumForYearAndWeek, yearAndWeekForWeekNum;
var maxWeekIndex, weekIndexForYearAndWeek, yearAndWeekForWeekIndex;

var iso3166 = null;
var iso_code_to_name = function(code) {
	try {
		return iso3166.filter(function(item) {
			return item.code == code;
		})[0].name;
	} catch (e) {
		return "";
	}
};

var iso_name_to_code = function(name) {
	try {
		return iso3166.filter(function(item) {
			return item.name == name;
		})[0].code;
	} catch (e) {
		return "";
	}
};

var makeNVD3Data = function(columnNames, filterFunction, aggFunc) {
	if (typeof(columnNames) === "undefined") columnNames = null;
	if (typeof(filterFunction) === "undefined") filterFunction = null;
	if (typeof(aggFunc) === "undefined") {
		aggFunc = function(a, b) {
			return a + b;
		};
	}
	
	var numericalColumnNames = [];
	var exampleRecord = flunet[0];
	Object.keys(exampleRecord).forEach(function(key) {
		if (typeof(exampleRecord[key]) === "number") {
			if (columnNames == null || columnNames.indexOf(key) != -1) numericalColumnNames.push(key);
		}
	});
	if (numericalColumnNames.length == 0) return [];
	
	var workingSet = (filterFunction != null ? flunet.where(filterFunction) : flunet);
	
	//console.log("aggregating " + workingSet.length + " records by weeknum");
	workingSet.sort(function(a, b){
		return (a.weeknum - b.weeknum);
	});
	workingSet = fold(function(acc, row) {
		numericalColumnNames.forEach(function(name) {
			acc.forEach(function(series, index) {
				if (series.key == name) {
					var lastitem = (series.values.length > 0 ? series.values[series.values.length - 1] : null);
					if (lastitem != null && lastitem.x == row.weeknum) {
						lastitem.y = aggFunc(lastitem.y, row[name]);
					} else {
						series.values.push({x: row.weeknum, y: row[name]});
					}
					acc[index] = series;
				}
			});
		});
		return acc;
	}, (function() {
		var innerArrays = [];
		numericalColumnNames.forEach(function(name) {
			innerArrays.push({
				key: name,
				values: []
			});
		});
		return innerArrays;
	})(), workingSet);
	
	//console.log(JSON.stringify(workingSet));
	return workingSet;
};

var dataReady, onDataReady;
(function(){
	var _dataReadyCounter = 0;
	var _dataReadyCallbacks = [];
	dataReady = function(isReady) {
		if (!isReady) {
			_dataReadyCounter++;
		} else {
			_dataReadyCounter--;
			if (_dataReadyCounter <= 0) {
				_dataReadyCounter = 0;
				var activeCallbacks = _dataReadyCallbacks.slice(0);
				_dataReadyCallbacks = [];
				activeCallbacks.forEach(function(callback){ callback(); });
			}
		}
	};
	onDataReady = function(callback) {
		if (_dataReadyCounter <= 0) {
			callback();
		} else {
			_dataReadyCallbacks.push(callback);
		}
	};
	
	var flunet_weeks_by_index = [];
	maxWeekNum = function() {
		return flunet_weeks_by_index[maxWeekIndex()].weeknum;
	};
	maxWeekIndex = function() {
		return flunet_weeks_by_index.length - 1;
	};
	weekNumForYearAndWeek = function(year, week) {
		if (typeof(year) !== "number") {
			week = year.week;
			year = year.year;
		}
		
		return flunet_weeks_by_index.where(function (item) {
			return item.year == year && item.week == week;
		})[0].weeknum;
	};
	weekIndexForYearAndWeek = function(year, week) {
		if (typeof(year) !== "number") {
			week = year.week;
			year = year.year;
		}
		
		return flunet_weeks_by_index.where(function (item) {
			return item.year == year && item.week == week;
		})[0].weekindex;
	};
	yearAndWeekForWeekNum = function(weeknum) {
		return flunet_weeks_by_index.slice(0).sort(function(a, b) {
			return (Math.abs(a.weeknum - weeknum) - Math.abs(b.weeknum - weeknum));
		})[0];
	};
	yearAndWeekForWeekIndex = function(weekindex) {
		return flunet_weeks_by_index[weekindex];
	};
	
	yellINeedToLoad();
	dataReady(false);
	$.getJSONGz("data/flunet_data.json.gz", function(data) {
		flunet = data.sort(function(a, b){
			if (a.year != b.year) {
				return a.year - b.year;
			} else {
				return a.week - b.week;
			}
		});
		
		for (var i = 0; i < flunet.length; i++) {
			var row = flunet[i];
			
			$.assert(row.num_a == row.num_a_unknown + row.num_a_h1 + row.num_a_h1n1_pdm09 + row.num_a_h3 + row.num_a_h5, "Year: " + row.year + "; Week: " + row.week + "; Country: " + row.country + "; Total for A inaccurate");
			$.assert(row.num_b == row.num_b_unknown + row.num_b_victoria + row.num_b_yamagata, "Year: " + row.year + "; Week: " + row.week + "; Country: " + row.country + "; Total for B inaccurate");
			$.assert(row.num_total >= row.num_a + row.num_b, "Year: " + row.year + "; Week: " + row.week + "; Country: " + row.country + "; Total inaccurate");
			//$.assert(row.spec_processed >= row.num_total, "Year: " + row.year + "; Week: " + row.week + "; Country: " + row.country + "; Spec. processed inaccurate");
			
			var firstyear = (flunet_weeks_by_index.length > 0 ? flunet_weeks_by_index[0].year : row.year);
			row.weeknum = (row.year - firstyear) * 53 + row.week;
			var lastweek = (flunet_weeks_by_index.length > 0 ? flunet_weeks_by_index[flunet_weeks_by_index.length - 1] : null);
			if (lastweek == null || row.year != lastweek.year || row.week != lastweek.week) {
				flunet_weeks_by_index.push({year: row.year, week: row.week, weeknum: row.weeknum});
			}
			row.weekindex = flunet_weeks_by_index.length - 1;
			row.scalefactors = {};
		}
		
		dataReady(true);
		yellImDoneLoading();
	});
	
	yellINeedToLoad();
	dataReady(false);
	$.getJSONGz("data/iso3166.json.gz", function(data) {
		iso3166 = data;
		dataReady(true);
		yellImDoneLoading();
	});
	
	yellINeedToLoad();
	dataReady(false);
	$.getJSONGz("data/population.json.gz", function(data) {
		population = data;
		var totalpop = 0;
		var totalnums = 0;
		for (var country in population) {
			for (var year in population[country]) {
				totalpop += population[country][year];
				totalnums++;
			}
		}
		averagepop = totalpop / totalnums;
		dataReady(true);
		yellImDoneLoading();
	});
	
	yellINeedToLoad();
	dataReady(false);
	$.getJSONGz("data/area.json.gz", function(data) {
		area = data;
		var totalarea = 0;
		var totalnums = 0;
		for (var country in area) {
			totalarea += area[country];
			totalnums++;
		}
		averagearea = totalarea / totalnums;
		dataReady(true);
		yellImDoneLoading();
	});
	
	yellINeedToLoad();
	dataReady(false);
	$.getJSONGz("data/fudgefactor.json.gz", function(data) {
		fudgefactor = data;
		var totalfudge = 0;
		var totalnums = 0;
		/*for (var country in fudgefactor) {
			for (var year in fudgefactor[country]) {
				totalfudge += fudgefactor[country][year];
				totalnums++;
			}
		}*/
		for (var year in fudgefactor) {
			totalfudge += fudgefactor[year];
			totalnums++;
		}
		averagefudge = totalfudge / totalnums;
		dataReady(true);
		yellImDoneLoading();
	});
})();

var flunetNormalizers = [];
var renormalizeData = function(subtypeSet){
	var weekMaxes = [];
	for (var i = 0; i < maxWeekIndex(); i++) weekMaxes[i] = 0;
	flunet.forEach(function(row,index){
		var thismax = fold(function(acc,type){
			return acc + row[type.name];// * row.scalefactors[type.name];
		}, 0, subtypeSet);
		if (weekMaxes[row.weekindex] < thismax) {
			weekMaxes[row.weekindex] = thismax;
		}
	});
	for (var i = 0; i < maxWeekIndex(); i++) {
		var thisWeekNum = weekNumForYearAndWeek(yearAndWeekForWeekIndex(i));
		var minweek = thisWeekNum - 26;
		if (minweek < 0) minweek = 0;
		var maxweek = thisWeekNum + 26;
		flunetNormalizers[i] = fold(function(acc, thismax){
			return (thismax > acc ? thismax : acc);
		}, 0, weekMaxes.slice(minweek, maxweek));
		if (thisWeekNum % 25 == 0) console.log("normalized week " + thisWeekNum + " to " + flunetNormalizers[i]);
	}
};
