var glText = {
	letters: `abcdefghijklmnopqrstuvwxyz!?.,'"+-[]&@#$%:/\\<>=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`,
	iconsByName: {},
	iconsByCode: {},
	letterImages: [],
	setup: function() {
		var x=0,y=460
		for(var i=0; i<this.letters.length; i++)
		{
			var letter = this.letters[i]
			if(letter == 'A')
			{
				x = 0
				y += 17
			}
			var size = this.sizeXGet(letter, 1)
			this.letterImages[letter.charCodeAt(0)] = gl1.imageMake(x, y, size, 16)
			x += size+1
		}
	},
	iconAdd: function(name, x, y, sizeX, sizeY) {
		var code = String.fromCharCode(226+Object.keys(this.iconsByName).length)
		this.iconsByCode[code] = this.iconsByName[name] = {
			image: gl1.imageMake(x,y,sizeX,sizeY),
			code,
			sizeX,
			sizeY
		}
	},
	letterSizeXget: function(letter, scale) {
		size = this.letterSizeXBaseGet(letter)
		return Math.ceil(size*scale)
	},
	letterSizeXBaseGet: function(letter) {
		var icon = this.iconsByCode[letter]
		if(icon) return icon.sizeX+2
		if(letter=='l' || letter=='!' || letter=='.' || letter=="'") return 5
		if(letter=='i' || letter==',') return 6
		if(letter==":") return 7
		if(letter=='Q') return 11
		if(letter==' ') return 7
		if(letter=='m' || letter=='w' || letter=='M' || letter=='W') return 12
		return 9
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
		x = ~~x
		y = ~~y
		scale = scale || 1
		text = ''+text
		text = this.iconsConvert(text)
		
		var texts = text.split('\n')
		var startX = x
		if(center == 2)
		{
			y -= 7*Math.floor(scale)*texts.length | 0
			if(text == text.toUpperCase())
				y += 1*scale|0
		}
		
		rgb = rgb || 0xFFFFFF7F
		for(var text of texts)
		{
			var rgbnow = rgb
			
			var iconyadd = scale*3-5 | 0
			if(scale==1.5)iconyadd-=3
			
			if(center)
			{
				this.drawSizeX = this.sizeXGet(text,scale,1)
				x -= this.drawSizeX/(center==3 ? 1: 2) | 0
			}
			
			for(var i=0; i<text.length; i++)
			{
				var letter = text.charAt(i)
				var code = letter.charCodeAt(0)
				var image = this.letterImages[code]
				var addy = 0
				if(image)
				{
					image.rgb = rgbnow
					if(letter == ',')addy=3
					if(scale >= 2)
					{
						gl1.imageDraw(image, x-(letter=='j')*3*scale, y+addy, image.sizeX*(scale), image.sizeY*(scale))
					}
					else
						gl1.imageDraw(image, x, y+addy)
				}
				else
				{
					var icon = this.iconsByCode[letter]
					if(icon) {
						icon.image.rgb = rgbnow
						gl1.imageDraw(icon.image, x, y-2*scale, icon.sizeX*scale, icon.sizeY*scale)
					}
				}
				x += (this.sizeXGet(letter,scale)-Math.floor(scale)*1) | 0
			}
			this.drawX = x
			y += 16*scale | 0
			if(scale>1 && scale<2)y-=5
			x = startX
		}
	}
}