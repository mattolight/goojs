require([
	'goo/math/Vector3',
	'goo/math/Quaternion',
	'goo/renderer/light/PointLight',
	'goo/renderer/light/DirectionalLight',
	'goo/renderer/light/SpotLight',
	'goo/debugpack/systems/DebugRenderSystem',
	'goo/renderer/TextureCreator',
	'goo/entities/components/ScriptComponent',
	'lib/V'
], function (
	Vector3,
	Quaternion,
	PointLight,
	DirectionalLight,
	SpotLight,
	DebugRenderSystem,
	TextureCreator,
	ScriptComponent,
	V
	) {
	'use strict';

	var actualAngle = 0;

	V.describe('All supported light types are featured in this scene');

	function addPointLight() {
		var pointLight = new PointLight(new Vector3(0.9, 0.0, 0.2));
		pointLight.range = 5;

		goo.world.createEntity('pointLight', pointLight, [0, 0, 3]).addToWorld();


		var pointlightGui = gui.addFolder('Point Light');
		var data = {
			color: [pointLight.color.data[0] * 255, pointLight.color.data[1] * 255, pointLight.color.data[2] * 255]
		};
		var controller = pointlightGui.addColor(data, 'color');
		controller.onChange(function() {
			pointLight.color.seta(data.color).div(255);
			pointLight.changedColor = true;
		});
		var controller = pointlightGui.add(pointLight, 'intensity', 0, 1);
		controller.onChange(function() {
			pointLight.changedProperties = true;
		});
		var controller = pointlightGui.add(pointLight, 'range', 0, 10);
		controller.onChange(function() {
			pointLight.changedProperties = true;
		});

		pointlightGui.open();
	}

	function addDirectionalLight() {
		var directionalLight = new DirectionalLight(new Vector3(0.2, 0.9, 0.0));
		directionalLight.intensity = 0.05;

		goo.world.createEntity('directionalLight', directionalLight, [0, -5, 3]).addToWorld();


		var directionallightGui = gui.addFolder('Directional Light');
		var data = {
			color: [directionalLight.color.data[0] * 255, directionalLight.color.data[1] * 255, directionalLight.color.data[2] * 255]
		};
		var controller = directionallightGui.addColor(data, 'color');
		controller.onChange(function() {
			directionalLight.color.seta(data.color).div(255);
			directionalLight.changedColor = true;
		});
		var controller = directionallightGui.add(directionalLight, 'intensity', 0, 1);
		controller.onChange(function() {
			directionalLight.changedProperties = true;
		});

		directionallightGui.open();
	}

	var targetPos = new Vector3();
	var rotQuat = new Quaternion();
	function addSpotLight() {
		var spotLight = new SpotLight(new Vector3(1, 1, 1));
		spotLight.angle = 45;
		spotLight.range = 100;
		spotLight.penumbra = 5;
		var tc = new TextureCreator();
		var yRot = -Math.PI * 0.1;
		var xRot = yRot;

		targetPos.setDirect(0, 0.2, 1);
		targetPos.normalize();

		
		tc.loadTexture2D('../../../resources/goo.png').then(function (texture) {
			spotLight.lightCookie = texture;
		});

		var spotEntity = goo.world.createEntity('spotLight', spotLight, [0, 0, 7]);
		
		spotEntity.set(new ScriptComponent({
			run: function(entity, tpf) {
				var rot = Math.PI * 0.2 * tpf;
				actualAngle += rot;
				var ypan = Math.sin(entity._world.time) * 0.3;
				var xpan = Math.cos(entity._world.time) * 0.1;
				targetPos.setDirect(0.25, 0.25, 1);
				targetPos.normalize();
				rotQuat.fromAngleNormalAxis(actualAngle, targetPos);

				var rotMat = spotEntity.transformComponent.transform.rotation;
				rotQuat.toRotationMatrix(rotMat);
				spotEntity.transformComponent._dirty = true;
			}
		}));

		spotEntity.addToWorld();

		var spotLightGui = gui.addFolder('Spot Light');
		var data = {
			color: [spotLight.color.data[0] * 255, spotLight.color.data[1] * 255, spotLight.color.data[2] * 255]
		};
		var controller = spotLightGui.addColor(data, 'color');
		controller.onChange(function() {
			spotLight.color.seta(data.color).div(255);
			spotLight.changedColor = true;
		});
		var controller = spotLightGui.add(spotLight, 'angle', 0, 90);
		controller.onChange(function() {
			spotLight.changedProperties = true;
		});
		var controller = spotLightGui.add(spotLight, 'penumbra', 0, 90);
		controller.onChange(function() {
			spotLight.changedProperties = true;
		});
		var controller = spotLightGui.add(spotLight, 'intensity', 0, 1);
		controller.onChange(function() {
			spotLight.changedProperties = true;
		});
		var controller = spotLightGui.add(spotLight, 'range', 0, 10);
		controller.onChange(function() {
			spotLight.changedProperties = true;
		});

		spotLightGui.open();
	}

	var gui = new window.dat.GUI();
	var goo = V.initGoo();
	var world = goo.world;

	var debugRenderSystem = new DebugRenderSystem();
	debugRenderSystem.doRender.CameraComponent = true;
	debugRenderSystem.doRender.LightComponent = true;
	goo.renderSystems.push(debugRenderSystem);
	world.setSystem(debugRenderSystem);

	// add some spheres to cast the light on
	V.addSpheres();

	//addPointLight();
	//addDirectionalLight();
	addSpotLight();

	// camera
	V.addOrbitCamera([20, Math.PI/2, 0]);

	V.process();
});