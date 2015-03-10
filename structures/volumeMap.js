'use strict';

(function(window) {
	window.BA = window.BA || {};

	window.BA.VolumeMap = function() {
		this.map = {};
		this.length = 0;
	}

	window.BA.VolumeMap.prototype.insert = function(x, y ,z, data) {
		this.map[x + ',' + y + ',' + z] = data;
		this.length++;
	};

	window.BA.VolumeMap.prototype.remove = function(x, y, z) {
		this.map[x + ',' + y + ',' + z] = undefined;
		this.length--;
	}

	window.BA.VolumeMap.prototype.get = function (x, y, z) {
		return this.map[x + ',' + y + ',' + z];
	}
})(window)