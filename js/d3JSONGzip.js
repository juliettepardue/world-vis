// d3JSONGzip.js
// reads in gzipped JSON, returns data

(function($) {
	$.extend({
		getJSONGz: function(url, success) {
			var req = new XMLHttpRequest();
			req.open("GET", url, true);
			req.overrideMimeType("text/plain; charset=x-user-defined");
			req.responseType = "arraybuffer";
			req.onload = function(e) {
				if (req.readyState === 4 && req.status === 200) {
					var compressedArrayView = new Uint8Array(req.response);
					var unzipper = new Zlib.Gunzip(compressedArrayView);
					var decompressed = unzipper.decompress();
					
					var decompressedBlob = new Blob([decompressed]);
					var blobReader = new FileReader();
					blobReader.onload = function(e) {
						var dataString = e.target.result;
						var data = JSON.parse(dataString);
						return success(data, req.statusText, req);
					};
					blobReader.readAsText(decompressedBlob);
				}
			};
			req.send();
		}
	});
	
	$.extend(d3, {
		jsonGz: function(url, success) {
			$.getJSONGz(url, function(data, textStatus, req) {
				success(null, data);
			});
		}
	});
	
})(jQuery);