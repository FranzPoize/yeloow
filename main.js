'use strict';

function readChar( array ) {
	return array[array.readingIndex++];
}

function readWord( array ) {
	return array[array.readingIndex++] | array[array.readingIndex++] << 8;
}

function readInt( array ) {
	return array[array.readingIndex++] | array[array.readingIndex++] << 8 | array[array.readingIndex++] << 16 | array[array.readingIndex++] << 24;
}

function readLong( array ) {
	return array[array.readingIndex++] | array[array.readingIndex++] << 8 | array[array.readingIndex++] << 16 | array[array.readingIndex++] << 24 |
	array[array.readingIndex++] << 32 | array[array.readingIndex++] << 40 | array[array.readingIndex++] << 48 | array[array.readingIndex++] << 56;
}

function readTexture( array ) {
	var strLength = readInt(array),
		textName = '';
	for (var i = 0; i < strLength; i++) {
		textName += String.fromCharCode(readChar(array));
	}

	return textName;
}

function readBlockV4( array ) {
	var block = {}
	block.x = readInt(array);
	block.y = readInt(array);
	block.z = readInt(array);
	block.info = readWord(array) | readChar(array) << 16;

	return block;
}



function readBlockV5and6( array ) {
	var block = {}
	block.x = readInt(array);
	block.y = readInt(array);
	block.z = readInt(array);
	block.info = readInt(array);

	return block;
}
var fileResult = new XMLHttpRequest();
fileResult.open('GET','hangar.rbe',true);
fileResult.responseType = 'arraybuffer';

var	cameraDf = 0,
	cameraDside = 0,
	camera_rightRotation = 0,
	camera_upRotation = 0;
fileResult.onload = function (event) {
	var bytes = new Uint8Array(fileResult.response),
		textureMap = [],
		blocks = [];
	bytes.readingIndex = 0;

	var fileTag = String.fromCharCode(readChar(bytes)) +
					String.fromCharCode(readChar(bytes)) +
					String.fromCharCode(readChar(bytes)) +
					String.fromCharCode(readChar(bytes));


	var version = readInt(bytes),
		padding = readInt(bytes),
		textureCount = readInt(bytes) - 1,
		idk = readChar(bytes);

	for (var i = 0; i < textureCount; i++) {
		textureMap[i] = readTexture(bytes);
	}

	var blockCount = readInt(bytes);

	for (var i = 0; i < blockCount; i++) {
		blocks.push(readBlockV4(bytes));
	}

	var TDContext = {
		selected:[]
	};
	initTDContext(TDContext);

	createBlocks(blocks, TDContext.scene);
	var render = function () {
		TDContext.playerLight.position.set( TDContext.camera.position.x, TDContext.camera.position.y, TDContext.camera.position.z );

		var look = new THREE.Vector3(0,0,-1);
		look.applyQuaternion(TDContext.camera.quaternion).normalize();

		var selectPosition = TDContext.camera.position.clone();
		selectPosition.add(look.clone().multiplyScalar(7));
		selectPosition.x = Math.round(selectPosition.x);
		selectPosition.y = Math.round(selectPosition.y);
		selectPosition.z = Math.round(selectPosition.z);

		if (!TDContext.hightlighted || TDContext.hightlighted.cube.position != selectPosition) {
			if (TDContext.hightlighted) {
				TDContext.hightlighted.remove(TDContext.scene);
			}
			var material = new THREE.MeshBasicMaterial({color:0xffff00,opacity:0.1,transparent:true});
			TDContext.hightlighted = new RebornBlock( selectPosition.x, selectPosition.y, selectPosition.z, material);
			TDContext.hightlighted.addToScene(TDContext.scene);
		}

		var right = new THREE.Vector3();
		right.crossVectors(look,TDContext.camera.up);

		var rightAxisQuaternion = new THREE.Quaternion().setFromAxisAngle(right.normalize(),camera_rightRotation);
		var upAxisQuaternion = new THREE.Quaternion().setFromAxisAngle(TDContext.camera.up.normalize(),camera_upRotation);
		camera_rightRotation = 0;
		camera_upRotation = 0;
		look.applyQuaternion(rightAxisQuaternion).applyQuaternion(upAxisQuaternion);
		TDContext.camera.lookAt(new THREE.Vector3().addVectors(TDContext.camera.position,look));

		TDContext.camera.position.add(right.multiplyScalar(cameraDside));
		TDContext.camera.position.add(look.multiplyScalar(cameraDf));


		requestAnimationFrame( render );

		TDContext.renderer.render(TDContext.scene, TDContext.camera);
	};

	setupEvent(TDContext);

	render();
}
function initTDContext( context ) {

	context.scene = new THREE.Scene();
	context.camera = new THREE.PerspectiveCamera( 60, window.innerWidth/window.innerHeight, 0.1, 1000 );

	context.scene.add( context.camera );

	context.renderer = new THREE.WebGLRenderer();
	context.renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( context.renderer.domElement );

	context.camera.position.z = 30;
	context.camera.position.y = 10;
	context.camera.position.x = -20;

	var cursorGeometry = new THREE.Geometry(),
		material = new THREE.LineBasicMaterial();

	cursorGeometry.vertices.push(
		new THREE.Vector3(-1, -2, 1),
		new THREE.Vector3(0, 0, -7),
		new THREE.Vector3(1, -2, 1)
	)

	context.ThreeDCursor = new THREE.Line( cursorGeometry,material);
	context.camera.add(context.ThreeDCursor);

	 // camera.lookAt(new THREE.Vector3(1,1,1));
	context.playerLight = new THREE.PointLight( 0xffffff, 0.2, 100 );
	context.playerLight.position.set( context.camera.position.x, context.camera.position.y, context.camera.position.z );
	context.scene.add( context.playerLight );

	createSkyLight( context.scene );
}
var mouseDown = false;
var prevX = 0,prevY = 0,
	sensitivity = 600;

function createBlocks( blocks, scene ) {
	var texture = THREE.ImageUtils.loadTexture('panel_02.png');
	for (var i = 0; i < blocks.length; i++) {
		var material = new THREE.MeshLambertMaterial( { color: 0xffffff, map:texture} );
		var block = new RebornBlock(blocks[i].x,blocks[i].y,blocks[i].z,material);
		block.addToScene(scene);
	}
}

var RebornBlock = function( x, y, z, material ) {
	var geometry = new THREE.BoxGeometry(1,1,1)
	var cube = new THREE.Mesh( geometry, material );
	cube.position.x = x;
	cube.position.y = y;
	cube.position.z = z;
	this.cube = cube;

	return this
}

RebornBlock.prototype.addToScene = function ( scene ) {
	scene.add(this.cube);
}

RebornBlock.prototype.remove = function ( scene ) {
	scene.remove(this.cube);
}

function createSkyLight( scene ) {

	var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.4 );
	directionalLight.position.set( 1, 1, 1 );
	scene.add( directionalLight );

	directionalLight = new THREE.DirectionalLight( 0xffffff, 0.4 );
	directionalLight.position.set( -1, -1, -1 );
	scene.add( directionalLight );

}

fileResult.send(null);

//Event handling
function setupEvent(context) {
	document.addEventListener('keydown',onKeyPress.bind(context));
	document.addEventListener('keyup',onKeyUp);
	document.addEventListener('mousemove',onMouseMove);
	document.addEventListener('mousedown',onMouseDown);
	document.addEventListener('mouseup',onMouseUp);
}

function onMouseUp(e) {
	mouseDown = false;
}

function onMouseDown(e) {
	prevX = e.clientX;
	prevY = e.clientY;
	mouseDown = true;
}


function onMouseMove(e) {
	if (mouseDown) {
		camera_rightRotation = - ( ( e.clientY - prevY ) / sensitivity ) % 2*Math.PI;
		camera_upRotation = - ( ( e.clientX - prevX ) / sensitivity ) % 2*Math.PI;

		prevY = e.clientY;
		prevX = e.clientX;
	}
}

function onKeyUp(e) {
	cameraDf = e.keyCode == 90 ? cameraDf - 0.5 : cameraDf;
	cameraDf = e.keyCode == 83 ? cameraDf + 0.5 : cameraDf;
	cameraDside = e.keyCode == 81 ? cameraDside + 0.5 : cameraDside;
	cameraDside = e.keyCode == 68 ? cameraDside - 0.5 : cameraDside;
}
function onKeyPress(e) {
	if (e.keyCode == 32) {
		var hightlighted = this.hightlighted.cube.position;
		var material = new THREE.MeshBasicMaterial({color:0xff0000,wireframe:true});
		var selectedBlock = new RebornBlock(hightlighted.x,hightlighted.y,hightlighted.z,material);
		selectedBlock.addToScene(this.scene);
		this.selected.push(selectedBlock);
	}
	if (e.keyCode == 50) {
		var texture = THREE.ImageUtils.loadTexture('panel_02.png');
		var material = new THREE.MeshLambertMaterial( { color: 0xffffff, map:texture} );
		for (var i = 0; i < this.selected.length; i++) {
			var block = new RebornBlock(this.selected[i].cube.position.x,this.selected[i].cube.position.y,this.selected[i].cube.position.z,material);
			block.addToScene(this.scene);
		}
	}
	cameraDf = e.keyCode == 90 ? cameraDf + 0.5 : cameraDf;
	cameraDf = e.keyCode == 83 ? cameraDf - 0.5 : cameraDf;
	cameraDside = e.keyCode == 81 ? cameraDside - 0.5 : cameraDside;
	cameraDside = e.keyCode == 68 ? cameraDside + 0.5 : cameraDside;

	cameraDf = clamp(cameraDf, -0.5, 0.5);
	cameraDside = clamp(cameraDside, -0.5, 0.5);
}

function clamp(value, lower, upper)
{
    return Math.max(Math.min(value, upper), lower);
}
