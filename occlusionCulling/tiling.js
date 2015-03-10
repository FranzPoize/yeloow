'use strict';

(function(window) {
	var material = new THREE.MeshBasicMaterial({color:0x00ffff,wireframe:true});
	var tileSize = 4;

	function findContainedBlock(x,y,z,volumeMap) {
		var blocks = [];

		for (var xIndex = x - (tileSize/2 - 0.5); xIndex <= x + (tileSize / 2 - 0.5); xIndex++) {
			for (var yIndex = y - (tileSize / 2 - 0.5); yIndex <= y + (tileSize / 2 - 0.5); yIndex++) {
				for (var zIndex = z - (tileSize / 2 - 0.5); zIndex <= z + (tileSize / 2 - 0.5); zIndex++) {
					var block = volumeMap[xIndex + ',' + yIndex + ',' + zIndex];
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
		this.tileVolumeMap = {};

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
					this.tileVolumeMap[tile.x + ',' + tile.y + ',' + tile.z] = tile;

				}
			}
		}
	}

	window.OcclusionTileMap.prototype.findContainingTile = function(x, y, z) {
		return this.tileVolumeMap[Math.floor((x - this.minX ) / tileSize )+','+Math.floor((y - this.minY ) / tileSize )+','+ Math.floor((z - this.minZ ) / tileSize)];
	}

	window.OcclusionTileMap.prototype.occludedEverythingButMyTile = function(x, y, z) {
		var myTile = this.findContainingTile(x, y, z);
		if(myTile) {
			for (var i = 0; i < this.tiles.length; i++) {
				var aTile = this.tiles[i];

				if (aTile.visible && (aTile.x != myTile.x || aTile.y != myTile.y || aTile.z != myTile.z )) {
					for (var j = 0; j < aTile.cells.length; j++) {
						aTile.cells[j].cube.visible = false;
					}
					aTile.visible = false;
				} else if (!aTile.visible && (aTile.x == myTile.x && aTile.y == myTile.y && aTile.z == myTile.z)) {
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

		this.visualBlock = new RebornBlock(x * tileSize + minX + tileSize / 2,
			y * tileSize + minY + tileSize / 2,
			z * tileSize + minZ + tileSize / 2,
			material , tileSize, false);
		this.visible = true;
	}

	window.OcclusionTile.prototype.constructCells = function (volumeMap, minX, minY, minZ) {
		this.cells = [];
		var color = new THREE.Color(Math.random(),Math.random(),Math.random());
		var cellMaterial = new THREE.MeshBasicMaterial({color:color,opacity:0.1,transparent:true});
		for (var xIndex = this.x * tileSize + minX + 0.5;
			xIndex <= this.x * tileSize + minX + tileSize - 0.5;
			xIndex++) {
			for (var yIndex = this.y * tileSize + minY + 0.5;
				yIndex <= this.y * tileSize + minY + tileSize - 0.5;
				yIndex++) {
				for (var zIndex = this.z * tileSize + minZ + 0.5;
					zIndex <= this.z * tileSize + minZ + tileSize - 0.5;
					zIndex++) {
					if(!volumeMap[xIndex + ',' + yIndex + ',' + zIndex]) {
						var block = new RebornBlock(xIndex,yIndex,zIndex,
							cellMaterial,1,false);
						block.cube.visible = false;
						this.cells.push(block);
					}
				}
			}
		}
	}
})(window)