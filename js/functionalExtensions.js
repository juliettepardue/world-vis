// functionalExtensions.js

// These functions are courtesy of Microsoft's Dorian Corompt.
// See http://blogs.msdn.com/b/doriancorompt/archive/2013/01/21/bringing-the-querying-power-of-sql-to-javascript.aspx

function curry(f) {
	var slice = Array.prototype.slice;
	var args = slice.call(arguments, 1);
	return function () {
		return f.apply(this, args.concat(slice.call(arguments, 0)));
	};
}

function fold(foldFunc, initial_acc, vector) {
	var acc = initial_acc;
	for (var i = 0; i < vector.length; ++i) {
		acc = foldFunc(acc, vector[i]);
	}
	return acc;
}

function map(f, v) {
	return fold(function (acc, x) {
		return acc.concat(f(x));
	}, [], v);
}

function filter(p, v) {
	return fold(function (acc, x) {
		if (p(x)) {
			return acc.concat(x);
		} else {
			return acc;
		}
	}, [], v);
}

Array.prototype.where = function (p) {
	return filter(p, this);
};

Array.prototype.select = function (f) {
	return map(f, this);
};
