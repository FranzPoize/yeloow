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

					for (var j = 0; j < aTile.cells.length; j++) {
						aTile.cells[j].cube.visible = false;
					}

					aTile.visible = false;

				} else if (!aTile.visible &&
					(aTile.x == myTile.x &&
					aTile.y == myTile.y &&
					aTile.z == myTile.z)) {

					for (var j = 0; j < aTile.cells.length; j++) {
						aTile.cells[j].cube.visible = true;
					}

					aTile.visible = true;

				}
			}
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
		}

		this.visualBlock = new BA.RebornBlock(x * tileSize + minX + tileSize / 2,
			y * tileSize + minY + tileSize / 2,
			z * tileSize + minZ + tileSize / 2,
			material , tileSize, false);
		this.visible = true;
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
						inCellMap = !!this.cells[i].volumeMap.get(xIndex, yIndex, zIndex);
					}

					if (!volumeMap.get(xIndex, yIndex, zIndex) &&
						!inCellMap) {

						var newCell = new OcclusionCell();
						this.cells.push(newCell);
						expandCell(newCell,volumeMap,xIndex,yIndex,zIndex,
							this.x * tileSize + minX - 0.5,
							this.y * tileSize + minY - 0.5,
							this.z * tileSize + minZ - 0.5);
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
			minXVoxel: [],
			maxXVoxel: [],
			minYVoxel: [],
			maxYVoxel: [],
			minZVoxel: [],
			maxZVoxel: [],
		}

		var colors = [
			new THREE.MeshBasicMaterial({color:'#ff0000',opacity:0.1,transparent:true}),
			new THREE.MeshBasicMaterial({color:'#00ff00',opacity:0.1,transparent:true}),
			new THREE.MeshBasicMaterial({color:'#0000ff',opacity:0.1,transparent:true}),
			new THREE.MeshBasicMaterial({color:'#ffff00',opacity:0.1,transparent:true}),
			new THREE.MeshBasicMaterial({color:'#ff00ff',opacity:0.1,transparent:true}),
			new THREE.MeshBasicMaterial({color:'#00ffff',opacity:0.1,transparent:true})
			];
		for (var coord in volumeMap.map) {
			var splitCoord = coord.split(','),
				x = splitCoord[0],
				y = splitCoord[1],
				z = splitCoord[2];

				if (x == minX) {
					boundaryVoxel.minXVoxel.push(
						new BA.RebornBlock(x,y,z,colors[0],1,false)
						);
				}

				if (x == minX + tileSize) {
					boundaryVoxel.maxXVoxel.push(
						new BA.RebornBlock(x,y,z,colors[1],1,false)
						);
				}

				if (y == minY) {
					boundaryVoxel.minYVoxel.push(
						new BA.RebornBlock(x,y,z,colors[2],1,false)
						);
				}

				if (y == minY + tileSize) {
					boundaryVoxel.maxYVoxel.push(
						new BA.RebornBlock(x,y,z,colors[3],1,false)
						);
				}

				if (z == minZ) {
					boundaryVoxel.minZVoxel.push(
						new BA.RebornBlock(x,y,z,colors[4],1,false)
						);
				}

				if (z == minZ + tileSize) {
					boundaryVoxel.maxZVoxel.push(
						new BA.RebornBlock(x,y,z,colors[5],1,false)
						);
				}
		}
		return boundaryVoxel
	}
})(window)