/*
	gloop.js
	A game loop library.
	Features:
	- Set your desired FPS and it will run your updateFunc() that many times per second.
	- If lagging it will skip draws, to make your updateFunc() always run at the same speed on any device.
	- If the device can render 120 FPS and your game is set to 60, this will make sure it doesn't run extra fast on those devices.
	- Get the current FPS the game is rendering at. (gloop.dps)
	- Supports old devices/browsers including IE11 and iOS9.
	Does not include:
	- No delta timing. This is because delta timing can result in different outcomes on slow devices, such as bullets skipping through enemies.
*/

var gloop = {
	// Total times updateFunc has been called ever.
	updates: 0,
	// Total times drawFunc has been called ever.
	draws: 0,
	// Updates per second. The amount of times updateFunc has been called in the last full second. Should equal goalFps.
	ups: 0,
	// Draws per second (FPS). The amount of times drawFunc has been called in the last full second. Will equal goalFps if not lagging.
	dps: 0,
	// The current system time in milliseconds.
	time: 0,
	// If gloop is running. You can start/stop/start again any time.
	looping: false,
	// This will start looping, running updateFunc/drawFunc at goalFps FPS. You can call it again to change your fps or functions.
	start: function(updateFunc, drawFunc, goalFps) {
		this._updateFunc = updateFunc
		this._drawFunc = drawFunc
		this._goalMs = 1000 / (goalFps || 60)
		this.inUpdate = false
		this.inDraw = false
		if(!this.looping) {
			this.looping = true
			this._elapsed = this._timeOld = this._upsCount = this._dpsCount = 0
			this._loop()
		}
	},
	stop: function() {
		this.looping = false
	},
	// This is called internally by gloop.start()
	_loop: function() {
		if(this.inUpdate || this.inDraw) {
			this.stop()
		}
		
		if(!this.looping)
			return
		
		requestAnimationFrame(this._loop.bind(this))
		
		this.time = Date.now()
		this._elapsed += this.time - this._timeOld
		
		if(this._elapsed >= this._goalMs) {
			var updates = Math.floor(this._elapsed / this._goalMs)
			this._elapsed -= this._goalMs * updates
			
			if(updates > 999) {
				updates = 1
				this._elapsed = 0
			}
			
			for(var u=0; u<updates; u++) {
				this.inUpdate = true
				this._updateFunc()
				this.inUpdate = false
				this._upsCount++
				this.updates++
			}
			
			if(this.inUpdate) {
				this.stop()
				return
			}
			
			this.inDraw = true
			this._drawFunc()
			this.inDraw = false
			this._dpsCount++
			this.draws++
			
			if(this.inDraw) {
				this.stop()
				return
			}
			
			if(Math.floor(this.time/1000) > Math.floor(this._timeOld/1000)) {
				this.ups = this._upsCount
				this._upsCount = 0
				
				this.dps = this._dpsCount
				this._dpsCount = 0
			}
		}
		
		this._timeOld = this.time
	}
}