(function() {

	console.log('initializing');

	var outs = [],
		ins = [],
		sustain = false, // sustain state
		keys = {}; // key state map

	var onMIDIMessage = function(message) {
		var data = message.data;
		console.log('MIDI data', data);

		var type = data[0] & 0xf0; // Channel agnostic type

		if (type === 144) {
			// pass velocity to Volca if event type is note on
			var velocity = data[2];
			document.getElementById('vel').innerText = velocity;
			outs[0].send([0xb0, 41, velocity]);

			// store noteon in key map
			keys[data[1]] = true;
		}

		// register sustain
		if (type === 176) {
			sustain = data[2] ? true : false;

			if (sustain) {
				sustained = [];
				document.getElementById('sus').innerText = 'On';
			}
			else if (sustained.length > 0) {
				// send note off for keys not currently on
				for (var i=0; i<sustained.length; i++) {
					if (!keys[sustained[i]]) {
						outs[0].send([0x80, sustained[i], 127]);
					}
				}
				document.getElementById('sus').innerText = 'Off';
			}
		}

		// ignore noteoff if sustain
		if (type === 128) {
			if (keys[data[1]]) {
				// register noteoff in key map
				keys[data[1]] = false;
			}
			if (sustain) {
				sustained.push(data[1]);
				return;
			}
		}
		
		// midi thru
		outs[0].send(data);
	};

	// Successful connection handler
	var onSuccess = function(interface) {
	 
		// Register inputs and outputs
		inputs = interface.inputs.values();
		for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
			ins.push(input.value);
			input.value.onmidimessage = onMIDIMessage;
		}

		console.log(ins.length + " inputs detected");

		outputs = interface.outputs.values();
		for (var output = outputs.next(); output && !output.done; output = outputs.next()) {
			outs.push(output.value);
		}

		console.log(outs.length + " outputs detected");

		if (ins.length === 0 || outs.length === 0) {
			document.getElementById('error').innerText = 'MIDI interface not found';
		}
		else {
			document.getElementById('app').classList.remove('hidden');
		}
	};
	 
	// Failed connection handler
	var onFailure = function(error) {
		console.log("Could not connect to the MIDI interface");
	};

	// Check if the Web MIDI API is supported by the browser
	if (navigator.requestMIDIAccess) {

		console.log("Web MIDI API supported");

		// Try to connect to the MIDI interface.
		navigator.requestMIDIAccess({
			sysex: false
		}).then(onSuccess, onFailure);

	}
	else {
		console.log("Web MIDI API not supported!");
	}

})();