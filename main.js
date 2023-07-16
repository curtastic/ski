"use strict"

var w = window,
	gLog = console.log.bind(console),
	gState = 'loading',
	gStateLoop = 0,
	gStateLoops = 0,
	gYou = {x:5,y:1},
	u

var gStateSet = (state) => {
	gLog("stateSet() from",gState,"to",state)
	gState = state
	gStateLoop = gloop.updates
	gStateLoops = 0
}

var gGameUpdate = () => {
	gStateLoops = gloop.updates - gStateLoop
	
	gInputUpdate()
	
	gYou.y += .1
}

var gInputUpdate = () => {
}

var gGameDraw = function() {
	if(gState == 'loading') {
		if(!gl1.ready) {
			return
		}
		gStateSet('playing')
	}
	
	gl1.imageDraw(gPlayerImage, gYou.x, gYou.y)
	
	gl1.render()
}

w.onload = function() {
	gl1.setup(gGameCanvas, "tex.png")
	
	w.onresize = _ => {
		gGameCanvas.style.display = 'block'
		gGameCanvas.style.width = innerWidth+'px'
		gGameCanvas.style.height = innerHeight+'px'
		gGameCanvas.setAttribute('width', innerWidth)
		gGameCanvas.setAttribute('height', innerHeight)
		
		gl1.resize()
	}

	w.ondragstart = _ => false 
	w.onselectstart = _ => false 
	
	w.addEventListener("mousedown", e => {
	})
	
	w.addEventListener("mousemove", e => {
	})
	
	document.addEventListener("touchstart", e => {
		for(var touchI in e.changedTouches) {
			var touch = e.changedTouches[touchI]
			gMouseX = touch.clientX
			gMouseY = touch.clientY
		}
		e.preventDefault()
		return false
	}, {passive:false})
	
	document.addEventListener("touchmove", e => {
		for(var touchI in e.changedTouches) {
			var touch = e.changedTouches[touchI]
			gMouseX = touch.clientX
			gMouseY = touch.clientY
		}
		e.preventDefault()
		return false
	}, {passive:false})
	
	document.addEventListener("touchend", e => {
		e.preventDefault()
		return false
	}, {passive:false})
	
	document.addEventListener("touchcancel", e => {
		e.preventDefault()
		return false
		
	}, {passive:false})
	
	w.addEventListener("mouseup", e => {
	})
	
	w.gPlayerImage = gl1.imageMake16(10, 5)
	
	onresize()
	
	gloop.start(gGameUpdate, gGameDraw)
}

