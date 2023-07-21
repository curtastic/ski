var glText = {
	letters: `0123456789:_ABCDEFGHIJKLMNOPQRSTUVWXYZ!#$%+-*/=.`,
	iconsByName: {},
	iconsByCode: {},
	letterImages: [],
	setup: function() {
		var x=0, y=7
		for(var i=0; i<this.letters.length; i++) {
			var letter = this.letters[i]
			this.letterImages[letter.charCodeAt(0)] = gl1.imageMake16(x, y)
			x++
			if(x > 11) {
				x = 0
				y++
			}
		}
	},
	iconAdd: function(name, imageOrX, y, sizeX, sizeY) {
		var code = String.fromCharCode(226+Object.keys(this.iconsByName).length)
		var icon = {code}
		if(imageOrX.sizeX) {
			icon.image = imageOrX
			icon.offsetY = y||-1
			icon.sizeX = imageOrX.sizeX
			icon.sizeY = imageOrX.sizeY
		} else {
			icon.image = gl1.imageMake(imageOrX,y,sizeX,sizeY)
			icon.sizeX = sizeX
			icon.sizeY = sizeY
			icon.offsetY = -1
		}
		this.iconsByCode[code] = this.iconsByName[name.toUpperCase()] = icon
	},
	letterSizeXget: function(letter, scale) {
		size = this.letterSizeXBaseGet(letter)
		return Math.ceil(size*scale)
	},
	letterSizeXBaseGet: function(letter) {
		var icon = this.iconsByCode[letter]
		if(icon) {
			return icon.sizeX
		}
		return 11+(letter=='U'||letter=='M')-(letter==' '||letter=='I'||letter=='!'||letter==':')*2
	},
	sizeXGet: function(text, scale, convertedAlready) {
		if(!convertedAlready) text = this.iconsConvert(text)
		text += ''
		scale = scale || 1
		var spacing = -1*(Math.floor(scale))
		var x = 0
		for(var i=0; i<text.length; i++)
		{
			var letter = text.charAt(i)
			var size = this.letterSizeXget(letter, scale)
			x += size+spacing
		}
		
		return x-spacing
	},
	iconsConvert: function(text) {
		for(var name in this.iconsByName) {
			text = text.replaceAll('['+name+']', this.iconsByName[name].code)
		}
		return text
	},
	draw: function(text, x, y, scale, center, rgb, rgbfix) {
		text = (text+'').toUpperCase()
		x = ~~x
		y = ~~y
		scale = scale || 1
		text = ''+text
		text = this.iconsConvert(text)
		
		var texts = text.split('\n')
		var startX = x
		if(center == 2) {
			y -= 7*Math.floor(scale)*texts.length | 0
		}
		
		rgb = rgb || 0xFFFFFF7F
		for(var text of texts) {
			var rgbnow = rgb
			
			var iconyadd = scale*3-5 | 0
			
			if(center) {
				this.drawSizeX = this.sizeXGet(text,scale,1)
				x -= this.drawSizeX/(center==3 ? 1: 2) | 0
			}
			
			for(var i=0; i<text.length; i++) {
				var letter = text.charAt(i)
				var code = letter.charCodeAt(0)
				var image = this.letterImages[code]
				var addy = 0
				if(image) {
					image.rgb = rgbnow
					if(letter == ',')addy=3
					if(scale != 1) {
						gl1.imageDraw(image, x-(letter=='j')*3*scale, y+addy, image.sizeX*(scale), image.sizeY*(scale))
					} else
						gl1.imageDraw(image, x, y+addy)
				} else {
					var icon = this.iconsByCode[letter]
					if(icon) {
						icon.image.rgb = rgbnow
						gl1.imageDraw(icon.image, x, (y+icon.offsetY)*scale, icon.sizeX*scale, icon.sizeY*scale)
					}
				}
				x += (this.sizeXGet(letter,scale)-scale) | 0
			}
			this.drawX = x
			y += 16*scale | 0
			x = startX
		}
	}
}