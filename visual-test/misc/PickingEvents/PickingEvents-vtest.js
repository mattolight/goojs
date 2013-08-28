require.config({
	paths: {
		"goo": "../../../src/goo"
	}
});

require([
	'goo/entities/GooRunner',
	'goo/entities/World',
	'goo/renderer/Material',
	'goo/renderer/shaders/ShaderLib',
	'goo/renderer/Camera',
	'goo/shapes/ShapeCreator',
	'goo/entities/components/CameraComponent',
	'goo/scripts/OrbitCamControlScript',
	'goo/entities/EntityUtils',
	'goo/entities/components/ScriptComponent',
	'goo/renderer/MeshData',
	'goo/entities/components/MeshRendererComponent',
	'goo/math/Vector3',
	'goo/renderer/light/PointLight',
	'goo/entities/components/LightComponent'
], function (
	GooRunner,
	World,
	Material,
	ShaderLib,
	Camera,
	ShapeCreator,
	CameraComponent,
	OrbitCamControlScript,
	EntityUtils,
	ScriptComponent,
	MeshData,
	MeshRendererComponent,
	Vector3,
	PointLight,
	LightComponent
	) {
	'use strict';

	function addSpheres(goo, nSpheres) {
		var sphereMeshData = ShapeCreator.createSphere(32, 32);

		for(var i = 0; i < nSpheres; i++) {
			for(var j = 0; j < nSpheres; j++) {
				var sphereMaterial = Material.createMaterial(ShaderLib.simpleColored, 'SphereMaterial' + i + '_' + j);
				sphereMaterial.uniforms.color = [i / nSpheres, j / nSpheres, 0.3];
				var sphereEntity = EntityUtils.createTypicalEntity(goo.world, sphereMeshData, sphereMaterial);
				sphereEntity.transformComponent.transform.translation.set(i - nSpheres/2, j - nSpheres/2, 0);
				sphereEntity.addToWorld();
			}
		}
	}

	function addUserCamera(goo) {
		var camera = new Camera(45, 1, 1, 1000);

		var cameraEntity = goo.world.createEntity("UserCameraEntity");
		cameraEntity.transformComponent.transform.translation.set(0, 0, 3);
		cameraEntity.transformComponent.transform.lookAt(new Vector3(0, 0, 0), Vector3.UNIT_Y);

		var cameraComponent = new CameraComponent(camera);
		cameraComponent.isMain = true;
		cameraEntity.setComponent(cameraComponent);

		var scripts = new ScriptComponent();
		scripts.scripts.push(new OrbitCamControlScript({
			domElement : goo.renderer.domElement,
			spherical : new Vector3(25, Math.PI / 4, 0)
		}));
		cameraEntity.setComponent(scripts);

		cameraEntity.addToWorld();

		return camera;
	}

	function addLight(goo) {
		var light = new PointLight();
		var lightEntity = goo.world.createEntity('light');
		lightEntity.setComponent(new LightComponent(light));
		lightEntity.transformComponent.transform.translation.set(100, 100, 100);
		lightEntity.addToWorld();
	}

	/*function swapChannels(colors) {
		var tmp;
		tmp = colors[0]; colors[0] = colors[1];	colors[1] = colors[2]; colors[2] = tmp;
	}*/

	function pickingEventsDemo(goo) {
		// basic setup
		addSpheres(goo, 15);
		addLight(goo);
		addUserCamera(goo);

		// pick events
		/*goo.setEventHandlers({
			onClick: function(clickedEntity, depth) {
				console.log('mouseclick', clickedEntity ? clickedEntity.toString() + ' at depth ' + depth : 'nothing');
				if(clickedEntity) {
					var color = clickedEntity.meshRendererComponent.materials[0].uniforms.color;
					swapChannels(color);
				}
			},
			onChange: function(lastEntity, currentEntity, depth) {
				console.log('mouseleft', lastEntity ? lastEntity.toString() + ' at depth ' + depth : 'nothing');
				console.log('mouseover', currentEntity ? currentEntity.toString() + ' at depth ' + depth : 'nothing');

				if(currentEntity) {
					var color = currentEntity.meshRendererComponent.materials[0].uniforms.color;
					swapChannels(color);
				}
			}
		});*/
		goo.addEventListener('mousemove', function(evt) {
			console.log('mousemove', evt);
		});
		goo.addEventListener('click', function(evt) {
			console.log('click', evt);
		});
		goo.addEventListener('mousedown', function(evt) {
			console.log('mousedown', evt);
		});
		goo.addEventListener('mouseup', function(evt) {
			console.log('mouseup', evt);
		});
	}

	function init() {
		var goo = new GooRunner({
			events: {
				click: true,
				//mousemove: true,
				mousedown: true,
				mouseup: true
			}
		});
		setTimeout(function() {
			goo.enableEvent('mousemove');
		}, 4000);
		setTimeout(function() {
			goo.disableEvent('mousemove');
		}, 8000);
		goo.renderer.domElement.id = 'goo';
		document.body.appendChild(goo.renderer.domElement);

		pickingEventsDemo(goo);
	}

	init();
});
