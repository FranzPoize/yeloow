'use strict';

(function(window) {
	var material = new THREE.MeshBasicMaterial({color:0x00ffff,wireframe:true});

	function findContainedBlock(x,y,z,volumeMap) {
		var blocks = [];

		for (var xIndex = x - 1.5; xIndex <= x + 1.5; xIndex++) {
			for (var yIndex = y - 1.5; yIndex <= y + 1.5; yIndex++) {
				for (var zIndex = z - 1.5; zIndex <= z + 1.5; zIndex++) {
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
			xTileSize = Math.floor((xSize )/ 4) + 1,
			yTileSize = Math.floor((ySize )/ 4) + 1,
			zTileSize = Math.floor((zSize )/ 4) + 1;

		this.tiles = [];
		this.volumeMap = {};
		for (var xIndex = 0; xIndex < xTileSize; xIndex++) {
			for (var yIndex = 0; yIndex < yTileSize; yIndex++) {
				for (var zIndex = 0; zIndex < zTileSize; zIndex++) {
					var x = this.minX + xIndex * 4 + 2,
						y = this.minY + yIndex * 4 + 2,
						z = this.minZ + zIndex * 4 + 2,
						blocksContained = findContainedBlock(x,y,z,volumeMap),
						tile = new OcclusionTile(blocksContained, xIndex, yIndex, zIndex, this.minX, this.minY, this.minZ);
					this.tiles.push(tile);
					this.volumeMap[tile.x + ',' + tile.y + ',' + tile.z] = tile;

				}
			}
		}
	}

	window.OcclusionTileMap.prototype.findContainingTile = function(x, y, z) {
		return this.volumeMap[Math.floor((x - this.minX ) / 4 )+','+Math.floor((y - this.minY ) / 4 )+','+ Math.floor((z - this.minZ ) / 4)];
	}

	window.OcclusionTileMap.prototype.occludedEverythingButMyTile = function(x, y, z) {
		var myTile = this.findContainingTile(x, y, z);
		if(myTile) {
			for (var i = 0; i < this.tiles.length; i++) {
				var aTile = this.tiles[i];

				if (aTile.visible && (aTile.x != myTile.x || aTile.y != myTile.y || aTile.z != myTile.z )) {
					for (var j = 0; j < aTile.blocksContained.length; j++) {
						aTile.blocksContained[j].cube.visible = false;
					}
					aTile.visible = false;
				} else if (!aTile.visible && (aTile.x == myTile.x && aTile.y == myTile.y && aTile.z == myTile.z)) {
					for (var j = 0; j < aTile.blocksContained.length; j++) {
						aTile.blocksContained[j].cube.visible = true;
					}
					aTile.visible = true;
				}
			}
		}
	}

	window.OcclusionTile = function (blocks, x, y, z, minX, minY, minZ) {
		this.blocksContained = blocks;
		this.x = x;
		this.y = y;
		this.z = z;
		this.visualBlock = new RebornBlock(x * 4 + minX + 2, y * 4 + minY + 2, z * 4 + minZ + 2, material , 4, false);
		this.visible = true;
	}
})(window)