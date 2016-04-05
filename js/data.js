// data.js
// reading in data for flunet vis

var selected = 0;
var dataset = new Array(10);
var years_by_index = new Array(10);

//functions
var maxYearNum, maxYearIndex, yearNumForYear, yearForYearNum, yearIndexForYear, yearForYearIndex = [];

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
	var exampleRecord = dataset[selected][0];
	Object.keys(exampleRecord).forEach(function(key) {
		if (typeof(exampleRecord[key]) === "number") {
			if (columnNames == null || columnNames.indexOf(key) != -1) numericalColumnNames.push(key);
		}
	});
	if (numericalColumnNames.length == 0) return [];
	
	var workingSet = dataset[selected];
	
	workingSet.sort(function(a, b){
		return (a.year - b.year);
	});
	workingSet = fold(function(acc, row) {
		numericalColumnNames.forEach(function(name) {
			acc.forEach(function(series, index) {
				if (series.key == name) {
					var lastitem = (series.values.length > 0 ? series.values[series.values.length - 1] : null);
					if (lastitem != null && lastitem.x == row.yearnum) {
						lastitem.y = aggFunc(lastitem.y, row[name]);
					} else {
						series.values.push({x: row.yearnum, y: row[name]});
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
		
	maxYearNum = function() {
		return years_by_index[selected][maxYearIndex()].yearnum;
	};
	maxYearIndex = function() {
		return years_by_index[selected].length - 1;
	};
	yearNumForYear = function(year) {
		return years_by_index[selected].where(function (item) {
			return item.year == year;
		})[0].yearnum;
	};
	yearIndexForYear = function(year) {
		return years_by_index[selected].where(function (item) {
			return item.year == year;
		})[0].yearindex;
	};
	yearForYearNum = function(yearnum) {
		return years_by_index[selected].slice(0).sort(function(a, b) {
			return (Math.abs(a.yearnum - yearnum) - Math.abs(b.yearnum - yearnum));
		})[0].year;
	};
	yearForYearIndex = function(yearindex) {
		return years_by_index[selected][yearindex];
	};
	
	yellINeedToLoad();
	dataReady(false);
	
	dataset[0] = [];
	years_by_index[0] = [];
	dataReady(true);
	yellImDoneLoading();
	
	yellINeedToLoad();
	dataReady(false);
	$.getJSONGz("data/iso3166.json.gz", function(data) {
		iso3166 = data;
		dataReady(true);
		yellImDoneLoading();
	});
	
	yellINeedToLoad();
	dataReady(false);
	//load population data
	dataReady(true);
	yellImDoneLoading();
		
	yellINeedToLoad();
	dataReady(false);
	//load area data
	dataReady(true);
	yellImDoneLoading();
	
	yellINeedToLoad();
	dataReady(false);
	//load participation data
	dataReady(true);
	yellImDoneLoading();
})();

var normalizers = [];
var renormalizeData = function(subtypeSet) {
	console.log("renormalize data");
	console.log(JSON.stringify(subtypeSet));
	console.log(JSON.stringify(dataset[selected][0]));
	var yearMins = new Array(maxYearIndex()+1);
	var yearMaxes = new Array(maxYearIndex()+1);
	
	for(var i=0; i<=maxYearIndex(); i++) {
		yearMins[i] = Number.MAX_VALUE;
		yearMaxes[i] = -1*Number.MAX_VALUE;
	}
	
	for(var i=0; i<dataset[selected].length; i++) {
		if(dataset[selected][i].value < yearMins[dataset[selected][i].yearindex])
			yearMins[dataset[selected][i].yearindex] = dataset[selected][i].value;
		if(dataset[selected][i].value > yearMaxes[dataset[selected][i].yearindex])
			yearMaxes[dataset[selected][i].yearindex] = dataset[selected][i].value;	
	}
	
	/*for(var i=0; i<=maxYearIndex(); i++) {
		console.log("Min " + i + " = " + yearMins[i]);
		console.log("Max " + i + " = " + yearMaxes[i]);
	}*/
	
	dataset[selected].forEach(function(row,index) {
		dataset[selected][index].scalefactors[subtypeSet.name] = 1.0/yearMaxes[row.yearnum];
	});
};
