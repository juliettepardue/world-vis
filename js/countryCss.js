// countryCss.js
// determines appropriate color for each country
// HOW IS THIS DIFFERENT THAN countryCssNewAndBroken.js?

var countryColorRules = [];
function colorCountry(countryName, color) {
	var countrySelector = "." + countryName.replace(/ /g, "_");
	var countryStyle = $("<style type='text/css'>" + countrySelector + " { fill: " + color + " !important; }</style>");
	countryStyle.appendTo("head");
	countryColorRules.push(countryStyle);
}

function clearCountryColors() {
	while (countryColorRules.length > 0) {
		var styleElement = countryColorRules.pop();
		styleElement.remove();
	}
}

var updateMapStylesForYearAndWeek = function (year, week) {
	var colorFunc = function(row) {
		var fillcolor = $.Color("#FFFFFF");
		var tints = [];
		currentSubtypeSet.forEach(function(subtype){
			var scalefactor = (subtype.name in row.scalefactors ? row.scalefactors[subtype.name] : 1.0);
			var value_normalized = (row[subtype.name] * scalefactor) / flunetNormalizers[row.weekindex];
			var tintcolor = $.Color("transparent").transition($.Color(subtype.color), value_normalized);
			tints.push({
				color: tintcolor,
				valueNormalized: value_normalized
			});
		});
		
		var totalTintValues = fold(function(acc, item) { return acc + item.valueNormalized; }, 0, tints);
		if (totalTintValues == 0) return fillcolor;

		var finalMix = [];
		tints.forEach(function(tint){
			var thisalpha = tint.valueNormalized / totalTintValues;
			var mixedcolor = Color_mixer.mix(tint.color, fillcolor).alpha(thisalpha);
			finalMix.push(mixedcolor);
		});
		return Color_mixer.mix(finalMix);
	};
	clearCountryColors();
	
	$.each(flunet.where(function (row) {
		return row.year == year && row.week == week;
	}), function (index, row) {
		colorCountry(row.country, colorFunc(row).toHexString());
	});
};