/* HOW TO USE:
var myDogBark = gSoundLoad("bark.mp3") // wav also works.

// Let's hear that bark when you click anywhere
window.onclick = function()
{
	// Let's play it out of the right speaker only.
	myDogBark.setPan(1)
	
	// Random volume each time. Is more entertaining.
	myDogBark.setVolume(Math.random())
	
	myDogBark.play()
}
*/

var gSoundLoad = function() {
	var gAudioContext
	window.AudioContext = window.AudioContext || window.webkitAudioContext
	if(AudioContext)
		gAudioContext = new AudioContext()
	
	var gSound = function() {
		this.volume = 1
	}

	var volumeGet = function(sound) {
		return gStorage[sound.musicIs?'musicVolume':'soundVolume']*1
	}
	
	gSound.prototype.play = function(loop) {
		if(!this.audioBuffer)
			return false

		var volume = volumeGet(this)
		if(!volume)return false
		
		var source = gAudioContext.createBufferSource()
		if(!source)
			return false

		source.buffer = this.audioBuffer
		if(!source.start)
			source.start = source.noteOn

		if(!source.start)
			return false
		
		if(loop)
			source.loop = true

		this.gainNode = gAudioContext.createGain()
		if(this.pan) {
			this.gainNode2 = gAudioContext.createGain()
			
			this.setPan(this.pan)
			
			var splitter = gAudioContext.createChannelSplitter(2)
			source.connect(splitter, 0, 0)
			var merger = gAudioContext.createChannelMerger(2)
			
			splitter.connect(this.gainNode, 0)
			splitter.connect(this.gainNode2, 0)
			
			this.gainNode.connect(merger,0,0)
			this.gainNode2.connect(merger,0,1)
			merger.connect(gAudioContext.destination)

			this.gainNode.gain.value *= this.volume * volume
			this.gainNode2.gain.value *= this.volume * volume
		}
		else
		{
			this.gainNode.gain.value = this.volume * volume
			source.connect(this.gainNode)
			this.gainNode.connect(gAudioContext.destination)
		}

		source.start(0)
		
		this.playing = true
		this.playTime = Date.now()

		return true
	}
	
	gSound.prototype.isPlaying = function() {
		return this.playing && Date.now()-this.playTime<this.audioBuffer.duration*1000
	}
	
	gSound.prototype.stop = function() {
		this.playing = 0
		if(this.gainNode)
			this.gainNode.gain.value = 0
	}
	
	// Set volume before or during play. 0=silent, 1=max. Doesn't work on mobile iOS.
	gSound.prototype.setVolume = function(volume) {
		volume *= volumeGet(this)
		this.volume = volume

		if(this.gainNode)
			this.gainNode.gain.value = volume
	}
	
	// pan is -1 to 1. -1=left speaker only. 1=right speaker only.
	// Set pan before playing, or you can change it while playing if it was set to nonzero when you played it.
	gSound.prototype.setPan = function(pan) {
		if(this.gainNode2)
		{
			var pan01 = (pan + 1) / 2
			this.gainNode.gain.value = this.volume * (1 - pan01)
			this.gainNode2.gain.value = this.volume * pan01
		}
		this.pan = pan
	}
	
	var make = function(notes) {
		// Calculate total duration, adding up duration of each note.
		var seconds = 0
		for(var i=0; i<notes.length; i+=5) {
			seconds += notes[i+2]
		}
		
		// Make the array buffer.
		var bytesPerSecond = gAudioContext.sampleRate;
		var songLength = Math.round(bytesPerSecond * seconds)
		var audioBuffer = gAudioContext.createBuffer(1, songLength, bytesPerSecond)
		
		// Make 2 buffers so that notes can overlap a bit without overwriting part of eachother.
		var bytes = audioBuffer.getChannelData(0)
		var bytes2 = new Float32Array(songLength)
		
		var songByteI = 0
		var fadeIn = 0, fadeOut = 0
		var pi2 = Math.PI*2
		
		// Each note uses 5 slots in the passed in array.
		for(var i=0; i<notes.length; i+=5) {
			// Calculate how many buffer array slots will be used for fade in / fade out of this note.
			fadeIn = bytesPerSecond * notes[i+3] | 0
			// Overlap the fades of the notes.
			songByteI -= Math.min(fadeOut, fadeIn)
			fadeOut = bytesPerSecond * notes[i+4] | 0
			
			// Calculate sine wave multiplier for start/end frequency.
			var multiplier = pi2 * notes[i] / bytesPerSecond
			var multiplier2 = pi2 * notes[i+1] / bytesPerSecond
			
			var noteLen = bytesPerSecond * notes[i+2] | 0
			
			// Alternate which buffer we are writing to.
			var bytesForNote = i/5%2 ? bytes2 : bytes
			
			for(var byteI=0; byteI<noteLen; byteI++) {
				// Smoothly transition from start frequency to end frequency of this note.
				var far = byteI/noteLen
				var angle = byteI * (multiplier2*far + multiplier*(1-far))
				var v = Math.sin(angle)
				
				// Apply fade in / fade out by adjusting the volume.
				if(byteI < fadeIn) {
					v *= byteI / fadeIn
				} else if(byteI > noteLen-fadeOut) {
					v *= (noteLen-byteI) / fadeOut
				}
				
				bytesForNote[songByteI++] = v
			}
		}
		
		// Combine the 2 channels into 1. Average them together for when note's fades slightly overlap.
		for(var i=0; i<songLength; i++) {
			bytes[i] = (bytes[i]+bytes2[i])/2
		}
		
		return audioBuffer
	}
	
	return function(filename) {
		var sound = new gSound()
		var context = gAudioContext
		if(context) {
			if(filename.substr) {
				var ajax = new XMLHttpRequest()
				ajax.open("GET", filename, true)
				ajax.responseType = "arraybuffer"
				ajax.onload = function() {
					context.decodeAudioData (
						ajax.response,
						function(buffer) {
							sound.audioBuffer = buffer
							sound.musicIs = sound.audioBuffer.length>1000000
						},
						function(error) {
							gLog(filename)
							debugger
						}
					)
				}
				
				ajax.onerror = function() {
					debugger
				}
				
				ajax.send()
			} else {
				sound.audioBuffer = make(filename)
				sound.musicIs = sound.audioBuffer.length>1000000
			}
		}
		return sound
	}
}()