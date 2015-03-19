(function(window) {
	window.DynamicLink = function(header, set) {
		this.prevInRow = null;
		this.nextInRow = null;
		this.prevInCol = null;
		this.nextInCol = null;

		this.header = header;
		this.set = set;
	}

	DynamicLink.prototype.removeRow = function() {
		var currentLink = this;
		do {

			currentLink.prevInCol.nextInCol = currentLink.nextInCol;
			currentLink.nextInCol.prevInCol = currentLink.prevInCol;

			currentLink = currentLink.nextInRow;

		} while (this != currentLink);
	}

	DynamicLink.prototype.removeCol = function() {
		var currentLink = this;

		do {
			currentLink.prevInRow.nextInRow = currentLink.nextInRow;
			currentLink.nextInRow.prevInRow = currentLink.prevInRow;

			currentLink = currentLink.nextInCol;
		} while (this != currentLink);
	}

	window.DynamicLinkHeader = function(index) {
		DynamicLink.call(this);

		this.count = 0;
		this.voxelIndex = index;
	}

	DynamicLinkHeader.prototype = Object.create(DynamicLink.prototype);
})(window);