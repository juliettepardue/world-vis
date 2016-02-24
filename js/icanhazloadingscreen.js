// icanhazloadingscreen.js
// draws the various loading screens

var yellINeedToLoad, yellImDoneLoading, yellLoadingStartsNow;

(function() {
	var yelldelay = 500;
	var finaldelay = 500;

        var _loadingMessages = ["Unclogging tubes...", "Loading data...", "Rearranging internet...", "Searching web..", "Reticulating splines...", "Deciphering codes...", "Spinning globe...", "Mixing paint...", "Ready!"];
	var _loadingCounter = _loadingMessages.length - 1;
	var _loadingFinishedOnce = false;
	var _loadingBar;
	var _loadingLabel;

	var loadingStarted = false;
	yellLoadingStartsNow = function(){
		if (!loadingStarted) {
			loadingStarted = true;
			_loadingBar = $("#loadingbox .progressbar");
			_loadingLabel = _loadingBar.find(".progresslabel");
			_loadingBar.progressbar({
				value: (_loadingCounter == 0 ? false : _loadingCounter),
				max: _loadingMessages.length - 1,
			});
		}
	};
	
	var loadingStatusChanged = function() {
		_loadingBar.progressbar("option", "value", (_loadingFinishedOnce || _loadingCounter == 0 ? false : _loadingCounter));
		_loadingLabel.text(_loadingMessages[_loadingCounter]);
		if (_loadingCounter == _loadingMessages.length - 1) {
			_loadingFinishedOnce = true;
			setTimeout(function(){
				$("#loadingboxcontainer").css("display", "none");
				$("#container").animate({ opacity: 1 });
			}, finaldelay);
		} else {
			$("#loadingboxcontainer").css("display", "block");
		}
	};

	yellImDoneLoading = function() {
		setTimeout(function(){
			_loadingCounter++;
			console.log("_loadingCounter: " + _loadingCounter);
			if (loadingStarted && _loadingCounter <= _loadingMessages.length) {
				loadingStatusChanged();
			}
		}, yelldelay);
	};
		
	yellINeedToLoad = function() {
		_loadingCounter--;
		console.log("_loadingCounter: " + _loadingCounter);
		if (loadingStarted && _loadingCounter <= _loadingMessages.length) {
			loadingStatusChanged();
		}
	};
})();