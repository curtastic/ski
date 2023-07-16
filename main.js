"use strict"

var w = window,
	gLog = console.log.bind(console),
	gState = 'loading',
	gStateLoop = 0,
	gStateLoops = 0,
	gYou = {x:5,y:1},
	gSize = 16,
	gSizeX = 0,
	gSizeY = 0,
	gTilesY = 20,
	gScale = 1,
	gMobile,
	gMouseDown,
	gMouseHit,
	gMouseClicked,
	gMouseDragged,
	gMouseX=0,
	gMouseY=0,
	gMouseDownX=0,
	gMouseDownY=0,
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
	
	gYou.y += .05
}

var gInputUpdate = () => {
}

var gGameDraw = function() {
	if(gState == 'loading') {
		if(!gl1.ready) {
			return
		}
		if(1)
			gStateSet('title')
		else
			gStateSet('playing')
	}
	
	gl1.imageDraw(gPlayerImage, gYou.x*gSize, gYou.y*gSize)
	
	if(gState == 'title') {
		var text = "BORN TO SKI!"
		var scale = 1.2
		var x = gSizeX/2-glText.sizeXGet(text)/2*scale
		for (let i = 0; i < text.length; i++) {
			var y = 55
			var addy = Math.sin(gloop.updates/5+i/2)
			y += addy*4
			glText.draw(text[i], x,y,scale,1)
			x += glText.sizeXGet(text[i])*scale
		}
		glText.draw((gMobile?"Click":"Click")+" and hold!", gSizeX/2,145,1,1)
		glText.draw("Let go to jump!", gSizeX/2,165,1,1)
		glText.draw("Get ready!", gSizeX/2,222,1,1,0xFFFFFF00+Math.abs(Math.sin(gloop.updates/11))*128)
		if(gMouseClicked) {
			gStateSet('playing')
		}
	}
	
	gl1.render()

	gMouseClicked = gMouseHit = 0
}

var gMouseMove = () => {
	if(!gMouseDragged) {
		gMouseDragged = Math.abs(gMouseX - gMouseDownX) > 6 || Math.abs(gMouseY - gMouseDownY) > 6
	}
}

w.onload = function() {
	gMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
	gl1.setup(gGameCanvas, "tex.png")
	
	w.onresize = _ => {
		var screenRatio = innerWidth/innerHeight
		gSizeY = gTilesY*gSize
		gSizeX = gSizeY*screenRatio
		gGameCanvas.setAttribute('width', ~~gSizeX)
		gGameCanvas.setAttribute('height', ~~gSizeY)

		gScale = innerHeight / gSizeY
		gGameCanvas.style.width = ~~(gSizeX*gScale)+'px'
		gGameCanvas.style.height = ~~(gSizeY*gScale)+'px'
		
		gl1.resize()
	}

	w.ondragstart = _ => false 
	w.onselectstart = _ => false 
	
	w.addEventListener("mousedown", e => {
		gMouseDown = 1
		gMouseHit = 1
		gMouseDragged = 0
		gMouseX = e.pageX
		gMouseY = e.pageY
		gMouseDownX = gMouseX
		gMouseDownY = gMouseY
	})
	
	w.addEventListener("mousemove", e => {
		gMouseX = e.pageX
		gMouseY = e.pageY
		gMouseMove()
	})
	
	document.addEventListener("touchstart", e => {
		gMouseDown = 1
		gMouseHit = 1
		gMouseDragged = 0
		for(var touchI in e.changedTouches) {
			var touch = e.changedTouches[touchI]
			gMouseX = touch.clientX
			gMouseY = touch.clientY
		}
		gMouseDownX = gMouseX
		gMouseDownY = gMouseY
		e.preventDefault()
		return false
	}, {passive:false})
	
	document.addEventListener("touchmove", e => {
		for(var touchI in e.changedTouches) {
			var touch = e.changedTouches[touchI]
			gMouseX = touch.clientX
			gMouseY = touch.clientY
		}
		gMouseMove()
		e.preventDefault()
		return false
	}, {passive:false})
	
	document.addEventListener("touchend", e => {
		gMouseDown = 0
		gMouseClicked = !gMouseDragged
		e.preventDefault()
		return false
	}, {passive:false})
	
	document.addEventListener("touchcancel", e => {
		gMouseDown = 0
		e.preventDefault()
		return false
		
	}, {passive:false})
	
	w.addEventListener("mouseup", e => {
		gMouseDown = 0
		gMouseClicked = !gMouseDragged
	})
	
	w.gPlayerImage = gl1.imageMake16(10, 5)
	
	onresize()
	
	gloop.start(gGameUpdate, gGameDraw)
}

