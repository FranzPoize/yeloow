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

			addRowToDancingMatrix(header.nextInRow,{array:setArray,set:setList[j]});
		}
		var solutionSet = [],
			result = {};
		findCoveringSet(header,solutionSet,result);

		result.solution.forEach(function(set) { set.set.Print(tileSize,boundaryVoxel); });

		return {
			header:header,
			sets:setList,
			result:result
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
		for (var i = 0; i < setArray.array.length; i++) {
			var item = setArray.array[i];

			if (item) {
				var link = new DancingLink(setArray,header);

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
		var header = {},
			prevHeader;

		header.nextInRow = header;
		header.prevInRow = header;

		for (var j = 0; j < boundaryVoxel.length; j++) {
			if (boundaryVoxel[j]) {
				var linkHeader = new DancingLinkHeader(j);

				if (prevHeader) {
					prevHeader.nextInRow = linkHeader;
					linkHeader.prevInRow = prevHeader;
				}

				// Edge case
				if (header.nextInRow == header) {
					header.nextInRow = linkHeader,
					linkHeader.prevInRow = header;
				}


				linkHeader.nextInCol = linkHeader;
				linkHeader.prevInCol = linkHeader;

				prevHeader = linkHeader;

				linkHeader.nextInRow = header;
				header.prevInRow = linkHeader;
			}
		}

		return header;
	}

	function findCoveringSet(header, solutionSet, result) {
		if (header.nextInRow == header) {
			if (!result.solution || result.length > solutionSet.length) {
				result.solution = solutionSet.map(function(set) { return set.set; });
				result.length = solutionSet.length;
				return 0;
			}
		} else if (result.length === 1) {
			return 0
		} else {

			var currentHeader = header.nextInRow,
				chosenHeader = header.nextInRow;

			while(header != currentHeader) {

				if (chosenHeader.count < currentHeader) {
					chosenHeader = currentHeader;
				}

				currentHeader = currentHeader.nextInRow;

			}

			coverCol(chosenHeader);

			var row = chosenHeader.nextInCol;

			while(row != chosenHeader) {
				solutionSet.push(row);

				var link = row.nextInRow;

				while(link != row) {
					coverCol(link.header);
					link = link.nextInRow;
				}

				findCoveringSet(header, solutionSet, result);

				if (result.length === 1) {
					return 0;
				}

				link = solutionSet.pop().prevInRow;

				while(link != row) {
					uncoverCol(link.header);
					link = link.prevInRow;
				}

				row = row.nextInCol;
			}

			uncoverCol(chosenHeader);

			return 0;
		}
	}

	function coverCol(header) {
		header.nextInRow.prevInRow = header.prevInRow;
		header.prevInRow.nextInRow = header.nextInRow;

		var row = header.nextInCol;
		while(row != header) {
			var col = row.nextInRow;
			while(col != row) {
				col.nextInCol.prevInCol = col.prevInCol;
				col.prevInCol.nextInCol = col.nextInCol;
				
				col.header.count = col.header.count - 1;

				col = col.nextInRow;
			}

			row = row.nextInCol;
		}
	}

	function uncoverCol(header) {
		var row = header.prevInCol;
		while(row != header) {
			var col = row.prevInRow;
			while(col != row) {
				col.nextInCol.prevInCol = col;
				col.prevInCol.nextInCol = col;

				col.header.count = col.header.count + 1;

				col = col.prevInRow;
			}
			row = row.prevInCol;
		}

		header.prevInRow.nextInRow = header;
		header.nextInRow.prevInRow = header;
	}
})(window)