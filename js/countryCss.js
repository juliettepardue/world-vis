// countryCss.js
// determines appropriate color for each country

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

var updateMapStylesForYear = function (year) {
	var colorFunc = function(row) {
		var fillcolor = $.Color("#FFFFFF");
		var tints = [];
		var subtype = currentSubtypeSet;
		
		var scalefactor = (subtype.name in row.scalefactors ? row.scalefactors[subtype.name] : 1.0);
		var value_normalized = (row[subtype.name] * scalefactor);
		var tintcolor = $.Color("transparent").transition($.Color(subtype.color), value_normalized);
		tints.push({
			color: tintcolor,
			valueNormalized: value_normalized
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
	
	$.each(dataset[selected].where(function (row) {
		return row.year == year;
	}), function (index, row) {
		colorCountry(row.country, colorFunc(row).toHexString());
	});
};
