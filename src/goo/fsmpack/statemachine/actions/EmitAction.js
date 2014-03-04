define([
	'goo/fsmpack/statemachine/actions/Action',
	'goo/entities/SystemBus'
],
/** @lends */
function(
	Action,
	SystemBus
) {
	"use strict";

	function EmitAction(/*id, settings*/) {
		Action.apply(this, arguments);
	}

	EmitAction.prototype = Object.create(Action.prototype);
	EmitAction.prototype.constructor = EmitAction;

	EmitAction.external = {
		key: 'Emit message',
		name: 'Emit Message',
		type: 'transitions',
		description: 'Emits a message on the bus',
		parameters: [{
			name: 'Channel',
			key: 'channel',
			type: 'string',
			description: 'Channel to transmit on',
			'default': ''
		}],
		transitions: []
	};

	EmitAction.prototype._run = function (/*fsm*/) {
		SystemBus.emit(this.channel, this.data);
	};

	return EmitAction;
});