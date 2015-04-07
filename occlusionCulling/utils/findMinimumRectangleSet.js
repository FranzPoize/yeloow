'use strict';

(function(window) {
	/* Ok so this is NP-complete
	Since we don't care (for the moment) about performance in the portal map construction
	and we care about performance during the runtime culling. We kind of need to find
	the minimum set of rectangle that cover exactly the cell boundary with the tile.

	For that we use Knuth's algorithm http://en.wikipedia.org/wiki/Knuth%27s_Algorithm_X

	First we will construct the complete list of rectangular set.

	And then using DLX (maybe ?) http://en.wikipedia.org/wiki/Dancing_Links to construct
	the complete list of solution (or stop when the set size is 1 because there is nothing
	better than 1 rectangle)
	*/
	function Set( minI, minJ, maxI, maxJ ) {
		this.minI = minI;
		this.minJ = minJ;
		this.maxI = maxI;
		this.maxJ = maxJ;
	}

	Set.prototype.Print = function(tileSize,boundaryVoxel) {
		console.log('Set is =');
		for (var i = 0; i < tileSize; i++) {
			var row = i + " ";
			for (var j = 0; j < tileSize; j++) {
				if (i >= this.minI && j >= this.minJ && i <= this.maxI && j <= this.maxJ) {
					row += "1,";
				} else if (boundaryVoxel[i+j*tileSize] == 0) {
					row += "2,";
				} else {
					row+= "0,";
				}
			}

			console.log(row);
		}

		console.log("");
	};

	Set.prototype.constructArray = function(tileSize,boundaryVoxel) {
		var setArray = [];

		for (var i = 0; i < tileSize; i++) {
			for (var j = 0; j < tileSize; j++) {
				if (i >= this.minI && j >= this.minJ && i <= this.maxI && j <= this.maxJ) {
					setArray.push(1);
				} else if (boundaryVoxel[i+j*tileSize] == 1) {
					setArray.push(0);
				}
			}
		}
		return setArray;
	}

	window.constructSetList = function(boundaryVoxel,tileSize) {
		var setList = [];

		var header = constructHeaderFromBoundaryVoxels(boundaryVoxel);
		//starting simple we just add every square that is not filled to the set list
		for (var i = 0;i < tileSize;i++) {
			for (var j = 0; j < tileSize; j++) {
				expandSet(boundaryVoxel, tileSize, i, j, setList);
			}
		}

		for (var j = 0; j < setList.length; j++) {
			var setArray = setList[j].constructArray(tileSize, boundaryVoxel);

			addRowToDancingMatrix(header,setArray);
		}

		return {
			header:header,
			sets:setList
		};
	}

	function expandSet(boundaryVoxel, tileSize, minI, minJ, setList) {
		for (var i = minI; i < tileSize; i++) {

			if (boundaryVoxel[i+minJ*tileSize]) {

				for (var j = minJ; j < tileSize; j++) {
					var rowIsOk = true;

					for (var rowI = minI; rowI <= i; rowI++) {

						if (!boundaryVoxel[rowI+j*tileSize]) {
							rowIsOk = false;
						}

					}

					if ( rowIsOk ) {
						setList.push(new Set(minI, minJ, i, j));
					} else {
						break;
					}
				}

			} else {
				break;
			}

		}
	}

	function addRowToDancingMatrix(header, setArray) {
		var prevLink,
			firstLink;
		for (var i = 0; i < setArray.length; i++) {
			var item = setArray[i];

			if (item) {
				var link = new DancingLink(setArray);

				if (prevLink) {
					link.prevInRow = prevLink;
					prevLink.nextInRow = link;
				}

				link.prevInCol = header;
				header.nextInCol.prevInCol = link;
				link.nextInCol = header.nextInCol;
				header.nextInCol = link;

				if (!firstLink) {
					firstLink = link;
				}

				header.count += 1;

				prevLink = link;
			}

			header = header.nextInRow;
		}

		prevLink.nextInRow = firstLink;
		firstLink.prevInRow = prevLink;
	}

	window.constructHeaderFromBoundaryVoxels = function(boundaryVoxel) {
		var header,
			prevHeader;

		for (var j = 0; j < boundaryVoxel.length; j++) {
			if (boundaryVoxel[j]) {
				var linkHeader = new DancingLinkHeader(j);

				if (prevHeader) {
					prevHeader.nextInRow = linkHeader;
					linkHeader.prevInRow = prevHeader;
				}

				// Edge case
				if (!header) {
					header = linkHeader;
				}

				if (j === boundaryVoxel.length - 1) {
					header.prevInRow = linkHeader;
					linkHeader.nextInRow = header;
				}

				linkHeader.nextInCol = linkHeader;
				linkHeader.prevInCol = linkHeader;

				prevHeader = linkHeader;
			}
		}

		return header;
	}
})(window)