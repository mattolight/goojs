define([
	'goo/math/Transform',
	'goo/math/Vector3',
	'goo/entities/components/Component',
	'goo/entities/EntitySelection',
	'goo/math/Matrix4x4'
],
/** @lends */
function (
	Transform,
	Vector3,
	Component,
	EntitySelection,
	Matrix4x4
) {
	'use strict';

	/**
	 * @class Holds the transform of an entity. It also allows for a scene graph to be created,
	 * in which transforms are inherited down the tree.<br>
	 * {@linkplain http://code.gooengine.com/latest/visual-test/goo/entities/components/TransformComponent/TransformComponent-vtest.html Working example}
	 * @extends Component
	 */
	function TransformComponent() {
		this.type = 'TransformComponent';

		this.entity = null;
		/** Parent TransformComponent in the "scene graph".
		 * @type {TransformComponent}
		 * @default
		 */
		this.parent = null;
		/**
		 * Child TransformComponents in the "scene graph".
		 * @type {TransformComponent[]}
		 */
		this.children = [];

		/**
		 * The entity's transform in local space.
		 * @type {Transform}
		 */
		this.transform = new Transform();

		/** The entity's transform in world space.
		 * Read only. Automatically updated.
		 * @type {Transform}
		 */
		this.worldTransform = new Transform();

		this._dirty = true;
		this._updated = false;
	}

	TransformComponent.type = 'TransformComponent';

	TransformComponent.prototype = Object.create(Component.prototype);
	TransformComponent.prototype.constructor = TransformComponent;

	TransformComponent.prototype.api = {
		setTranslation: function () {
			TransformComponent.prototype.setTranslation.apply(this.transformComponent, arguments);
			return this;
		},
		setRotation: function () {
			TransformComponent.prototype.setRotation.apply(this.transformComponent, arguments);
			return this;
		},
		setScale: function () {
			TransformComponent.prototype.setScale.apply(this.transformComponent, arguments);
			return this;
		},
		lookAt: function () {
			TransformComponent.prototype.lookAt.apply(this.transformComponent, arguments);
			return this;
		},
		move: function () {
			TransformComponent.prototype.move.apply(this.transformComponent, arguments);
			return this;
		},

		getTranslation: function () {
			return TransformComponent.prototype.getTranslation.apply(this.transformComponent, arguments);
		},
		getRotation: function () {
			return TransformComponent.prototype.getRotation.apply(this.transformComponent, arguments);
		},
		getScale: function () {
			return TransformComponent.prototype.getScale.apply(this.transformComponent, arguments);
		},

		addTranslation: function () {
			TransformComponent.prototype.addTranslation.apply(this.transformComponent, arguments);
			return this;
		},
		addRotation: function () {
			TransformComponent.prototype.addRotation.apply(this.transformComponent, arguments);
			return this;
		},
		// no, there's no addScale


		// attachChild: Entity | Selection, boolean -> this
		attachChild: function (entity) {
			this.transformComponent.attachChild(entity.transformComponent);
			return this;
		},
		// detachChild: Entity | Selection, boolean -> this
		detachChild: function (entity) {
			this.transformComponent.detachChild(entity.transformComponent);
			return this;
		},

		children: function () {
			return new EntitySelection(this).children();
		},
		parent: function () {
			return new EntitySelection(this).parent();
		},

		traverse: function (callback, level) {
			level = level !== undefined ? level : 0;

			if (callback(this, level) !== false) {
				for (var i = 0; i < this.transformComponent.children.length; i++) {
					var childEntity = this.transformComponent.children[i].entity;
					childEntity.traverse(callback, level + 1);
				}
			}

			return this;
		},
		traverseUp: function (callback) {
			var transformComponent = this.transformComponent;
			while (callback(transformComponent.entity) !== false && transformComponent.parent) {
				transformComponent = transformComponent.parent;
			}

			return this;
		},

		hide: function () {
			this._hidden = true;

			// hide everything underneath this
			this.traverse(function (entity) {
				// will have to refactor this loop in some function; it's used in other places too
				for (var i = 0; i < entity._components.length; i++) {
					var component = entity._components[i];
					if (typeof component.hidden === 'boolean') {
						component.hidden = true;
					}
				}
			});

			return this;
		},

		// will not show the entity (and it's children) if any of its ancestors are hidden
		show: function () {
			this._hidden = false;

			// first search if it has hidden parents to determine if itself should be visible
			var pointer = this;
			while (pointer.transformComponent.parent) {
				pointer = pointer.transformComponent.parent.entity;
				if (pointer._hidden) {
					// extra check and set might be needed
					for (var i = 0; i < this._components.length; i++) {
						var component = this._components[i];
						if (typeof component.hidden === 'boolean') {
							component.hidden = true;
						}
					}
					return this;
				}
			}

			this.traverse(function (entity) {
				if (entity._hidden) { return false; }
				for (var i = 0; i < entity._components.length; i++) {
					var component = entity._components[i];
					if (typeof component.hidden === 'boolean') {
						component.hidden = entity._hidden;
					}
				}
			});

			return this;
		},

		// entity.show().isHidden() will return false if any ancestor of entity is hidden
		isVisiblyHidden: function () {
			var pointer = this;

			if (pointer._hidden) {
				return true;
			}

			while (pointer.transformComponent.parent) {
				pointer = pointer.transformComponent.parent.entity;
				if (pointer._hidden) {
					return true;
				}
			}

			return false;
		},

		// entity.isHidden returns the hidden status of the entity and may not reflect what is visible
		// an entity can have a hidden status of 'visible', but visually it may be hidden due to one of its ancestors being hidden
		isHidden: function () {
			return this._hidden;
		}
	};

	var tmpVec = new Vector3();

	/**
	 * Gets the value of transformComponent.transform.translation.
	 * To change the translation, the returned object can be modified
	 * after which transformComponent.setUpdated() must be called.
	 * Alternatively, use setTranslation or addTranslation which call
	 * setUpdated() automatically.
	 * <br /><i>Injected into entity when adding component.</i>
	 * @example
	 * var boxTranslation1 = boxEntity.transformComponent.getTranslation();
	 * var boxTranslation2 = boxEntity.getTranslation();
	 * console.log(boxTranslation1 === boxTranslation2); // true
	 *
	 * @return {Vector3} translation
	 */
	TransformComponent.prototype.getTranslation = function () {
		return this.transform.translation;
	};

	/**
	 * Sets this transform's translation.
	 * <br /><i>Injected into entity when adding component.</i>
	 * @example
	 * // The lines below are equivalent.
	 * sphereEntity.transformComponent.setTranslation(1, 1, 0);
	 * sphereEntity.setTranslation(1, 1, 0);
	 * sphereEntity.setTranslation(new Vector3(1, 1, 0));
	 *
	 * @param {Vector | number[] | number...} Component values.
	 * @return {TransformComponent} Self for chaining.
	 */
	TransformComponent.prototype.setTranslation = function () {
		this.transform.translation.set(arguments);
		this._dirty = true;
		return this;
	};

	/**
	 * Gets the value of transformComponent.transform.scale.
	 * To change the scale, the returned object can be modified
	 * after which transformComponent.setUpdated() must be called.
	 * Alternatively, use setScale which calls setUpdated() automatically.
	 * <br /><i>Injected into entity when adding component.</i>
	 * @example
	 * var scale1 = entity.transformComponent.getScale();
	 * var scale2 = entity.getScale();
	 * console.log(scale1 === scale2); // true
	 *
	 * @return {Vector3} scale
	 */
	TransformComponent.prototype.getScale = function () {
		return this.transform.scale;
	};

	/**
	 * Sets this transform's scale.
	 * <br /><i>Injected into entity when adding component.</i>
	 *
	 * @param {Vector | number[] | number...} Component values.
	 * @return {TransformComponent} Self for chaining.
	 */
	TransformComponent.prototype.setScale = function () {
		this.transform.scale.set(arguments);
		this._dirty = true;
		return this;
	};

	/**
	 * Adds to this transform's translation.
	 * <br /><i>Injected into entity when adding component.</i>
	 * @example
	 * // Lines below are equivalent
	 * boxEntity.addTranslation(new Vector(1, 2, 1));
	 * boxEntity.transformComponent.addTranslation(1, 2, 1);
	 *
     * @param {Vector | number[] | number...} Component values.
	 * @return {TransformComponent} Self for chaining.
	 */
	TransformComponent.prototype.addTranslation = function () {
		if (arguments.length === 3) {
			this.transform.translation.add(arguments);
		} else {
			this.transform.translation.add(arguments[0]);
		}
		this._dirty = true;
		return this;
	};

	/**
	 * Gets the value of transformComponent.transform.rotation in Euler angles (in radians).
	 * Returns a new Vector3 that cannot be used for modifying the rotation.
	 * <br /><i>Injected into entity when adding component.</i>.
	 * @example
	 * var rot1 = sphereEntity.getRotation();
	 * var rot2 = sphereEntity.transformComponent.getRotation();
	 * console.log(rot1 === rot2); // true
	 *
	 * @param {Vector3} [target] Target vector for storage.
	 * @return {Vector3} rotation
	 */
	TransformComponent.prototype.getRotation = function (target) {
		target = target || new Vector3();
		return this.transform.rotation.toAngles(target);
	};

	/**
	 * Adds to this transform's rotation using Euler angles (in radians).
	 * <br /><i>Injected into entity when adding component.</i>
	 * @example
	 * boxEntity.setRotation(Math.PI/4.0, 0, 0);
	 * console.log(boxEntity.getRotation().toString()); // [0.79, 0, 0]
	 * boxEntity.addRotation(new Vector3(MathUtils.DEG_TO_RAD*45.0, 0, 0));
	 * console.log(boxEntity.getRotation().toString()); // [1.57, 0, 0]
	 *
	 * @param {Vector | number[] | number...} Component values.
	 * @return {TransformComponent} Self for chaining.
	 */
	TransformComponent.prototype.addRotation = function () {
		this.getRotation(tmpVec);
		if (arguments.length === 1 && typeof (arguments[0]) === 'object') {
			var arg0 = arguments[0];
			if (arg0 instanceof Vector3) {
				this.transform.rotation.fromAngles(tmpVec.x + arg0.x, tmpVec.y + arg0.y, tmpVec.z + arg0.z);
			} else if (arg0.length === 3) {
				this.transform.rotation.fromAngles(tmpVec.x + arg0[0], tmpVec.y + arg0[1], tmpVec.z + arg0[2]);
			}
		} else {
			this.transform.rotation.fromAngles(tmpVec.x + arguments[0], tmpVec.y + arguments[1], tmpVec.z + arguments[2]);
		}

		this._dirty = true;
		return this;
	};

	/**
	 * Sets this transform's rotation around X, Y and Z axis (Euler angles, in radians).
	 * The rotation is applied in X, Y, Z order.
	 * <br /><i>Injected into entity when adding component.</i>
	 * @example
	 * boxEntity.setRotation(Math.PI, 0, 0);
	 * console.log(boxEntity.getRotation().toString()); // [3.14, 0, 0]
	 *
	 * @param {Vector | number[] | number...} Component values.
	 * @return {TransformComponent} Self for chaining.
	 */
	TransformComponent.prototype.setRotation = function () {
		if (arguments.length === 1 && typeof (arguments[0]) === 'object') {
			var arg0 = arguments[0];
			if (arg0 instanceof Vector3) {
				this.transform.rotation.fromAngles(arg0.x, arg0.y, arg0.z);
			} else if (arg0.length === 3) {
				this.transform.rotation.fromAngles(arg0[0], arg0[1], arg0[2]);
			}
		} else {
			this.transform.rotation.fromAngles(arguments[0], arguments[1], arguments[2]);
		}

		this._dirty = true;
		return this;
	};

	/**
	 * Sets the transform to look in a specific direction.
	 * <br /><i>Injected into entity when adding component.</i>
	 *
	 * @param {Vector3} position Target position.
	 * @param {Vector3} [up=(0, 1, 0)] Up vector.
	 * @return {TransformComponent} Self for chaining.
	 */
	TransformComponent.prototype.lookAt = function (position, up) {
		//! AT: needs updating of transform before the actual lookAt to account for changes in translation
		if (arguments.length === 3) {
			this.transform.lookAt(new Vector3(arguments[0], arguments[1], arguments[2]));
		} else {
			if (Array.isArray(position)) {
				position = new Vector3(position);
			}
			if (Array.isArray(up)) {
				up = new Vector3(up);
			}
			this.transform.lookAt(position, up);
		}

		this._dirty = true;
		return this;
	};

	/**
	 * Adds to the translation in a local direction.<br/>
	 * This is similar to addTranslation but this function takes the argument in local coordinate space and converts it for you.<br/>
	 * So for example move(0,0,-1) moves forward (because of the right handed coordinate system).<br/>
	 * <i>Injected into entity when adding component.</i>
	 *
	 * @param {Vector | number[] | number...} component values.
	 * @return {TransformComponent} Self for chaining.
	 */
	TransformComponent.prototype.move = (function(){
		var moveLocalDirection = new Vector3();
		var moveWorldDirection = new Vector3();
		return function () {
			moveLocalDirection.set.apply(moveLocalDirection, arguments);
			this.transform.applyForwardVector(moveLocalDirection, moveWorldDirection);
			this.addTranslation(moveWorldDirection);
			return this;
		};
	})();

	/**
	 * Mark the component for updates of world transform. Needs to be called after manually changing the transform without using helper functions.
	 */
	TransformComponent.prototype.setUpdated = function () {
		this._dirty = true;
	};

	/**
	 * Handles attaching itself to an entity. Should only be called by the engine.
	 * @private
	 * @param entity
	 */
	TransformComponent.prototype.attached = function (entity) {
		this.entity = entity;
	};

	/**
	 * Handles detaching itself to an entity. Should only be called by the engine.
	 * @private
	 * @param entity
	 */
	TransformComponent.prototype.detached = function (/*entity*/) {
		this.entity = undefined; //! AT: used to be 'undefined' when it was handled in Entity; should instead be null
	};

	/**
	 * Attach a child transform to this component tree
	 * <br /><i>Injected into entity when adding component.</i>
	 *
	 * @param {TransformComponent} childComponent Child transform component to attach
	 * @param {boolean} [keepTransform=false] If enabled, the child's position, rotation and scale will appear unaffected
	 */
	TransformComponent.prototype.attachChild = function (childComponent, keepTransform) {
		var component = this;
		while (component) {
			if (component === childComponent) {
				console.warn('attachChild: An object can\'t be added as a descendant of itself.');
				return;
			}
			component = component.parent;
		}
		if (childComponent.parent) {
			childComponent.parent.detachChild(childComponent);
		}

		if (keepTransform) {
			childComponent.updateTransform();
			this.updateTransform();
			this.updateWorldTransform();
			childComponent.transform.multiply(this.worldTransform.invert(), childComponent.transform);
		}

		childComponent.parent = this;
		this.children.push(childComponent);
	};

	/**
	 * Detach a child transform from this component tree.
	 * <br /><i>Injected into entity when adding component.</i>
	 *
	 * @param {TransformComponent} childComponent child transform component to detach
	 * @param {boolean} [keepTransform=false] If enabled, the child's position, rotation and scale will appear unaffected
	 */
	TransformComponent.prototype.detachChild = function (childComponent, keepTransform) {
		if (childComponent === this) {
			console.warn('attachChild: An object can\'t be removed from itself.');
			return;
		}

		if (keepTransform) {
			childComponent.transform.copy(childComponent.worldTransform);
		}

		var index = this.children.indexOf(childComponent);
		if (index !== -1) {
			childComponent.parent = null;
			this.children.splice(index, 1);
		}
	};

	/**
	 * Update component's transform.
	 */
	TransformComponent.prototype.updateTransform = function () {
		this.transform.update();
	};

	/**
	 * Update component's world transform (resulting transform considering parent transformations).
	 */
	TransformComponent.prototype.updateWorldTransform = function () {
		if (this.parent) {
			this.worldTransform.multiply(this.parent.worldTransform, this.transform);
		} else {
			this.worldTransform.copy(this.transform);
		}

		// update the normal matrix
		var scale = this.worldTransform.scale;
		if (scale.x !== scale.y || scale.x !== scale.z) {
			Matrix4x4.invert(this.worldTransform.matrix, this.worldTransform.normalMatrix);
			Matrix4x4.transpose(this.worldTransform.normalMatrix, this.worldTransform.normalMatrix);
		} else {
			this.worldTransform.normalMatrix.copy(this.worldTransform.matrix);
		}

		this._dirty = false;
		this._updated = true;
	};

	TransformComponent.applyOnEntity = function (obj, entity) {
		var transformComponent = entity.transformComponent;

		if (!transformComponent) {
			transformComponent = new TransformComponent();
		}

		var matched = false;
		if (Array.isArray(obj) && obj.length === 3) {
			transformComponent.transform.translation.setd(obj[0], obj[1], obj[2]);
			matched = true;
		} else if (obj instanceof Vector3) {
			transformComponent.transform.translation.setd(obj.data[0], obj.data[1], obj.data[2]);
			matched = true;
		} else if (typeof obj === 'object' &&
			typeof obj.x !== 'undefined' && typeof obj.y !== 'undefined' && typeof obj.z !== 'undefined') {
			transformComponent.transform.translation.setd(obj.x, obj.y, obj.z);
			matched = true;
		} else if (obj instanceof Transform) {
			transformComponent.transform = obj;
			matched = true;
		}

		if (matched) {
			entity.setComponent(transformComponent);
			return true;
		}
	};

	return TransformComponent;
});