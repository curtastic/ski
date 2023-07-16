"use strict"

var w = window,
	gLog = console.log.bind(console),
	gState = 'loading',
	gStateLoop = 0,
	gStateLoops = 0,
	gCamX = 0,
	gCamY = 0,
	gYou = {x:3,y:1,speed:.06},
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
	gMouseTileX=0,
	gMouseTileY=0,
	gMouseX=0,
	gMouseY=0,
	gMouseDownX=0,
	gMouseDownY=0,
	gGrid=[],
	gTileKinds=[],
	gTileKindsById={},
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

	if(gMouseDown) {
		gYou.y += guySpeedGet(gYou)
		if(gHitGrid(gYou.x, gYou.y+1)) {
			gYou.y -= guySpeedGet(gYou)
		}

		var goX = 0
		if(gMouseTileX > gYou.x + 2) {
			goX = 1
		}
		if(gMouseTileX < gYou.x - 1) {
			goX = -1
		}
		if(goX) {
			gYou.x += guySpeedGet(gYou)*goX
			if(gHitGrid(gYou.x+(goX>0), gYou.y) || gHitGrid(gYou.x+(goX>0), gYou.y+.99)) {
				gYou.x -= guySpeedGet(gYou)*goX
			}
		}
	}
}

var guySpeedGet = (guy) => {
	var kind = gTileGet(guy.x+.5, guy.y+.5)
	return guy.speed / (1+(kind&&kind.id=='.'))
}

var gHitGrid = (x,y) => {
	var kind = gTileGet(x,y)
	return !kind || kind.solid
}

var gTileGet = (x,y) => {
	var gridX = x|0
	var gridY = y|0
	return gGridIn(gridX, gridY) && gGrid[gridX][gridY]
}

var gInputUpdate = () => {
	gMouseTileX = gMouseX/gScale/gSize+gCamX
	gMouseTileY = gMouseY/gScale/gSize+gCamY
}

var gGridIn = (x,y) => x>=0 && y>=0 && x<gGrid.length && y<gGrid[0].length

var gGridDraw = () => {
	var tilesX = gSizeX/gSize+1, tilesY = gTilesY+1
	gCamX = gYou.x - gSizeX/2/gSize
	gCamY = gYou.y - gSizeY/2/gSize
	for(var y=0; y<tilesY; y++) {
		for(var x=0; x<tilesX; x++) {
			var gridX = x + gCamX
			var gridY = y + gCamY
			var addX = -(gCamX % 1) * gSize
			var addY = -(gCamY % 1) * gSize
			if(gCamX<0)addX-=gSize
			if(gCamY<0)addY-=gSize
			gridX = Math.floor(gridX)
			gridY = Math.floor(gridY)
			if(gGridIn(gridX, gridY)) {
				var kind =  gGrid[gridX][gridY]
			} else {
				var kind =  gTileKindsById.t
			}
			if(kind.image) {
				var drawX = x*gSize+addX
				var drawY = y*gSize+addY
				gl1.imageDraw(kind.image, drawX, drawY)
			}
		}
	}
}

var gGameDraw = () => {
	if(gState == 'loading') {
		if(!gl1.ready) {
			return
		}
		gStateSet('title')
	}
	
	gGridDraw()
	
	gl1.imageDraw(gPlayerImage, (gYou.x-gCamX)*gSize, (gYou.y-gCamY)*gSize)
	
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
		if(gMouseClicked||1) {
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

w.onload = () => {
	gMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
	gl1.setup(gGameCanvas, "tex.png")

	var kind = {id:' ', name:'path',texX:3,texY:3}
	gTileKinds.push(kind)
	var kind = {id:'.', name:'snow',texX:0,texY:0}
	gTileKinds.push(kind)
	var kind = {id:'t', name:'treesmall',texX:6,texY:2,solid:1}
	gTileKinds.push(kind)
	var kind = {id:'T', name:'treebig',texX:6,texY:0,solid:1}
	gTileKinds.push(kind)
	
	for(var kind of gTileKinds) {
		gTileKindsById[kind.id] = kind
		kind.image = gl1.imageMake(kind.texX*gSize, kind.texY*gSize, gSize, gSize)
	}
	var grid = `
t......      ......t
t......      ......t
t......      ......t
t......      ......t
tt.....      ......t
ttt....      ......t
tttt...      ......t
t......      ......t
t.....       ......t
t....     .  ......t
t...     ..  ......t
t...     ..  ......t
t...     ..  ......t
t....     .  ......t
t.....       ......t
t......      ......t
tt.....      ......t
ttt....      ......t
t......      ......t
t......      ......t
t......      ......t
t......      ......t
t......      ......t
t......      ......t
t......      ......t
t......      ......t
`
	grid = grid.split('\n')
	grid.pop()
	grid.shift()
	for (let x=0; x<grid[0].length; x++) {
		gGrid[x] = []
	}
	
	for(var y=0; y<grid.length; y++) {
		var row = grid[y]
		for (let x=0; x<row.length; x++) {
			gGrid[x][y] = gTileKindsById[row[x]]
		}
	}
	
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

