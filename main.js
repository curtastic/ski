"use strict"

var w = window,
	gLog = console.log.bind(console),
	gState = 'loading',
	gStateLoop = 0,
	gStateLoops = 0,
	gCamX = 0,
	gCamY = 0,
	gYou = {},
	gSize = 16,
	gButtonSize = 48,
	gSizeX = 0,
	gSizeY = 0,
	gTilesYMin = 19,
	gTilesX = 0,
	gTilesY = 0,
	gScale = 1,
	gMobile,
	gKeyDown = [],
	gKeyHit = [],
	gKeyReleased = [],
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
	gPi = Math.PI,
	gStartTime = 0,
	gPauseTime = 0,
	gPauseTimeTotal = 0,
	u
gGuys.push(gYou)

var gStateSet = (state) => {
	gLog("stateSet() from",gState,"to",state)
	
	if(state == 'paused') {
		gPauseTime = gloop.time
	}
	if(state == 'playing') {
		if(gState == 'paused') {
			gPauseTimeTotal += gloop.time-gPauseTime
		} else {
			gStartTime = gloop.time
		}
	}
	
	gState = state
	gStateLoop = gloop.updates
	gStateLoops = 0
}

var gGameUpdate = () => {
	gStateLoops = gloop.updates - gStateLoop
	
	gInputUpdate()

	if(gState == 'playing') {
		for(var guy of gGuys) {
			guy.moved = 0
	
			if(guy == gYou) {
				if(gMouseDown) {
					gYou.going = 1
					if(gYou.z) {
						gYou.z = 0
						gYou.frame = 0
					}
					//gYou.angle += .02*(gYou.x-gMouseTileX)
					var angle = Math.atan2(Math.max(0,gMouseTileY-gYou.y), gMouseTileX-gYou.x)
					gLog(angle, gYou.angle)
					if(angle < 0)angle = 0
					if(angle > gPi)angle = gPi
					gYou.angle += Math.sign(angle-gYou.angle)*.05
				}
				if(gYou.angle<gPi*.1)gYou.angle=gPi*.1
				if(gYou.angle>gPi*.9)gYou.angle=gPi*.9
				var oldX = gYou.x
				var goX = Math.cos(gYou.angle)*guySpeedGet(gYou)
				gYou.x += goX
				if(gHitGrid(gYou.x+.2+(goX>0)*.6, gYou.y+.4, gYou.z) || gHitGrid(gYou.x+.2+(goX>0)*.6, gYou.y+.9, gYou.z)) {
					gYou.x = oldX
					//gYou.angle = gPi/2
					//gYou.speed = 0
					gYou.z = 0
				} else {
					guy.moved = 1
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

	if(gKeyHit[27]) {
		gStateSet(gState == 'paused' ? 'playing':'paused')
	}
	
	gKeyHit = []
	gKeyReleased = []
}

var gGuyGoDown = (guy) => {
	var oldY = guy.y
	guy.y += Math.sin(guy.angle) * guySpeedGet(guy)
	gYou.speed += .001
	if(gYou.speed > gYou.speedMax)gYou.speed = gYou.speedMax
	if(gHitGrid(guy.x+.2, guy.y+.9,guy.z) || gHitGrid(guy.x+.8, guy.y+.9,guy.z)) {
		guy.y = oldY
		guy.z = 0
		//gYou.speed *= Math.abs(1-Math.sin(guy.angle))
		//gYou.angle = gPi/2
	} else {
		guy.moved = 1
		if(!guy.z && guy.y >= guy.trailY+2/gSize) {
			gTrails.push({x:~~(guy.x*gSize)/gSize, y:~~(guy.y*gSize)/gSize, loop:gloop.updates, first:guy.y >= guy.trailY+4/gSize})
			guy.trailY = guy.y
		}
		if(guy == gYou && ~~guy.y != ~~oldY) {
			var y = ~~guy.y
			for(var x=0; x<gGrid.length; x++) {
				var kind = gGrid[x][y]
				if(kind) {
					if(kind.id == '>') {
						if(guy.x > x) {
							gGrid[x][y] = gTileKindsById['>good']
							guy.gateGoods++
						} else {
							gGrid[x][y] = gTileKindsById['>bad']
							guy.gateBads++
						}
					} else if(kind.id == '<') {
						if(guy.x < x) {
							gGrid[x][y] = gTileKindsById['<good']
							guy.gateGoods++
						} else {
							gGrid[x][y] = gTileKindsById['<bad']
							guy.gateBads++
						}
					}
				}
			}
		}
	}

	if(!guy.z) {
		var x1 = (guy.x)|0
		var x2 = (guy.x+1)|0
		var y1 = (guy.y)|0
		var y2 = (guy.y+1)|0
		for(var y=y1; y<=y2; y++) {
			for(var x=x1; x<=x2; x++) {
				var kind = gGrid[x][y]
				if(kind && kind.id=='c') {
					gGrid[x][y] = gTileKindsById[' ']
					guy.coins++
				}
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
	if(kind.id=='T' || kind.solid)
		return kind
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
	var tilesX = gTilesX + 1, tilesY = gTilesY+2
	gCamX = gYou.x - gSizeX/2/gSize
	gCamY = gYou.y - gSizeY/2/gSize
	for(var y=0; y<tilesY; y++) {
		for(var x=0; x<tilesX; x++) {
			var gridX = x + gCamX
			var gridY = y + gCamY
			gridX = Math.floor(gridX)
			gridY = Math.floor(gridY)
			if(gGridIn(gridX, gridY)) {
				var kind =  gGrid[gridX][gridY]
			} else {
				var kind =  gTileKindsById.T
			}
			if((kind.id=='T')==layer || kind.id=='c') {
				if(kind.image) {
					var addX = -(gCamX % 1) * gSize
					var addY = -(gCamY % 1) * gSize
					if(gCamX<0)addX-=gSize
					if(gCamY<0)addY-=gSize
					var drawX = x*gSize+addX
					var drawY = y*gSize+addY
					if(kind.id=='c' && !layer) {
						gl1.imageDraw(gTileKindsById[' '].image, drawX, drawY)
						gl1.imageDraw(gPlayerShadowImage, drawX, drawY+5)
					} else {
						gl1.imageDraw(kind.id=='c' && gloop.updates%12<6 ?kind.image2: kind.image, drawX, drawY+kind.offsetY, u, u, kind.flipX)
					}
				}
			}
		}
	}

	var x = 0
	while(x<gSizeX) {
		gl1.imageDraw(gCloudImage,x,(tilesY-2)*gSize-13)
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
		gl1.imageDraw(!trail.first ? gPlayerTrailImage:gPlayerTrailImage2, (trail.x-gCamX)*gSize, (trail.y-gCamY)*gSize)
		if(gCamY > trail.y) {
			gTrails.splice(i,1)
			i--
		}
	}

	for(var guy of gGuys) {
		if(guy.z == 0)gGuyDraw(guy)
	}
	
	gGridDraw(1)
	
	for(var guy of gGuys) {
		if(guy.z == 1)gGuyDraw(guy)
	}
	
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
		glText.draw((gMobile?"Press":"Click")+" and hold!", gSizeX/2,145,1,1)
		glText.draw("Let go to jump!", gSizeX/2,165,1,1)
		glText.draw("Get ready!", gSizeX/2,222,1,1,0xFFFFFF00+Math.abs(Math.sin(gloop.updates/11))*128)
		if(gMouseDown||location.host=='localhost') {
			gStateSet('playing')
		}
	}

	if(gState == 'paused') {
		gl1.drawRect(0,0,gSizeX,gSizeY,0x33)
		glText.draw("PAUSED", gSizeX/2, gSizeY*.3, 2, 1)

		var x = gSizeX/2-gSize*3
		var y = gSizeY*.5
		var onBox = gMouseOnBox(x,y,gButtonSize,gButtonSize) && !gMouseDragged
		gl1.imageDraw(gMouseDown && onBox?gResetButtonDown:gResetButton,x,y,gButtonSize,gButtonSize)
		if(gMouseClicked && onBox) {
			gReset()
		}
		var x = gSizeX/2+gSize
		var y = gSizeY*.5
		var onBox = gMouseOnBox(x,y,gButtonSize,gButtonSize) && !gMouseDragged
		gl1.imageDraw(gMouseDown && onBox?gPlayButtonDown:gPlayButton,x,y,gButtonSize,gButtonSize)
		if(gMouseClicked && onBox) {
			gStateSet('playing')
		}
	}

	var size=32
	var onBox = gMouseOnBox(4,4,size,size) && !gMouseDragged
	gl1.imageDraw(gMouseDown && onBox?gPauseButtonDown:gPauseButton,4,4,size,size)
	if(gMouseClicked && onBox) {
		gStateSet(gState == 'paused' ? 'playing':'paused')
	}

	var time = gloop.time - gStartTime - gPauseTimeTotal
	if(gState == 'paused') {
		time -= gloop.time - gPauseTime
	}
	var sec = time/1000 | 0
	var min = sec/60 | 0
	sec = sec % 60 + ''
	if(sec.length<2)sec='0'+sec
	glText.draw(min+":"+sec, gSizeX/2, 2, 2, 1)

	gl1.imageDraw(gTileKindsById['>good'].image,gSizeX-33,1)
	glText.draw(gYou.gateGoods, gSizeX-18, 2)

	gl1.imageDraw(gTileKindsById.c.image,gSizeX-33,19)
	glText.draw(gYou.coins, gSizeX-18, 18)
	

	gl1.render()

	gMouseClicked = gMouseHit = gMouseReleased = 0
}

var gGuyDraw = (guy) => {
	gl1.imageDraw(gPlayerShadowImage, (guy.x-gCamX)*gSize, (guy.y-gCamY)*gSize+7)
	gl1.imageDraw(guy.z||~~guy.frame==1 ? gPlayerImage2:gPlayerImage, (guy.x-gCamX)*gSize, (guy.y-gCamY)*gSize - (guy.z*7))
}

var gMouseDownOnBox = (x,y,sizeX,sizeY) => {
	return gMouseDown && !gMouseDragged && gMouseOnBox(x,y,sizeX,sizeY)
}

var gMouseOnBox = (x,y,sizeX,sizeY) => {
	var mouseX = gMouseX/gScale
	var mouseY = gMouseY/gScale
	return mouseX>=x && mouseY>=y && mouseX<=x+sizeX && mouseY<=y+sizeY
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
	gPlayerShadowImage.rgb = 0x33
	w.gPlayerImage = gl1.imageMake16(10, 5)
	w.gPlayerImage2 = gl1.imageMake16(11, 5)
	w.gPlayerTrailImage = gl1.imageMake(10*gSize, 4*gSize,gSize,3)
	w.gPlayerTrailImage2 = gl1.imageMake(11*gSize, 4*gSize,gSize,3)
	
	w.gPauseButton = gl1.imageMake16(12, 0)
	w.gPauseButtonDown = gl1.imageMake16(13, 0)
	w.gPlayButton = gl1.imageMake16(12, 1)
	w.gPlayButtonDown = gl1.imageMake16(13, 1)
	w.gResetButton = gl1.imageMake16(12, 2)
	w.gResetButtonDown = gl1.imageMake16(13, 2)

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
	var kind = {id:'>', name:'gateright',texX:7,texY:2,solid:1}
	gTileKinds.push(kind)
	var kind = {id:'<', name:'gateleft',texX:7,texY:2,solid:1,flipX:1}
	gTileKinds.push(kind)
	var kind = {id:'>bad', name:'gaterightbad',texX:8,texY:2,solid:1}
	gTileKinds.push(kind)
	var kind = {id:'>good', name:'gaterightgood',texX:9,texY:2,solid:1}
	gTileKinds.push(kind)
	var kind = {id:'<bad', name:'gateleftbad',texX:8,texY:2,solid:1,flipX:1}
	gTileKinds.push(kind)
	var kind = {id:'<good', name:'gateleftgood',texX:9,texY:2,solid:1,flipX:1}
	gTileKinds.push(kind)
	var kind = {id:'c', name:'coin',texX:14,texY:1}
	kind.image2 = gl1.imageMake16(15,1)
	gTileKinds.push(kind)
	
	for(var kind of gTileKinds) {
		gTileKindsById[kind.id] = kind
		kind.offsetY = kind.offsetY||0
		kind.texSizeY = kind.texSizeY||1
		kind.image = gl1.imageMake(kind.texX*gSize, kind.texY*gSize, gSize, gSize*kind.texSizeY)
	}
	
	onresize = _ => {
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

	ondragstart = _ => false 
	onselectstart = _ => false 
	
	addEventListener("mousedown", e => {
		gMouseDown = 1
		gMouseHit = 1
		gMouseDragged = 0
		gMouseX = e.pageX
		gMouseY = e.pageY
		gMouseDownX = gMouseX
		gMouseDownY = gMouseY
	})
	
	addEventListener("mousemove", e => {
		gMouseX = e.pageX
		gMouseY = e.pageY
		gMouseMove()
	})
	
	document.addEventListener("touchstart", e => {
		gMouseDown = 1
		gMouseHit = 1
		gMouseDragged = 0
		for(var touchI=-1,touch; touch=e.changedTouches[++touchI];) {
			gMouseX = touch.clientX
			gMouseY = touch.clientY
		}
		gMouseDownX = gMouseX
		gMouseDownY = gMouseY
		e.preventDefault()
		return false
	}, {passive:false})
	
	document.addEventListener("touchmove", e => {
		for(var touchI=-1,touch; touch=e.changedTouches[++touchI];) {
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
	
	addEventListener("mouseup", e => {
		gMouseDown = 0
		gMouseReleased = 1
		gMouseClicked = !gMouseDragged
	})
	
	addEventListener("keydown", e => {
		var c = e.keyCode
		if(!gKeyDown[c]) {
			gKeyHit[c] = gKeyDown[c] = 1
		}
	})
	
	addEventListener("keyup", e => {
		var c = e.keyCode
		gKeyDown[c] = 0
		gKeyReleased[c] = 1
	})
	
	onresize()

	gReset()
	
	gloop.start(gGameUpdate, gGameDraw)
}

var gReset = () => {
	gYou.x = 9
	gYou.y = 1
	gYou.z = 0
	gYou.speed = 0
	gYou.speedMax = .11
	gYou.angle = 1.57
	gYou.frame = 0
	gYou.trailY = 0
	gYou.gateGoods = 0
	gYou.gateBads = 0
	gYou.coins = 0
	
	var grid = `
......      ......
......      ......
......      ......
......      ......
t.....      ......
tt....      ......
ttt... >  rr......
...... rc rr......
.....       ......
....   cc<  ......
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
t.....      ......
tt....      ......
...... TT   ......
...... TT   ......
......      ......
......      ......
......      ......
......      ......
......      ......
......      ......
.......     ......
.......    .......
.......    .......
.......   ........
......    ........
.....    ...TT....
.....      TTT....
......      T.....
.......     ......
........     .....
.........    .....
........T.   .....
........T.   .....
........T.   .....
.........   ......
........   .......
........   .......
........   .......
........   .......
........   .......
........   .......
........   .......
........   .......
........   .......
........   .......
.......    .......
.....      .......
....     .........
..    ............
..    ............
`
	grid = grid.split('\n')
	grid.pop()
	grid.shift()
	for (let x=0; x<=grid[0].length; x++) {
		gGrid[x] = []
	}
	
	for(var y=0; y<grid.length; y++) {
		var row = 'T'+grid[y]
		for (let x=0; x<row.length; x++) {
			gGrid[x][y] = gTileKindsById[row[x]]
		}
	}

	if(gState != 'loading') {
		gStateSet('title')
	}
	
}

