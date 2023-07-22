"use strict"

var w = window,
	gLog = console.log.bind(console),
	gState = 'loading',
	gStateOld = '',
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
	gJumped,
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
	gGateGoodX=0,
	gGateGoodY=0,
	gGateGoodLoop=0,
	gGateBadX=0,
	gGateBadY=0,
	gGateBadLoop=0,
	gGuys=[],
	gPi = Math.PI,
	gStartTime = 0,
	gPauseTime = 0,
	gPauseTimeTotal = 0,
	gPlayTime = 0,
	gScore = 0,
	gLevels = [],
	gLevel,
	gLevelPlayed,
	gMenuMusic,
	gMusic,
	gAudioUnlocked,
	gMusicPlaying,
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
	
	if(gState == 'playing') {
		gMusic && gMusic.stop()
		gMusicPlaying = u
	}

	gStateOld = gState
	gState = state
	gStateLoop = gloop.updates
	gStateLoops = 0
	
	if(gStateOld == 'paused') {
		gMusicPlayTry()
	}
}

var gMusicGet = () => {
	return gState == 'playing' || gState == 'levelstart' ? gMusic : gMenuMusic
}

var gMusicStop = () => {
	var music = gMusicGet()
	if(gMusicPlaying && music!=gMusicPlaying) {
		gMusicPlaying.stop()
		gMusicPlaying = u
	}
}

var gMusicPlayTry = (click) => {
	gMusicStop()
	if(gState == 'paused') {
		return
	}
	var music = gMusicGet()
	if(!gMusicPlaying && music && music.audioBuffer && (click || gAudioUnlocked)) {
		music.play()
		gMusicPlaying = music
		gAudioUnlocked = 1
	}
}

var gGameUpdate = () => {
	gStateLoops = gloop.updates - gStateLoop

	gMusicPlayTry()
	
	gInputUpdate()

	if(gState == 'playing' || gState == 'done') {
		for(var guy of gGuys) {
			guy.moved = 0
			if(guy.fell) {
				guy.fell--
				guy.y -= .12
			}

			if(guy.z) {
				guy.z -= .005 * (1+(gState=='done')*4) * (4-Math.sin(guy.angle)*guy.speed/guy.speedMax*2)
				if(guy.z < 0) {
					guy.z = 0
				}
			}
	
			if(guy == gYou) {
				if(gMouseDown) {
					gYou.going = 1
					if(gYou.z) {
						gYou.z = 0
						gYou.frame = 0
					}
					//gYou.angle += .02*(gYou.x-gMouseTileX)
					var angle = Math.atan2(Math.max(0,gMouseTileY-gYou.y), gMouseTileX-gYou.x)
					//gLog(angle, gYou.angle)
					if(angle < 0)angle = 0
					if(angle > gPi)angle = gPi
					gYou.angle += Math.sign(angle-gYou.angle)*.05
				}
				if(gYou.angle<gPi*.1)gYou.angle=gPi*.1
				if(gYou.angle>gPi*.9)gYou.angle=gPi*.9
				var oldX = gYou.x
				var goX = Math.cos(gYou.angle)*gYou.speed
				gYou.x += goX
				if(gHitGrid(gYou.x+.2+(goX>0)*.6, gYou.y+.4, gYou.z) || gHitGrid(gYou.x+.2+(goX>0)*.6, gYou.y+.9, gYou.z)) {
					gYou.x = oldX
					//gYou.angle = gPi/2
					gYou.speed *= .9
					gYou.z = 0
				} else {
					guy.moved = 1
				}
				
			}
			if(guy.going)
				gGuyGoDown(guy)
			if(guy.moved) {
				guy.frame+=.1
				if(~~guy.frame>1)guy.frame-=2
				if(gState == 'done')guy.frame=0
			}
			if(gMouseDown)gJumped=0
			if(!gMouseDown && guy == gYou && !gYou.z && !gYou.fell && !gJumped && gState=='playing') {
				if(gYou.speed > .015) {
					gYou.z = 1
					gJumped = 1
				}
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
	if(gState == 'done')guy.speed*=.96
	guy.y += Math.sin(guy.angle) * guy.speed
	var thrust = gState == 'done'?0:.001

	if(!guy.z) {
		var kind = gTileGet(guy.x+.5, guy.y+.5)
		if(kind && kind.id=='.') {
			thrust *= .3
			if(guy.speed > guy.speedMax/2)
				guy.speed = guy.speed*.3 + guy.speedMax/2*.3
		}
	}

	if(!guy.z)
		guy.speed += thrust
	if(guy.speed > guy.speedMax)guy.speed = guy.speedMax

	
	if(gHitGrid(guy.x+.2, guy.y+.9,guy.z) || gHitGrid(guy.x+.8, guy.y+.9,guy.z)) {
		guy.y = oldY
		guy.z = 0
		guy.speed = 0
		guy.y -= .1
		guy.fell = 4
		gSoundHit.play()
		//guy.speed *= Math.abs(1-Math.sin(guy.angle))
		//guy.angle = gPi/2
	} else {
		guy.moved = 1
		if(!guy.z && guy.y >= guy.trailY+2/gSize) {
			gTrails.push({x:~~(guy.x*gSize)/gSize, y:~~(guy.y*gSize)/gSize+.5, loop:gloop.updates, first:guy.y >= guy.trailY+4/gSize})
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
							gGateGoodX = x
							gGateGoodY = y
							gGateGoodLoop = gloop.updates
							gSoundGateGood.play()
						} else {
							gGrid[x][y] = gTileKindsById['>bad']
							guy.gateBads++
							gGateBadX = x
							gGateBadY = y
							gGateBadLoop = gloop.updates
							gSoundGateBad.play()
						}
					} else if(kind.id == '<') {
						if(guy.x < x) {
							gGrid[x][y] = gTileKindsById['<good']
							guy.gateGoods++
							gGateGoodX = x
							gGateGoodY = y
							gGateGoodLoop = gloop.updates
							gSoundGateGood.play()
						} else {
							gGrid[x][y] = gTileKindsById['<bad']
							guy.gateBads++
							gGateBadX = x
							gGateBadY = y
							gGateBadLoop = gloop.updates
							gSoundGateBad.play()
						}
					}
				}
			}
		}
	}

	if(guy.z < .5) {
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
					gSoundCoin.play()
				}
			}
		}
	}

	if(!guy.done) {
		var kind = gTileGet(guy.x+.5,guy.y+.5)
		if(kind && kind.id=='=') {
			guy.done = 1
			if(guy == gYou) {
				gStateSet('done')
				gSoundWin.play()
			}
		}
	}
}

var gHitGrid = (x,y,z,onlyHere) => {
	var kind = gTileGet(x,y) || gTileKindsById.T
	if(z ? kind.id=='T' : kind.solid) {
		var pad = .2
		for(var way=-1; way<2; way+=2) {
			var add = way*pad
			if(
				!onlyHere &&
				!gHitGrid(x+add,y,z,1) &&
				(!gHitGrid(x,y-add,z,1) || !gHitGrid(x,y+add,z,1))
			  )return
		}
		return kind
	}
}

var gTileIsSnow = (x,y) => {
	var kind = gTileGet(x,y)
	return !kind || (kind.id!=' ' && kind.id!='c')
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
	var addX = -(gCamX % 1) * gSize
	var addY = -(gCamY % 1) * gSize
	if(gCamX<0)addX-=gSize
	if(gCamY<0)addY-=gSize
	for(var y=0; y<tilesY; y++) {
		for(var x=0; x<tilesX; x++) {
			var gridX = x + gCamX
			var gridY = y + gCamY
			gridX = Math.floor(gridX)
			gridY = Math.floor(gridY)
			if(gGridIn(gridX, gridY)) {
				var kind =  gGrid[gridX][gridY]
				//if(kind.id == '.')continue
			} else {
				var kind =  gTileKindsById.T
			}
			if((kind.id=='T')==layer || kind.id=='c') {
				if(kind.image) {
					var drawX = x*gSize+addX
					var drawY = y*gSize+addY
					var gateLoops = gloop.updates - gGateGoodLoop
					kind.image.rgb = 0xFFFFFF7F
					if(gateLoops < 8) {
						if(gGateGoodX == gridX && gGateGoodY == gridY) {
							drawY -= gateLoops/2
							kind.image.rgb = 0xFFFFFF7F+Math.floor(Math.sin(gateLoops/8*gPi)*22)
						}
					}
					var gateLoops = gloop.updates - gGateBadLoop
					if(gateLoops < 8) {
						if(gGateBadX == gridX && gGateBadY == gridY) {
							drawX += Math.sin(gateLoops/2)*2-1
							kind.image.rgb = 0xFFFFFF7F+Math.floor(Math.sin(gateLoops/8*gPi)*22)
						}
					}
					gTileKindsById['='].image.rgb = 0x0FFF907f
					if(kind.id=='c' && !layer) {
						gl1.imageDraw(gTileKindsById[' '].image, drawX, drawY)
						gl1.imageDraw(gPlayerShadowImage, drawX, drawY+5)
					} else {
						if(gTileIsSnow(gridX, gridY)) {
							if(!gTileIsSnow(gridX+1, gridY))gl1.imageDraw(gSnowRImage, drawX+8, drawY)
							if(!gTileIsSnow(gridX-1, gridY))gl1.imageDraw(gSnowRImage, drawX, drawY,u,u,1)
							if(!gTileIsSnow(gridX, gridY+1))gl1.imageDraw(gSnowRImage, drawX+4, drawY+4, u,u,u,u,gPi/2)
							if(!gTileIsSnow(gridX, gridY-1))gl1.imageDraw(gSnowRImage, drawX+4, drawY-4, u,u,u,u,-gPi/2)
						}
						if(kind.id == '.')continue
						gl1.imageDraw(kind.id=='c' && gloop.updates%12<6 ?kind.image2: kind.image, drawX, drawY+kind.offsetY, u, u, kind.flipX)
						if(!gTileIsSnow(gridX, gridY)) {
							if(gTileIsSnow(gridX-1, gridY))gl1.imageDraw(gPathLImage, drawX, drawY)
							if(gTileIsSnow(gridX+1, gridY))gl1.imageDraw(gPathLImage, drawX+8, drawY,u,u,1)
							if(gTileIsSnow(gridX, gridY+1))gl1.imageDraw(gPathLImage, drawX+4, drawY+4, u,u,u,u,-gPi/2)
							if(gTileIsSnow(gridX, gridY-1))gl1.imageDraw(gPathLImage, drawX+4, drawY-4, u,u,u,u,gPi/2)
						}
					}
				}
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
	
	if(gState == 'leaderboard') {
		gl1.drawRect(0,0,gSizeX,gSizeY,0xcfe7f77f)
		var y = 10
		var levelIndex = gLevels.indexOf(gLevel)
		glText.draw("Level "+(levelIndex+1), gSizeX/2,y,2,1)
		y+=35
		glText.draw(gLevel.name+" slope", gSizeX/2,y,1,1)
		y+=30
		gLevel.scores = [
			{name: "Curtastic", score:2500},{name: "SHAUN", score:2000},
			{name: "Tarbosh", score:1000},
			{name: "LUIGI", score:500},
		]
		for(var i=-1,score; score=gLevel.scores[++i];) {
			glText.draw((i+1)+"."+score.name, gSizeX/2-83,y)
			glText.draw(score.score, gSizeX/2+38,y)
			y+=20
		}
		y=gSizeY-66
		
		var x = gSizeX/2-gSize*5
		var onBox = gMouseOnBox(x,y,gButtonSize,gButtonSize) && !gMouseDragged
		gl1.imageDraw(gMouseDown && onBox?gBackButtonDown:gBackButton,x,y,gButtonSize,gButtonSize)
		if(gMouseClicked && onBox) {
			gStateSet('title')
		}

		if(gLevelPlayed == gLevel) {
			var x = gSizeX/2-gSize*1.5
			var onBox = gMouseOnBox(x,y,gButtonSize,gButtonSize) && !gMouseDragged
			gl1.imageDraw(gMouseDown && onBox?gResetButtonDown:gResetButton,x,y,gButtonSize,gButtonSize)
			if(gMouseClicked && onBox) {
				gReset()
				gStateSet('levelstart')
			}
		}

		if(levelIndex < gLevels.length-1 || !gLevelPlayed) {
			var x = gSizeX/2+gSize*2
			var onBox = gMouseOnBox(x,y,gButtonSize,gButtonSize) && !gMouseDragged
			gl1.imageDraw(gMouseDown && onBox?gPlayButtonDown:gPlayButton,x,y,gButtonSize,gButtonSize)
			if(gMouseClicked && onBox) {
				if(gLevelPlayed)levelIndex++
				gLevelPlayed = gLevel = gLevels[levelIndex]
				gTrails = []
				gReset()
				gStateSet('levelstart')
			}
		}
	} else {
		
		gCamX = gYou.x - gSizeX/2/gSize
		gCamY = gYou.y - gSizeY/2/gSize
		
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
			if(!guy.z)gGuyDraw(guy)
		}
		
		gGridDraw(1)
		
		for(var guy of gGuys) {
			if(guy.z)gGuyDraw(guy)
		}
	
		if(gState == 'done') {
			if(gStateLoops > 50) {
				var loops = gStateLoops-50
				var timeBest = (gGrid[0].length-8)/gYou.speedMax/60*1000
				var scoreTime = 1000000 / (1000 + Math.max(timeBest, gPlayTime) - timeBest) |0
				var scoreGates = 1000 * gYou.gateGoods/(gYou.gateGoods+gYou.gateBads) |0
				var scoreCoins = 100 * gYou.coins |0
				var score = scoreTime+scoreGates+scoreCoins
				var y = Math.max(0, gSizeY-loops*4)
				gl1.drawRect(0,y,gSizeX,gSizeY,0xcfe7f77f)
				gl1.drawRect(0,y-2,gSizeX,2,0xb7d2eb7f)
				y+=60
				glText.draw("Time Bonus: "+scoreTime, gSizeX/2,y,1,1)
				y+=30
				glText.draw("[gate]Gates", gSizeX/2,y,1,1)
				y+=20
				glText.draw((scoreGates/10|0)+'% * 10 = '+scoreGates, gSizeX/2,y,1,1)
				y+=30
				glText.draw("[coin]Coins", gSizeX/2,y,1,1)
				y+=20
				glText.draw(gYou.coins+' * 100 = '+scoreCoins, gSizeX/2,y,1,1)
				y+=30
				glText.draw("Total Score:", gSizeX/2,y,1,1)
				y+=20
				glText.draw(score, gSizeX/2,y,2,1)
	
				if(loops > 50) {
					y+=50
					var x = gSizeX/2-gSize
					
					glText.draw((gMobile?"Tap":"Click")+" to continue", gSizeX/2,y,1,1,0xFFFFFF00+Math.abs(Math.sin(gloop.updates/11))*128)
					if(gMouseClicked) {
						gStateSet('leaderboard')
					}
				}
			}
		}
		if(gState == 'title') {
			gl1.drawRect(0,0,gSizeX,gSizeY,0xb7d2eb7f)
			var text = "BORN TO SKI!"
			var scale = 1.4
			var x = gSizeX/2-glText.sizeXGet(text,scale)/2
			for (let i = 0; i < text.length; i++) {
				var y = 25
				var addy = Math.sin(gloop.updates/5+i/2)
				y += addy*4
				glText.draw(text[i], x,y,scale)
				x += glText.sizeXGet(text[i],scale)
			}
			var y = 99
			var sizeX = 66*2,sizeY=38
			for(var level of gLevels) {
				var x = gSizeX/2-sizeX/2
				gl1.drawRect(x,y,sizeX,sizeY)
				glText.draw(level.name+" Slope",gSizeX/2, y+11,1,1)
				
				var onBox = gMouseOnBox(x,y,sizeX,sizeY) && !gMouseDragged
				if(gMouseClicked && onBox) {
					gLevel = level
					gTrails = []
					gReset()
					gStateSet('leaderboard')
					return
				}
				
				y += 66
			}
		}
		if(gState == 'levelstart') {
			gl1.drawRect(0,0,gSizeX,gSizeY,0x33)
			var text = gLevel.name+" Slope"
			var scale = 1.4
			var x = gSizeX/2-glText.sizeXGet(text, scale)/2
			for (let i = 0; i < text.length; i++) {
				var y = 55
				var addy = Math.sin(gloop.updates/5+i/2)
				y += addy*4
				glText.draw(text[i], x,y,scale)
				x += glText.sizeXGet(text[i], scale)
			}
			//glText.draw(gLevel.name+" Slope", gSizeX/2,100,1,1)
			glText.draw((gMobile?"Press":"Click")+" and hold!", gSizeX/2,145,1,1)
			glText.draw("Let go to jump!", gSizeX/2,165,1,1)
			glText.draw("Get ready!", gSizeX/2,222,1,1,0xFFFFFF00+Math.abs(Math.sin(gloop.updates/11))*128)
			if(gMouseDown||location.host=='localhost0') {
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
				gStateSet('levelstart')
			}
			var x = gSizeX/2+gSize
			var y = gSizeY*.5
			var onBox = gMouseOnBox(x,y,gButtonSize,gButtonSize) && !gMouseDragged
			gl1.imageDraw(gMouseDown && onBox?gPlayButtonDown:gPlayButton,x,y,gButtonSize,gButtonSize)
			if(gMouseClicked && onBox) {
				gStateSet('playing')
			}
		}
	
		if(gState != 'done' && gState != 'title') {
			var size=32
			var onBox = gMouseOnBox(4,4,size,size) && !gMouseDragged
			gl1.imageDraw(gMouseDown && onBox?gPauseButtonDown:gPauseButton,4,4,size,size)
			if(gMouseClicked && onBox) {
				if(gState == 'paused') {
					gStateSet('playing')
				} else if(gState == 'playing') {
					gStateSet('paused')
				}
			}
		}
	
		if(gState != 'title') {
			var time = gloop.time - gStartTime - gPauseTimeTotal
			if(gState == 'levelstart') {
				time = 0
			} else if(gState == 'paused') {
				time -= gloop.time - gPauseTime
			} else if(gState == 'done') {
				time = gPlayTime
			} else if(gState == 'playing') {
				gPlayTime = time
			}
			var sec = time/1000 | 0
			var min = sec/60 | 0
			sec = sec % 60 + ''
			if(sec.length<2)sec='0'+sec
			glText.draw(min+":"+sec, gSizeX/2, 2, 2, 1)
		
			//gl1.imageDraw(gTileKindsById['>good'].image,gSizeX-32,1)
			glText.draw("[gate]"+gYou.gateGoods, gSizeX-6, 3, 1, 3)
		
			//gl1.imageDraw(gTileKindsById.c.image,gSizeX-19,19)
			glText.draw("[coin]"+gYou.coins, gSizeX-6, 18, 1,3)
		}
	}
	
	var x = gState=='playing'||gState=='title'||gState=='paused'?0: -gloop.updates%gCloudImage.sizeX
	while(x<gSizeX) {
		gl1.imageDraw(gCloudImage,x,gTilesY*gSize-13)
		x += gCloudImage.sizeX
	}
	
	gl1.render()

	gMouseClicked = gMouseHit = gMouseReleased = 0
}

var glLoaded = () => {
	gMusic = gSoundLoad("rock.mp3")
	gMenuMusic = gSoundLoad("menu.mp3?2")
}

var gGuyDraw = (guy) => {
	gl1.imageDraw(gPlayerShadowImage, (guy.x-gCamX)*gSize, (guy.y-gCamY)*gSize+7)
	var image = guy.z||~~guy.frame==1 ? gPlayerImage2:gPlayerImage
	var add = guy.fell ? Math.floor(Math.sin(guy.fell/4*gPi)*22) : 0
	image.rgb = 0xFFFFFF7F+add
	gl1.imageDraw(image, (guy.x-gCamX)*gSize, (guy.y-gCamY)*gSize - (guy.z*7))
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
	w.gSnowRImage = gl1.imageMake(16,0,8,16)
	w.gPathLImage = gl1.imageMake(16+8,0,8,16)
	
	
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
	w.gBackButton = gl1.imageMake16(12, 3)
	w.gBackButtonDown = gl1.imageMake16(13, 3)

	var kind = {id:' ', name:'path',texX:2.5,texY:2.5}
	gTileKinds.push(kind)
	var kind = {id:'.', name:'snow',texX:0,texY:0}
	gTileKinds.push(kind)
	var kind = {id:'t', name:'treesmall',texX:6,texY:2,solid:1,offsetY:-3}
	gTileKinds.push(kind)
	var kind = {id:'T', name:'treebig',texX:6,texY:0,texSizeY:2,solid:1,offsetY:-15}
	gTileKinds.push(kind)
	var kind = {id:'r', name:'rock',texX:9,texY:6,solid:1}
	gTileKinds.push(kind)
	var kind = {id:'=', name:'finishline',texX:5,texY:4}
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

	glText.iconAdd("coin", gTileKindsById.c.image, 1)
	glText.iconAdd("gate", gTileKindsById['>good'].image)
	
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
		gMusicPlayTry(1)
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
		
		gMusicPlayTry(1)
		
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
		
		gMusicPlayTry()
		
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
		
		gMusicPlayTry()
	})
	
	addEventListener("keyup", e => {
		var c = e.keyCode
		gKeyDown[c] = 0
		gKeyReleased[c] = 1
	})

	gLevelsSetup()

	w.gSoundHit = gSoundLoad([300,200,.05,.02,.02])
	w.gSoundCoin = gSoundLoad([400, 400, .05, .01, .01,  650, 650, .2, .01, .16])
	w.gSoundGateGood = gSoundLoad([300, 300, .05, .01, .01,  400, 400, .05, .01, .01,  500, 500, .05, .01, .01,])
	w.gSoundGateBad = gSoundLoad([202,202,.1,.01,.02, 202,202,.1,.01,.02])
	w.gSoundWin = gSoundLoad([202,202,.1,.01,.02, 262,262,.1,.01,.02, 402,402,.1,.01,.02, 502,502,.1,.01,.02, 602,602,.2,.01,.02, 552,552,.2,.01,.02, 652,652,.3,.01,.02])
	onresize()

	gReset()
	
	gloop.start(gGameUpdate, gGameDraw)
}

var gLevelsSetup = () => {
	var level = {}
	gLevels.push(level)
	level.name = "Woods"
	level.grid = `
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTTT>    TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT    <TTTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTtTTT>   TTTTTT
TtTTTT      TTTTTT
tTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTtT
TTTTTT      TTTTTT
TTTTTT   <TTTTTTTT
TTTTTT      TTTTTT
TTTTtT      TTtTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTTTTT>  TTTTTT
TTTTTTT     TTTTTT
TTTtTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TtTTTT      TTTTTT
TTTTTT      TTTTTT
TtTTTT      TTTTTT
TTTTTT  <TTTTTttTT
TTTTTT    TTTTTTTT
TTTTTT      TtTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTTTTTT> TTTTTT
TTTTTTTTTTt TTTTTT
TTTTTTTTTTt TTTTTT
TTTTTTTTTTt TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTTrrrrrrTTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT T    TTTTTT
TTTTTT     TTTTTTT
TTTTTT      TTTTTT
TTTTTT  T   TTTTTT
TTTTTT      TTTTTT
TTTTTTT     TTTTTT
TTTTTT   T  TTTTTT
TTTTTT    T TTTTTT
TTTTTT T    TTTTTT
TTTTTT      TTTTTT
TTTTTT     TTTTTTT
TTTTTT  T   TTTTTT
TTTTTT      TTTTTT
TTTTTT T    TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT    T TTTTTT
TTTTTTT     TTTTTT
TTTTTTTT    TTTTTT
TTTTTTT     TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT  TT  TTTTTT
TTTTTT  TT  TTTTTT
TTTTTT      TTTTTT
TTTTTT    TTTTTTTT
TTTTTT    TTTTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTTT    TTTTTTT
TTTTTTTT  TTTTTTTT
TTTTTTTTT TTTTTTTT
TTTTTTTTT TTTTTTTT
TTTTTTTTT TTTTTTTT
TTTTT     TTTTTTTT
TTTTT     TTTTTTTT
TTTTT     TTTTTTTT
TTTTT     TTTTTTTT
TTTTT     TTTTTTTT
TTTTT     TTTTTTTT
TTTTT  <  TTTTTTTT
TTTTT     TTTTTTTT
TTTTT     TTTTTTTT
TTTTT      TTTTTTT
TTTTT   >  TTTTTTT
TTTTT      TTTTTTT
TTTTT      TTTTTTT
TTTTT      TTTTTTT
TTTTT      TTTTTTT
TTTTT   <  TTTTTTT
TTTTT      TTTTTTT
TTTTT     TTTTTTTT
TTTTT     TTTTTTTT
TTTTT <    TTTTTTT
TTTTT      TTTTTTT
TTTTT     TTTTTTTT
TTTTT     TTTTTTTT
TTTTT     TTTTTTTT
TTTTT     TTTTTTTT
TTTTT     TTTTTTTT
TTTTT     TTTTTTTT
TTTTT     TTTTTTTT
TTTTT     TTTTTTTT
TTTTT   c TTTTTTTT
TTTTT     TTTTTTTT
TTTTT c   TTTTTTTT
TTTTT    cTTTTTTTT
TTTTT     TTTTTTTT
TTTTTc    TTTTTTTT
TTTTT     TTTTTTTT
TTTTT  c  TTTTTTTT
TTTTT     TTTTTTTT
TTTTT    cTTTTTTTT
TTTTT     TTTTTTTT
TTTTT     TTTTTTTT
TTTTT     TTTTTTTT
TTTTT     TTTTTTTT
TTTTT     TTTTTTTT
TTTTT=====TTTTTTTT
TTTTT     TTTTTTTT
TTTTT     TTTTTTTT
TTTTT     TTTTTTTT
TTTTT     TTTTTTTT
TTTTTTTTTTTTTTTTTT
TTTTTTTTTTTTTTTTTT
TTTTTTTTTTTTTTTTTT
TTTTTTTTTTTTTTTTTT
TTTTTTTTTTTTTTTTTT
TTTTTTTTTTTTTTTTTT
TTTTTTTTTTTTTTTTTT
TTTTTTTTTTTTTTTTTT
TTTTTTTTTTTTTTTTTT
TTTTTTTTTTTTTTTTTT
TTTTTTTTTTTTTTTTTT
TTTTTTTTTTTTTTTTTT
TTTTTTTTTTTTTTTTTT
`
	
	var level = {}
	gLevels.push(level)
	level.name = "Rocky"
	level.grid = `
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTrrTT      TTTTTT
TTTrTT      TTTTTT
TTTTTT      TrTTTT
TTTTTT      TrTTrT
TTTTTT r r rTTTTrT
TTTTTTcrcrcrTTTTTT
TTTTrT      TTTTTT
TTTTrT      TTTTTT
TTTrrT      TTTTTT
TTTTrT      TTTTTT
TTTTTTr r r TTTTTT
TTTTTTrcrcrcTTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT r    TTTrrT
TTTTTT      TTrTTT
TTTTTT      TTTTTT
TTTTTT c r cTTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTrTTT     rTTTTTT
TTTrrT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT  r   TrTTTT
TTTTTT      TrTrTT
TTTrTT      TTTTrT
TTTTTT      TTTTTT
TTTTTT    r TTTTTT
TTTTrT      TTTTTT
TTTTTT      TTTTTT
TTTTTTr   r TTTTTT
TTrTTT  r   TTTTTT
TTTrTT     rTTTTTT
TTrTTTr     TTTTTT
TTTTTT   rr TTTTTT
TTTTTT      TTTTTT
TTTrTT rr  rTTTTTT
TTTTTT  r  rTTTTTT
TTTTTTr   rrTTTTTT
TTTTTTrr rrrTTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT   <  TTTTTT
TTTTTT >    TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTrTTT      TTTTTT
TTTTTT      TTrTTT
TTTTTT      TTTrTT
TTTTTT       TTTTT
TTTTTTrrrrrrrTrTTT
TTTrrT......TTTrTT
TTTTTT    c TTTTTT
TTTTTT    c TTTTTT
TTTTTT      TTTTTT
TTTTTT c    TTTTTT
TTTTTTc     TTTTTT
TTTTTTrrrrrrTrTTTT
TTTTrTc     TTrTTT
TTTTrTrrrrrrTrrTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTrTT  TTTTTTTT
TTTTTTTT  TrTTTTTT
TTTTTTTT  TTTTTTTT
TTTTTTTT  TTTTTTTT
TTTTTTTT  TTTTTTrT
TTTTTTTT  TTTTTTTT
TTTTTTTTrrTTTTTTTT
TTTTTrTT  TTTrTTTT
TTTTTTTTccTTTTTTTT
TTTTTTTT  TTTTTTTT
TTrTTTTT  TTTTTTTT
TTTTTTTTrrTTTTTTTT
TTTTTTTTccTTTTTTTT
TTTTTTTTccTTTTTTTT
TTTTTTTTccTTTTTTTT
TTTTrTTTrrTTTTTTTT
TTTTTTTT  TTTTTTTT
TTTTTTTT  TTTTTTTT
TTTTTTTT  TTTTTTTT
TTTTTTTT  TTTTTTTT
TTTTTTTT  TTTTTTTT
TTTTTTTT  TTTTTTTT
TTTTTTTT  TTTTTTTT
TTTTTTTT  TTTTTTTT
TTTTTTTTccTTTTTTTT
TTTTTTTTccTTTTTTTT
TTTTTTTTccTTTTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TrTTTT
TTTTTT      TrTrTT
TTTTTT      TTTTTT
TTTTTT       TTTTT
TTTTTT         TTT
TTTTTTrrrrrrT  TTT
TTTTTTrrrrrrTT TTT
TTTTTTrrrrrrTT TTT
TTTTTTrrrrrrTT TTT
TTTTTTrrrrrrTT TTT
TTTTTTrrrrrr   TTT
TTTTTT         TTT
TTTTTT       TTTTT
TTTTT       TTTTTT
TTTTT       TTTTTT
TTrTT      rTTTTTT
TrrTT       TTTTTT
TTTTT       TTTTTT
TTTTT       TTTTTT
TTTTT       TTTTTT
TTTTTrrrr>  TTTTTT
TTTTrrr     TTrrTT
TTTTT       TTTTTT
TTTTT       TTTrTT
TTTTT       TTTTTT
TTTTT   r   TTTTrT
TrrTT       TTTTTT
TTTTT      rTTTTTT
TTTTT  <rrrrTTTTTT
TTTTT    rrrTTTTTT
TTTTT     rrTTTTTT
TTTTT      rTTTTTT
TTTTrr     rTTTTTT
TTTTT       TTTTTT
TTTTT       TrTTTT
TTTTT r     TTTTTT
TTTTT       TTTTTT
TrTTT       TTTTTT
TTTTT  r    TTTrTT
TTTTT       TTTTTT
TTTTT       TTTTTT
TTTTT   r   TTTTTT
TTTrT       TTTTTT
TTTTT       TTTTTT
TTTTT    r  TTTTTT
TTTrT       TTTTTT
TTTTT       TTTTTT
TTTTT     r TTTTTT
TTTrT       TTrTTT
TTTTT       TrTTTT
TTTTT      rTrTTTT
TTTTT=====TTTTTTTT
TTTTT     TTTTTTTT
TTTTT     TTTTTTTT
TTTTT     TTTTTTTT
TTTTT     TTTTTTTT
TTTTTTTTTTTTTTTTTT
`

	
	var level = {}
	gLevels.push(level)
	level.name = "Snowy"
	level.grid = `
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTTT      TTTTTT
TTTTT        TTTTT
TTTT          TTTT
TTT            TTT
TT              TT
T              ..T
T              ..T
T              ..T
T              ..T
T              ..T
T             ...T
T           .....T
T         ......tT
T       <.......TT
T      .......T.TT
T     ...........T
T.    .....T.....T
T..    ..........T
T...       ......T
T....         ...T
T...T...       ..T
T..........      T
T.........>      T
T.......         T
T.....           T
T       .........T
T    ............T
T   .<......T...TT
T  .............tT
T  .............tT
T   ............tT
T    ...........tT
T     ...........T
T      ..........T
T         ....T..T
T...         ....T
T..........      T
T........T..     T
T.........       T
T.....         ..T
T....        ....T
T...       ......T
T...      .......T
T...   < ........T
T...    .........T
T...    .........T
T...    .........T
T...    .........T
T...    .........T
T...    .........T
T...    .........T
T...    .........T
T...    .........T
T...          ...T
T...            .T
T...TTTTT..      T
T...TTttTT.      T
T.......        .T
T...            .T
T..T    ....   ..T
T .   ...........T
T     ...........T
T.    ...........T
T..  c...........T
T..   c..........T
T..    c.........T
T..      ........T
T..      ........T
T..        ....TTT
T.......        TT
T..........     tT
T............    T
T.............   T
T.............   T
T.............   T
TT............   T
T.T...........   T
T.............   T
T.............rrrT
T.............   T
T.............   T
TT............   T
T.............   T
T.............   T
T............    T
T...........     T
T...........     T
T...........     T
T...........     T
T...........     T
T...........     T
T...........     T
TT..........     T
TTT.........    TT
TTTT.          TTT
TTTTT=====TTTTTTTT
TTTTT     TTTTTTTT
TTTTT     TTTTTTTT
TTTTT     TTTTTTTT
TTTTT     TTTTTTTT
TTTTTTTTTTTTTTTTTT
TTTTTTTTTTTTTTTTTT
TTTTTTTTTTTTTTTTTT
TTTTTTTTTTTTTTTTTT
TTTTTTTTTTTTTTTTTT
TTTTTTTTTTTTTTTTTT
`

	
	gLevel = gLevels[1]
}


var gReset = () => {
	gYou.x = 9
	gYou.y = 4
	gYou.z = 0
	gYou.speed = 0
	gYou.speedMax = .11
	gYou.angle = 1.57
	gYou.frame = 0
	gYou.trailY = 0
	gYou.gateGoods = 0
	gYou.gateBads = 0
	gYou.done = 0
	gYou.coins = 0
	gJumped = 0
	gPauseTime = gPauseTimeTotal = 0
	
	var grid = gLevel.grid.split('\n')
	grid.pop()
	grid.shift()
	for (let x=0; x<=grid[0].length+1; x++) {
		gGrid[x] = []
	}
	
	for(var y=0; y<grid.length; y++) {
		var row = 'T'+grid[y]+'T'
		for (let x=0; x<row.length; x++) {
			gGrid[x][y] = gTileKindsById[row[x]]
		}
	}

	if(gTrails.length > 999) {
		gTrails = []
	}
	
}

