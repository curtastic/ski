"use strict"

var w = window,
	gLog = console.log.bind(console),
	gState = 'loading',
	gStateLoop = 0,
	gStateLoops = 0,
	gCamX = 0,
	gCamY = 0,
	gYou = {x:9,y:1,z:0,speed:.06,frame:0},
	gSize = 16,
	gSizeX = 0,
	gSizeY = 0,
	gTilesYMin = 20,
	gTilesX = 0,
	gTilesY = 0,
	gScale = 1,
	gMobile,
	gMouseDown,
	gMouseHit,
	gMouseReleased,
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
	gCloudImage,
	gTrails=[],
	gGuys=[],
	u
gGuys.push(gYou)

var gStateSet = (state) => {
	gLog("stateSet() from",gState,"to",state)
	gState = state
	gStateLoop = gloop.updates
	gStateLoops = 0
}

var gGameUpdate = () => {
	gStateLoops = gloop.updates - gStateLoop
	
	gInputUpdate()

	for(var guy of gGuys) {
		guy.moved = 0

		if(guy == gYou) {
			if(gMouseDown) {
				gYou.going = 1
				if(gYou.z) {
					gYou.z = 0
					gYou.frame = 0
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
					if(gHitGrid(gYou.x+.2+(goX>0)*.6, gYou.y+.4) || gHitGrid(gYou.x+.2+(goX>0)*.6, gYou.y+.9)) {
						gYou.x -= guySpeedGet(gYou)*goX
					} else {
						guy.moved = 1
					}
				}
			}
			
			if(gMouseReleased) {
				gYou.z = 1
			}
		}
		if(guy.going)
			gGuyGoDown(guy)
		if(guy.moved) {
			guy.frame+=.1
			if(~~guy.frame>1)guy.frame-=2
		}
	}
}

var gGuyGoDown = (guy) => {
	var oldY =guy.y
	guy.y += guySpeedGet(guy)
	if(gHitGrid(guy.x+.2, guy.y+.9,guy.z) || gHitGrid(guy.x+.8, guy.y+.9,guy.z)) {
		guy.y = oldY
		guy.z = 0
	} else {
		guy.moved = 1
		if(!guy.z && ~~guy.y != ~~oldY) {
			if(guy.trailX == guy.x) {
				gLog(~~guy.y,guy.trailY)
				gTrails.push({x:guy.x, y:~~guy.y, loop:gloop.updates,first:~~guy.y!=guy.trailY+1})
				guy.trailY = ~~guy.y
			} else {
				guy.trailX = guy.x
			}
		}
	}
}

var guySpeedGet = (guy) => {
	var kind = gTileGet(guy.x+.5, guy.y+.5)
	return guy.speed / (1+(kind&&kind.id=='.'&&!guy.z))
}

var gHitGrid = (x,y,z) => {
	var kind = gTileGet(x,y) || gTileKindsById.T
	return z ? kind.id=='T' : kind.solid
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

var gGridDraw = (layer) => {
	var tilesX = gTilesX + 1, tilesY = gTilesY+1
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
				var kind =  gTileKindsById.T
			}
			if((kind.id=='T')==layer)
			if(kind.image) {
				var drawX = x*gSize+addX
				var drawY = y*gSize+addY
				gl1.imageDraw(kind.image, drawX, drawY+kind.offsetY)
			}
		}
	}

	var x = 0
	while(x<gSizeX) {
		gl1.imageDraw(gCloudImage,x,tilesY*gSize-29)
		x += gCloudImage.sizeX
	}
}

var gGameDraw = () => {
	if(gState == 'loading') {
		if(!gl1.ready) {
			return
		}
		gStateSet('title')
	}
	
	gGridDraw(0)
	
	for(var i=-1,trail; trail=gTrails[++i];) {
		var life = gloop.updates - trail.loop
		gl1.imageDraw(life < 190 && !trail.first ? gPlayerTrailImage:gPlayerTrailImage2, (trail.x-gCamX)*gSize, (trail.y-gCamY)*gSize)
		if(life > 200) {
			gTrails.splice(i,1)
			i--
		}
	}

	for(var guy of gGuys) {
		if(guy.z||1) {
			gPlayerShadowImage.rgb = 0x33
			gl1.imageDraw(gPlayerShadowImage, (guy.x-gCamX)*gSize, (guy.y-gCamY)*gSize+7)
		}
		gl1.imageDraw(guy.z||~~guy.frame==1 ? gPlayerImage2:gPlayerImage, (guy.x-gCamX)*gSize, (guy.y-gCamY)*gSize - (guy.z*7))
	}
	
	gGridDraw(1)
	
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

	gMouseClicked = gMouseHit = gMouseReleased = 0
}

var gMouseMove = () => {
	if(!gMouseDragged) {
		gMouseDragged = Math.abs(gMouseX - gMouseDownX) > 6 || Math.abs(gMouseY - gMouseDownY) > 6
	}
}

w.onload = () => {
	gMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
	gl1.setup(gGameCanvas, "tex.png")

	gCloudImage = gl1.imageMake(0,232,24,24)
	
	w.gPlayerShadowImage = gl1.imageMake16(11, 7)
	w.gPlayerImage = gl1.imageMake16(10, 5)
	w.gPlayerImage2 = gl1.imageMake16(11, 5)
	w.gPlayerTrailImage = gl1.imageMake16(10, 4)
	w.gPlayerTrailImage2 = gl1.imageMake16(11, 4)

	var kind = {id:' ', name:'path',texX:2.5,texY:2.5}
	gTileKinds.push(kind)
	var kind = {id:'.', name:'snow',texX:0,texY:0}
	gTileKinds.push(kind)
	var kind = {id:'t', name:'treesmall',texX:6,texY:2,solid:1}
	gTileKinds.push(kind)
	var kind = {id:'T', name:'treebig',texX:6,texY:0,texSizeY:2,solid:1,offsetY:-15}
	gTileKinds.push(kind)
	var kind = {id:'r', name:'rock',texX:9,texY:6,solid:1}
	gTileKinds.push(kind)
	
	for(var kind of gTileKinds) {
		gTileKindsById[kind.id] = kind
		kind.offsetY = kind.offsetY||0
		kind.texSizeY = kind.texSizeY||1
		kind.image = gl1.imageMake(kind.texX*gSize, kind.texY*gSize, gSize, gSize*kind.texSizeY)
	}
	var grid = `
......      ......
......      ......
......      ......
......      ......
t.....      ......
tt....      ......
ttt...rrrrrr......
......rrrrrr......
.....       ......
....     T  ......
...     T.  ......
...    T..T ......
...     Tt  ......
....  T  t  ......
.....      T......
......      ......
t.....      ......
tt....      ......
......      ......
......      ......
......      ......
......      ......
......      ......
......      ......
......      ......
......      ......
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
		gTilesY = gTilesYMin
		gSizeY = gTilesY*gSize
		gScale = innerHeight / gSizeY | 0
		gSizeX = innerWidth / gScale | 0
		gTilesX = gSizeX / gSize
		
		gGameCanvas.setAttribute('width', ~~gSizeX)
		gGameCanvas.setAttribute('height', ~~gSizeY)

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
		gMouseReleased = 1
		gMouseClicked = !gMouseDragged
		e.preventDefault()
		return false
	}, {passive:false})
	
	document.addEventListener("touchcancel", e => {
		gMouseDown = 0
		gMouseReleased = 1
		e.preventDefault()
		return false
		
	}, {passive:false})
	
	w.addEventListener("mouseup", e => {
		gMouseDown = 0
		gMouseReleased = 1
		gMouseClicked = !gMouseDragged
	})
	
	onresize()
	
	gloop.start(gGameUpdate, gGameDraw)
}

