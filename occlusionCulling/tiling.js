'use strict';

(function(window) {
	var material = new THREE.MeshBasicMaterial({color:0x00ffff,wireframe:true});
	var tileSize = 4;

	function findContainedBlock(x,y,z,volumeMap) {
		var blocks = [];

		for (var xIndex = x - (tileSize/2 - 0.5); xIndex <= x + (tileSize / 2 - 0.5); xIndex++) {
			for (var yIndex = y - (tileSize / 2 - 0.5); yIndex <= y + (tileSize / 2 - 0.5); yIndex++) {
				for (var zIndex = z - (tileSize / 2 - 0.5); zIndex <= z + (tileSize / 2 - 0.5); zIndex++) {
					var block = volumeMap.get(xIndex, yIndex, zIndex);
					if (block)
						blocks.push(block);
				}
			}
		}

		return blocks;
	}

	window.OcclusionTileMap = function ( blocks, volumeMap) {
		this.maxX = -Infinity;
		this.maxY = -Infinity;
		this.maxZ = -Infinity;
		this.minX = Infinity;
		this.minY = Infinity;
		this.minZ = Infinity;
		this.tileVolumeMap = new BA.VolumeMap();

		for (var i = 0; i < blocks.length; i++) {
			this.maxX = Math.max(this.maxX, blocks[i].cube.position.x + 0.5);
			this.maxY = Math.max(this.maxY, blocks[i].cube.position.y + 0.5);
			this.maxZ = Math.max(this.maxZ, blocks[i].cube.position.z + 0.5);
			this.minX = Math.min(this.minX, blocks[i].cube.position.x - 0.5);
			this.minY = Math.min(this.minY, blocks[i].cube.position.y - 0.5);
			this.minZ = Math.min(this.minZ, blocks[i].cube.position.z - 0.5);
		}

		var ySize = ( this.maxY - this.minY ),
			xSize = ( this.maxX - this.minX ),
			zSize = ( this.maxZ - this.minZ ),
			xTileSize = Math.floor((xSize )/ tileSize) + 2,
			yTileSize = Math.floor((ySize )/ tileSize) + 2,
			zTileSize = Math.floor((zSize )/ tileSize) + 2;

		this.tiles = [];
		for (var xIndex = 0; xIndex < xTileSize; xIndex++) {
			for (var yIndex = 0; yIndex < yTileSize; yIndex++) {
				for (var zIndex = 0; zIndex < zTileSize; zIndex++) {
					var x = this.minX + xIndex * tileSize + 2,
						y = this.minY + yIndex * tileSize + 2,
						z = this.minZ + zIndex * tileSize + 2,
						blocksContained = findContainedBlock(x,y,z,volumeMap),
						tile = new OcclusionTile(blocksContained, xIndex, yIndex, zIndex, this.minX, this.minY, this.minZ,volumeMap);
					this.tiles.push(tile);
					this.tileVolumeMap.insert(tile.x, tile.y, tile.z, tile);
				}
			}
		}
	}

	window.OcclusionTileMap.prototype.findContainingTile = function(x, y, z) {
		return this.tileVolumeMap.get(Math.floor((x - this.minX ) / tileSize ), Math.floor((y - this.minY ) / tileSize ), Math.floor((z - this.minZ ) / tileSize));
	}
	window.OcclusionTileMap.prototype.occludedEverythingButMyTile = function(x, y, z) {
		var myTile = this.findContainingTile(x, y, z);
		if (myTile) {
			for (var i = 0; i < this.tiles.length; i++) {
				var aTile = this.tiles[i];

				if (aTile.visible &&
					(aTile.x != myTile.x ||
					aTile.y != myTile.y ||
					aTile.z != myTile.z )) {

					/*for (var j = 0; j < aTile.cells.length; j++) {
						for (var prop in aTile.cells[j].voxels) {
							var voxels = aTile.cells[j].voxels[prop];
							for (var k = 0; k < voxels.length; k++) {
								voxels[k].cube.visible = false;
							}
						}
						}*/

					aTile.visualBlock.cube.visible = false;

				} else if (!aTile.visible &&
					(aTile.x == myTile.x &&
					aTile.y == myTile.y &&
					aTile.z == myTile.z)) {

					/*for (var j = 0; j < aTile.cells.length; j++) {
						for (var prop in aTile.cells[j].voxels) {
							var voxels = aTile.cells[j].voxels[prop];
							for (var k = 0; k < voxels.length; k++) {
								voxels[k].cube.visible = true;
							}
						}
						}*/

					aTile.visualBlock.cube.visible = true;

				}
			}
			myTile.visualBlock.cube.visible = true;
		}
	}

	window.OcclusionTile = function (blocks, x, y, z, minX, minY, minZ,volumeMap) {
		this.blocksContained = blocks;

		this.x = x;
		this.y = y;
		this.z = z;

		this.constructCells(volumeMap,minX,minY,minZ);
		for(var i = 0; i< this.cells.length;i++) {
			this.cells[i].voxels = findBoundaryVoxel(this.cells[i].volumeMap,
				x * tileSize + minX + 0.5,
				y * tileSize + minY + 0.5,
				z * tileSize + minZ + 0.5);
			var boundarySets = {
				minusX: constructSetList(this.cells[i].voxels.minXVoxel,tileSize),
				plusX: constructSetList(this.cells[i].voxels.maxXVoxel,tileSize),
				minusY: constructSetList(this.cells[i].voxels.minYVoxel,tileSize),
				plusY: constructSetList(this.cells[i].voxels.maxYVoxel,tileSize),
				minusZ: constructSetList(this.cells[i].voxels.minZVoxel,tileSize),
				plusZ: constructSetList(this.cells[i].voxels.maxZVoxel,tileSize)
			}

			var portals = convertBoundarySetsToCoords(boundarySets, this, tileSize);
			this.cells[i].portals = portals;
		}

		//this.visualBlock = new BA.RebornBlock(x * tileSize + minX + tileSize / 2,
		//y * tileSize + minY + tileSize / 2,
		//z * tileSize + minZ + tileSize / 2,
		//material , tileSize, false);
		this.visible = true;
	}

	function convertBoundary(set, cb) {
		return cb({
			min: set.set.minI,
			max: set.set.maxI + 1
		}, {
			min: set.set.minJ,
			max: set.set.maxJ + 1
		});
	}

	function convertBoundarySetsToCoords(boundarySets, tile, tileSize) {
		var baseCoord = {
				x:tile.x,
				y:tile.y,
				z:tile.z
			},
			portals = {};

		portals.minusX = boundarySets.minusX.result.solution.map(function(set) {
			return convertBoundary(set, function(variantI, variantJ) {
				return {
					start: {
						x: baseCoord.x * tileSize,
						y: baseCoord.y * tileSize + variantJ.min,
						z: baseCoord.z * tileSize + variantI.min
					},
					end: {
						x: baseCoord.x * tileSize,
						y: baseCoord.y * tileSize + variantJ.max + 1,
						z: baseCoord.z * tileSize + variantI.max + 1,
					}
				}
			});
		});

		portals.plusX = boundarySets.plusX.result.solution.map(function(set) {
			return convertBoundary(set, function(variantI, variantJ) {
				return {
					start: {
						x: (baseCoord.x + 1) * tileSize,
						y: baseCoord.y * tileSize + variantJ.min,
						z: baseCoord.z * tileSize + variantI.min
					},
					end: {
						x: (baseCoord.x + 1) * tileSize,
						y: baseCoord.y * tileSize + variantJ.max + 1,
						z: baseCoord.z * tileSize + variantI.max + 1,
					}
				}
			});
		});

		portals.minusY = boundarySets.minusY.result.solution.map(function(set) {
			return convertBoundary(set, function(variantI, variantJ) {
				return {
					start: {
						x: baseCoord.x * tileSize + variantJ.min,
						y: baseCoord.y * tileSize,
						z: baseCoord.z * tileSize + variantI.min
					},
					end: {
						x: baseCoord.x * tileSize + variantJ.max + 1,
						y: baseCoord.y * tileSize,
						z: baseCoord.z * tileSize + variantI.max + 1,
					}
				}
			});
		});

		portals.plusY = boundarySets.plusY.result.solution.map(function(set) {
			return convertBoundary(set, function(variantI, variantJ) {
				return {
					start: {
						x: baseCoord.x * tileSize + variantJ.min,
						y: (baseCoord.y + 1) * tileSize,
						z: baseCoord.z * tileSize + variantI.min
					},
					end: {
						x: baseCoord.x * tileSize + variantJ.max + 1,
						y: (baseCoord.y + 1) * tileSize,
						z: baseCoord.z * tileSize + variantI.max + 1,
					}
				}
			});
		});

		portals.minusZ = boundarySets.minusZ.result.solution.map(function(set) {
			return convertBoundary(set, function(variantI, variantJ) {
				return {
					start: {
						x: baseCoord.x * tileSize + variantJ.min,
						y: baseCoord.y * tileSize + variantI.min,
						z: baseCoord.z * tileSize
					},
					end: {
						x: baseCoord.x * tileSize + variantJ.max + 1,
						y: baseCoord.y * tileSize + variantI.max + 1,
						z: baseCoord.z * tileSize
					}
				}
			});
		});

		portals.plusY = boundarySets.plusY.result.solution.map(function(set) {
			return convertBoundary(set, function(variantI, variantJ) {
				return {
					start: {
						x: baseCoord.x * tileSize + variantJ.min,
						y: baseCoord.y * tileSize + variantI.min,
						z: (baseCoord.z + 1) * tileSize
					},
					end: {
						x: baseCoord.x * tileSize + variantJ.max + 1,
						y: baseCoord.y * tileSize + variantI.max + 1,
						z: (baseCoord.z + 1) * tileSize
					}
				}
			});
		});

		return portals;
	}

	function expandCell(newCell,volumeMap,x,y,z,minX,minY,minZ,material) {
		
		newCell.volumeMap.insert(x,y,z,true);

		if (x - 1 >= minX && !volumeMap.get(x-1,y,z) && !newCell.volumeMap.get(x-1,y,z))
			expandCell(newCell,volumeMap,x-1,y,z,minX,minY,minZ,material);

		if (x + 1 < minX + tileSize && !volumeMap.get(x+1,y,z) && !newCell.volumeMap.get(x+1,y,z))
			expandCell(newCell,volumeMap,x+1,y,z,minX,minY,minZ,material);
		
		if (y - 1 >= minY && !volumeMap.get(x,y-1,z) && !newCell.volumeMap.get(x,y-1,z))
			expandCell(newCell,volumeMap,x,y-1,z,minX,minY,minZ,material);
		
		if (y + 1 < minY + tileSize && !volumeMap.get(x,y+1,z) && !newCell.volumeMap.get(x,y+1,z))
			expandCell(newCell,volumeMap,x,y+1,z,minX,minY,minZ,material);
		
		if (z - 1 >= minZ && !volumeMap.get(x,y,z-1) && !newCell.volumeMap.get(x,y,z-1))
			expandCell(newCell,volumeMap,x,y,z-1,minX,minY,minZ,material);
		
		if (z + 1 < minZ + tileSize && !volumeMap.get(x,y,z+1) && !newCell.volumeMap.get(x,y,z+1))
			expandCell(newCell,volumeMap,x,y,z+1,minX,minY,minZ,material);
	}

	window.OcclusionTile.prototype.constructCells = function (volumeMap, minX, minY, minZ) {
		this.cells = [];

		for (var xIndex = this.x * tileSize + minX + 0.5;
			xIndex <= this.x * tileSize + minX + tileSize - 0.5;
			xIndex++) {

			for (var yIndex = this.y * tileSize + minY + 0.5;
				yIndex <= this.y * tileSize + minY + tileSize - 0.5;
				yIndex++) {

				for (var zIndex = this.z * tileSize + minZ + 0.5;
					zIndex <= this.z * tileSize + minZ + tileSize - 0.5;
					zIndex++) {
					var inCellMap = false;
					for(var i = 0; i < this.cells.length; i++) {
						if (this.cells[i].volumeMap.get(xIndex, yIndex, zIndex)) {
							inCellMap = true;
						}
					}

					if (!volumeMap.get(xIndex, yIndex, zIndex) &&
						!inCellMap) {

						var newCell = new OcclusionCell();
						this.cells.push(newCell);
						expandCell(newCell,volumeMap,xIndex,yIndex,zIndex,
							this.x * tileSize + minX + 0.5,
							this.y * tileSize + minY + 0.5,
							this.z * tileSize + minZ + 0.5);
					}
				}
			}
		}
	}

	window.OcclusionCell = function () {
		this.portals = [];
		this.volumeMap = new BA.VolumeMap();
	}

	function findBoundaryVoxel( volumeMap, minX, minY, minZ ) {
		var boundaryVoxel = {
			minXVoxel: new Uint8Array(tileSize*tileSize),
			maxXVoxel: new Uint8Array(tileSize*tileSize),
			minYVoxel: new Uint8Array(tileSize*tileSize),
			maxYVoxel: new Uint8Array(tileSize*tileSize),
			minZVoxel: new Uint8Array(tileSize*tileSize),
			maxZVoxel: new Uint8Array(tileSize*tileSize),
		}

		for (var coord in volumeMap.map) {
			var splitCoord = coord.split(','),
				x = parseInt(splitCoord[0]),
				y = parseInt(splitCoord[1]),
				z = parseInt(splitCoord[2]);

				if (x === minX) {
					boundaryVoxel.minXVoxel[(y - minY) + (z - minZ) * tileSize] = 1;
				}

				if (x === minX + tileSize - 1) {
					boundaryVoxel.maxXVoxel[(y - minY) + (z - minZ) * tileSize] = 1;
				}

				if (y === minY) {
					boundaryVoxel.minYVoxel[(x - minX) + (z - minZ) * tileSize] = 1;
				}

				if (y === minY + tileSize - 1) {
					boundaryVoxel.maxYVoxel[(x - minX) + (z - minZ) * tileSize] = 1;
				}

				if (z === minZ) {
					boundaryVoxel.minZVoxel[(x - minX) + (y - minY) * tileSize] = 1;
				}

				if (z === minZ + tileSize - 1) {
					boundaryVoxel.maxZVoxel[(x - minX) + (y - minY) * tileSize] = 1;
				}
		}
		return boundaryVoxel
	}
})(window)
