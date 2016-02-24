// dataFilters.js
// data manipulations specific to flunet data

var dataFilters = [
	{
		name: "population",
		filter: function(row, subtypeName) {
			return (row.country in population && row.year in population[row.country] ? (averagepop / (population[row.country][row.year])) : 1);
		}
	},
	{
		name: "area",
		filter: function(row, subtypeName) {
			return (row.country in area ? (averagearea / area[row.country]) : 1);
		}
	},
	{
		name: "fudgefactor",
		filter: function(row, subtypeName) {
			//return (row.country in fudgefactor && row.year in fudgefactor[row.country] ? (averagefudge / (fudgefactor[row.country][row.year]))  : 1);
			return (row.year in fudgefactor ? (averagefudge / fudgefactor[row.year]) : 1) / 128;
		}
	},
	{
		name: "blueboost",
		filter: function(row, subtypeName) {
			return (subtypeName.indexOf("num_b") == 0 ? 10 : 1);
		}
	}
];
var activeFilters = [dataFilters[0], dataFilters[1], dataFilters[2]];//dataFilters[0], dataFilters[1], dataFilters[2], dataFilters[3]];
var applyActiveFilters = function(){
	flunet.forEach(function(row, index){
		flunet[index].scalefactors = {};
		subtypes.forEach(function(subtype){
			flunet[index].scalefactors[subtype.name] = fold(function(acc, filter){
				return acc * filter.filter(row, subtype.name);
			}, 1.0, activeFilters);
		});
	});
	renormalizeData(currentSubtypeSet);
};
onDataReady(function(){
	/*var calulateFudgeFactors = function(){
		fudgefactor = {};
		for (var year = 1995; year <= 2013; year++) {
			var yearrecords = flunet.where(function(row){ return row.year == year && ["Sporadic", "Local Outbreak", "Regional Outbreak", "Widespread Outbreak"].indexOf(row.level) != -1; });
			var acc = fold(function(acc,row){
				if (!(row.level in acc)) acc[row.level] = {};
				if (!(row.country in acc[row.level])) acc[row.level][row.country] = 0;
				acc[row.level][row.country] += row.num_total;
				return acc;
			}, {}, yearrecords);
			for (var level in acc) {
				for (var country in acc[level]) {
					if (!(country in population)) {
						delete acc[level][country];
					} else {
						acc[level][country] /= (averagepop / population[country][year]);
						acc[level][country] /= acc[level]["USA"];
					}
				}
			}
			for (var level in acc) {
				for (var country in acc[level]) {
					if (!(country in fudgefactor)) fudgefactor[country] = {};
					if (!(year in fudgefactor[country])) fudgefactor[country][year] = {total:0, num:0};
					fudgefactor[country][year].total += acc[level][country];
					fudgefactor[country][year].num++;
				}
			}
		}
		for (var country in fudgefactor) {
			for (var year in fudgefactor[country]) {
				var obj = fudgefactor[country][year];
				fudgefactor[country][year] = obj.total / obj.num;
				if (fudgefactor[country][year] == null) debugger;
			}
		}
		console.log(JSON.stringify(fudgefactor));
	};*/
	
	var calulateFudgeFactors = function(){
		fudgefactor = {};
		for (var year = 1995; year <= 2013; year++) {
			var yearrecords = flunet.where(function(row){ return row.year == year && ["Sporadic", "Local Outbreak", "Regional Outbreak", "Widespread Outbreak"].indexOf(row.level) != -1; });
			fudgefactor[year] = fold(function(acc,row){
				return acc + row.num_total;
			}, 0, yearrecords);
		}
		for (var year in fudgefactor) {
			fudgefactor[year] /= fudgefactor["2012"];
		}
		console.log(JSON.stringify(fudgefactor));
	};
	
	//calulateFudgeFactors();
	applyActiveFilters();
});