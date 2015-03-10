(function(window) {

	function readBlockV5and6( array ) {
		var block = {}
		block.x = readInt(array);
		block.y = readInt(array);
		block.z = readInt(array);
		block.info = readInt(array);

		return block;
	}

	function readBlockV4( array ) {
		var block = {}
		block.x = readInt(array);
		block.y = readInt(array);
		block.z = readInt(array);
		block.info = readWord(array) | readChar(array) << 16;

		return block;
	}

	function readTexture( array ) {
		var strLength = readInt(array),
			textName = '';
		for (var i = 0; i < strLength; i++) {
			textName += String.fromCharCode(readChar(array));
		}

		return textName;
	}

	window.BA.Map = function(bytes) {
		var fileTag = String.fromCharCode(readChar(bytes)) +
						String.fromCharCode(readChar(bytes)) +
						String.fromCharCode(readChar(bytes)) +
						String.fromCharCode(readChar(bytes));


		this.version = readInt(bytes);
		var padding = readInt(bytes),
			textureCount = readInt(bytes) - 1,
			idk = readChar(bytes);

		this.textures = {};
		for (var i = 0; i < textureCount; i++) {
			var texName = readTexture(bytes);
			var texture = THREE.ImageUtils.loadTexture(texName + '.png');
			this.textures[texName] = new THREE.MeshLambertMaterial({color: 0xffffff, map:texture});
		}

		var blockCount = readInt(bytes);

		this.volumeMap = new BA.VolumeMap();

		this.blocks = [];
		for (var i = 0; i < blockCount; i++) {
			var block = readBlockV4(bytes);
			var rebornBlck = new BA.RebornBlock(block.x, block.y, block.z,this.textures.panel_02,1);
			this.blocks.push(rebornBlck);
			this.volumeMap.insert(block.x,block.y,block.z,rebornBlck);
		}

		return this;
	}

	window.BA.Map.prototype.isLocationOccupied = function ( position ) {
		return !!this.volumeMap.get(position.x,position.y,position.z);
	}

	window.BA.RebornBlock = function( x, y, z, material, size, isEntity) {
		var geometry = new THREE.BoxGeometry(size,size,size)
		var cube = new THREE.Mesh( geometry, material );
		cube.position.x = x;
		cube.position.y = y;
		cube.position.z = z;
		this.cube = cube;

		return this
	}

})(window);