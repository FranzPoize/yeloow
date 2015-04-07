(function(window) {
	window.DancingLink = function(set) {
		this.prevInRow = null;
		this.nextInRow = null;
		this.prevInCol = null;
		this.nextInCol = null;

		this.set = set;
	}

	DancingLink.prototype.removeRow = function() {
		var currentLink = this;
		do {

			currentLink.prevInCol.nextInCol = currentLink.nextInCol;
			currentLink.nextInCol.prevInCol = currentLink.prevInCol;

			currentLink = currentLink.nextInRow;

		} while (this != currentLink);
	}

	DancingLink.prototype.removeCol = function() {
		var currentLink = this;

		do {
			currentLink.prevInRow.nextInRow = currentLink.nextInRow;
			currentLink.nextInRow.prevInRow = currentLink.prevInRow;

			currentLink = currentLink.nextInCol;
		} while (this != currentLink);
	}

	window.DancingLinkHeader = function(index) {
		DancingLink.call(this);

		this.count = 0;
		this.voxelIndex = index;
	}

	DancingLinkHeader.prototype = Object.create(DancingLink.prototype);

	// DancingLinkHeader.prototype.addRow = function(set) {
	// 	var headerTemp = this.nextInRow;

	// 	for (var i = 0; i < set.minI; i++) {
	// 		headerTemp = headerTemp.nextInRow;
	// 	}

	// 	for (var i = 0; i < set.maxI;i++) {
	// 		var link = new DancingLink(set);

	// 		link.prevInCol = header;
	// 		link.nextInCol = header.nextInCol;
	// 		header.nextInCol = link;

	// 		if (!header.prevInCol) {
	// 			header.prevInCol = link;
	// 		}

	// 		if (prevLink) {
	// 			link.prevInRow = prevLink;
	// 			prevLink.nextInRow = link;
	// 			link.nextInRow = prevLink.nextInRow;
	// 			prevLink.nextInRow.prevInRow = link;
	// 		}
			
	// 		prevLink = link;
	// 	}
	// }
})(window);