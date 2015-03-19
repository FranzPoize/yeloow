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

	window.constructSetList = function(boundaryVoxel,tileSize) {
		var setList = [];
		//starting simple we just add every square that is not filled to the set list
		for (var i = 0;i < tileSize;i++) {
			for (var j = 0; j < tileSize; j++) {
				expandSet(boundaryVoxel, tileSize, i, j, setList);
			}
		}

		return setList;
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
})(window)