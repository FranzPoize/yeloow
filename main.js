'use strict';

var fileResult = new XMLHttpRequest();
fileResult.open('GET','dm1.rbe',true);
fileResult.responseType = 'arraybuffer';

var	cameraDf = 0,
	cameraDside = 0,
	camera_rightRotation = 0,
	camera_upRotation = 0;

fileResult.onload = function (event) {
	var bytes = new Uint8Array(fileResult.response);
	bytes.readingIndex = 0;


	var TDContext = {
		selected:[]
	};
	initTDContext(TDContext);

	var prevLook = new THREE.Vector3(0,0,0);

	var map = new BA.Map(bytes);
	for (var i = 0; i< map.blocks.length; i++) {
		TDContext.scene.add(map.blocks[i].cube);
	}

	var occlusion = new OcclusionTileMap(map.blocks,map.volumeMap);

	function makeQuad(a, b, c, d, scene, color) {
		var geometry = new THREE.Geometry();

		geometry.vertices.push( new THREE.Vector3( a.x, a.y, a.z ) );
		geometry.vertices.push( new THREE.Vector3( b.x, b.y, b.z ) );
		geometry.vertices.push( new THREE.Vector3( c.x, c.y, c.z ) );
		geometry.vertices.push( new THREE.Vector3( d.x, d.y, d.z ) );

		geometry.faces.push( new THREE.Face3( 0, 1, 2 ) ); // counter-clockwise winding order
		geometry.faces.push( new THREE.Face3( 0, 2, 3 ) );

		geometry.computeFaceNormals();
		geometry.computeVertexNormals();
		var material = new THREE.MeshBasicMaterial({ color: color, opacity:0.1, transparent: true});
		material.side = THREE.DoubleSide
		material.side = THREE.DoubleSide
		var mesh = new THREE.Mesh( geometry, material );
		scene.add(mesh);
		var materialWire = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, wireframe: true});
		var meshWire = new THREE.Mesh( geometry, materialWire );
		scene.add(meshWire);
	}

	for (var i = 0; i < occlusion.tiles.length; i++) {
		//TDContext.scene.add(occlusion.tiles[i].visualBlock.cube);
		 for(var j = 0; j< occlusion.tiles[i].cells.length; j++) {
			 var cell = occlusion.tiles[i].cells[j];
			 for (var u = 0; u < cell.portals.plusX.result.solution.length; u++) {
				 var portal = cell.portals.plusX.result.solution[u];
				 var baseCoord = {
					 x:occlusion.tiles[i].x,
					 y:occlusion.tiles[i].y,
					 z:occlusion.tiles[i].z
				 }
				 makeQuad({
					 x: occlusion.minX + (baseCoord.x+1)*4,
					 y: occlusion.minY + baseCoord.y*4 + portal.set.minJ,
					 z: occlusion.minZ + baseCoord.z*4 + portal.set.minI
				 },{
					 x: occlusion.minX + (baseCoord.x+1)*4,
					 y: occlusion.minY + baseCoord.y*4 + portal.set.maxJ+1,
					 z: occlusion.minZ + baseCoord.z*4 + portal.set.minI
				 },{
					 x: occlusion.minX + (baseCoord.x+1)*4,
					 y: occlusion.minY + baseCoord.y*4 + portal.set.maxJ+1,
					 z: occlusion.minZ + baseCoord.z*4 + portal.set.maxI+1
				 },{
					 x: occlusion.minX + (baseCoord.x+1)*4,
					 y: occlusion.minY + baseCoord.y*4 + portal.set.minJ,
					 z: occlusion.minZ + baseCoord.z*4 + portal.set.maxI+1
				 },TDContext.scene,0xffff00);
				 }
			 for (var u = 0; u < cell.portals.plusY.result.solution.length; u++) {
				 var portal = cell.portals.plusY.result.solution[u];
				 var baseCoord = {
					 x:occlusion.tiles[i].x,
					 y:occlusion.tiles[i].y,
					 z:occlusion.tiles[i].z
				 }
				 makeQuad({
					 x: occlusion.minX + baseCoord.x*4 + portal.set.minJ,
					 y: occlusion.minY + (baseCoord.y+1)*4,
					 z: occlusion.minZ + baseCoord.z*4 + portal.set.minI
				 },{
					 x: occlusion.minX + baseCoord.x*4 + portal.set.maxJ+1,
					 y: occlusion.minY + (baseCoord.y+1)*4,
					 z: occlusion.minZ + baseCoord.z*4 + portal.set.minI
				 },{
					 x: occlusion.minX + baseCoord.x*4 + portal.set.maxJ+1,
					 y: occlusion.minY + (baseCoord.y+1)*4,
					 z: occlusion.minZ + baseCoord.z*4 + portal.set.maxI+1
				 },{
					 x: occlusion.minX + baseCoord.x*4 + portal.set.minJ,
					 y: occlusion.minY + (baseCoord.y+1)*4,
					 z: occlusion.minZ + baseCoord.z*4 + portal.set.maxI+1
				 },TDContext.scene,0xffff00);
			 }
			 for (var u = 0; u < cell.portals.minusY.result.solution.length; u++) {
				 var portal = cell.portals.minusY.result.solution[u];
				 var baseCoord = {
					 x:occlusion.tiles[i].x,
					 y:occlusion.tiles[i].y,
					 z:occlusion.tiles[i].z
				 }
				 makeQuad({
					 x: occlusion.minX + baseCoord.x*4 + portal.set.minJ,
					 y: occlusion.minY + baseCoord.y*4,
					 z: occlusion.minZ + baseCoord.z*4 + portal.set.minI
				 },{
					 x: occlusion.minX + baseCoord.x*4 + portal.set.maxJ+1,
					 y: occlusion.minY + baseCoord.y*4,
					 z: occlusion.minZ + baseCoord.z*4 + portal.set.minI
				 },{
					 x: occlusion.minX + baseCoord.x*4 + portal.set.maxJ+1,
					 y: occlusion.minY + baseCoord.y*4,
					 z: occlusion.minZ + baseCoord.z*4 + portal.set.maxI+1
				 },{
					 x: occlusion.minX + baseCoord.x*4 + portal.set.minJ,
					 y: occlusion.minY + baseCoord.y*4,
					 z: occlusion.minZ + baseCoord.z*4 + portal.set.maxI+1
				 },TDContext.scene,0xff00ff);
			}
			for (var u = 0; u < cell.portals.minusZ.result.solution.length; u++) {
				 var portal = cell.portals.minusZ.result.solution[u];
				 var baseCoord = {
					 x:occlusion.tiles[i].x,
					 y:occlusion.tiles[i].y,
					 z:occlusion.tiles[i].z
				 }
				 makeQuad({
					 x: occlusion.minX + baseCoord.x*4 + portal.set.minJ,
					 y: occlusion.minY + baseCoord.y*4 + portal.set.minI,
					 z: occlusion.minZ + baseCoord.z*4
				 },{
					 x: occlusion.minX + baseCoord.x*4 + portal.set.maxJ+1,
					 y: occlusion.minY + baseCoord.y*4 + portal.set.minI,
					 z: occlusion.minZ + baseCoord.z*4
				 },{
					 x: occlusion.minX + baseCoord.x*4 + portal.set.maxJ+1,
					 y: occlusion.minY + baseCoord.y*4 + portal.set.maxI+1,
					 z: occlusion.minZ + baseCoord.z*4
				 },{
					 x: occlusion.minX + baseCoord.x*4 + portal.set.minJ,
					 y: occlusion.minY + baseCoord.y*4 + portal.set.maxI+1,
					 z: occlusion.minZ + baseCoord.z*4
				 },TDContext.scene,0x0000ff);
			 }
		// 	for(var k = 0; k<cell.voxels.minXVoxel.length;k++) {
		// 		TDContext.scene.add(cell.voxels.minXVoxel[k].cube);
		// 	}
		// 	for(var k = 0; k<cell.voxels.maxXVoxel.length;k++) {
		// 		TDContext.scene.add(cell.voxels.maxXVoxel[k].cube);
		// 	}
		// 	for(var k = 0; k<cell.voxels.minYVoxel.length;k++) {
		// 		TDContext.scene.add(cell.voxels.minYVoxel[k].cube);
		// 	}
		// 	for(var k = 0; k<cell.voxels.maxYVoxel.length;k++) {
		// 		TDContext.scene.add(cell.voxels.maxYVoxel[k].cube);
		// 	}
		// 	for(var k = 0; k<cell.voxels.minZVoxel.length;k++) {
		// 		TDContext.scene.add(cell.voxels.minZVoxel[k].cube);
		// 	}
		// 	for(var k = 0; k<cell.voxels.maxZVoxel.length;k++) {
		// 		TDContext.scene.add(cell.voxels.maxZVoxel[k].cube);
		// 	}
		 }
	}

	var render = function () {
		//console.log('x:' + TDContext.camera.position.x + ',y:' + TDContext.camera.position.y);
		TDContext.playerLight.position.set( TDContext.camera.position.x, TDContext.camera.position.y, TDContext.camera.position.z );

		var look = new THREE.Vector3(0,0,-1);
		look.applyQuaternion(TDContext.camera.quaternion).normalize();

		var selectPosition = TDContext.camera.position.clone();
		selectPosition.add(look.clone().multiplyScalar(7));
		selectPosition.x = Math.round(selectPosition.x);
		selectPosition.y = Math.round(selectPosition.y);
		selectPosition.z = Math.round(selectPosition.z);

		if (!TDContext.hightlighted || !TDContext.hightlighted.cube.position.equals(selectPosition)) {
			if (TDContext.hightlighted) {
				TDContext.scene.remove(TDContext.hightlighted.cube);
			}
			var material = new THREE.MeshBasicMaterial({color:0xffff00,opacity:0.1,transparent:true});
			TDContext.hightlighted = new BA.RebornBlock( selectPosition.x, selectPosition.y, selectPosition.z, material,1);
			TDContext.scene.add(TDContext.hightlighted.cube);
		}

		var upAxisQuaternion = new THREE.Quaternion().setFromAxisAngle(TDContext.camera.up.normalize(),camera_upRotation);
		var right = new THREE.Vector3();
		right.crossVectors(look,TDContext.camera.up);
		var up = new THREE.Vector3();
		up.crossVectors(right,look);

		var rightAxisQuaternion = new THREE.Quaternion().setFromAxisAngle(right.normalize(),camera_rightRotation);
		camera_rightRotation = 0;
		camera_upRotation = 0;
		look.applyQuaternion(rightAxisQuaternion).applyQuaternion(upAxisQuaternion);
		if (!look.equals(prevLook)) {

			TDContext.camera.lookAt(new THREE.Vector3().addVectors(TDContext.camera.position,look));
			prevLook = look;
		}

		if (cameraDf) {

			TDContext.camera.position.add(look.multiplyScalar(cameraDf));
		}
		if (cameraDside) {

			TDContext.camera.position.add(right.multiplyScalar(cameraDside));
		}

		requestAnimationFrame( render );

		//occlusion.occludedEverythingButMyTile(selectPosition.x,selectPosition.y,selectPosition.z);

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
		var selectedBlock = new BA.RebornBlock(hightlighted.x,hightlighted.y,hightlighted.z,material,1);
		this.scene.add(selectedBlock.cube);
		this.selected.push(selectedBlock);
	}
	if (e.keyCode == 50) {
		var texture = THREE.ImageUtils.loadTexture('panel_02.png');
		var material = new THREE.MeshLambertMaterial( { color: 0xffffff, map:texture} );
		for (var i = 0; i < this.selected.length; i++) {
			if (!isLocationOccupied(this.selected[i].cube.position)) {
				var block = new BA.RebornBlock(this.selected[i].cube.position.x,this.selected[i].cube.position.y,this.selected[i].cube.position.z,material,1,true);
				this.scene.add(block.cube);
			}
		}
	}
	if (e.keyCode == 49) {
		for (var i = 0; i < this.selected.length; i++) {
			if (isLocationOccupied(this.selected[i].cube.position)) {
				var block = volumeMap[this.selected[i].cube.position.x + ',' + this.selected[i].cube.position.y + ',' +this.selected[i].cube.position.z ];
				this.scene.remove(block.cube);
				volumeMap[this.selected[i].cube.position.x + ',' + this.selected[i].cube.position.y + ',' +this.selected[i].cube.position.z ] = undefined;
			}
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
