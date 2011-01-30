/* Edible Charts
 * By Andy Hattemer http://www.scriptedlife.com
 * MIT Licensed.
 */
 
//HEX TO RGB FUNCTIONS
function cutHex(h) {return (h.charAt(0)=="#") ? h.substring(1,7):h}
function hexToR(h) {return parseInt((cutHex(h)).substring(0,2),16);}
function hexToG(h) {return parseInt((cutHex(h)).substring(2,4),16);}
function hexToB(h) {return parseInt((cutHex(h)).substring(4,6),16);}
function getR(rgb) {return parseInt(rgb.match(/\((\d+), ?(\d+), ?(\d+)/)[1]); }
function getG(rgb) {return parseInt(rgb.match(/\((\d+), ?(\d+), ?(\d+)/)[2]); }
function getB(rgb) {return parseInt(rgb.match(/\((\d+), ?(\d+), ?(\d+)/)[3]); }

var Chart = Class.extend({
	init: function(canvas_name, options){
				
		this.opt = options.params || {};
		this.series = options.series || {};
		this.catAx = options.catAxis || {};
		this.metAx = options.metAxis || {};
		
   		//CANVAS SETUP
		this.canvas = document.getElementById(canvas_name);
		this.ctx = this.canvas.getContext("2d");
		this.ctx.lineCap = "round";
		this.opt.ch = parseInt(this.canvas.getAttribute("height"), 10);
		this.opt.cw = parseInt(this.canvas.getAttribute("width"), 10);
		
		//INDIVIDUAL CONFIGURATION OPTIONS
		options = null;
  		this.opt.title = this.opt.title || '';
  		this.opt.subtitle = this.opt.subtitle || '';	
		this.opt.margin = this.opt.margin || 20;		//optionally defines all margins at once
		this.opt.marginX = this.opt.marginX || this.opt.margin;
		this.opt.marginY = this.opt.marginY || this.opt.margin;
		this.opt.minigap = this.opt.minigap || 2;		//gap between grouped bars or columns
		this.opt.maxigap = this.opt.maxigap || 10;	//gap between pie slices, bar or column groups, etc...
		this.opt.three_d = this.opt.three_d || 4;		//"3Dness" (depth) of a chart, when available
		if(this.opt.three_d > this.opt.maxigap){ this.opt.three_d = this.opt.maxigap-1; }
		this.opt.shadow = this.opt.shadow || 10;		//blurry dropshadow drawn behind certain shapes
		this.opt.sort = this.opt.sort || -1;		//if set, the nth category is sorted, and everything else follows
		this.opt.stack = this.opt.stack || 0;		//set to 1 means chart will try to be stacked (area, bar, column, streamgraph)
		this.opt.animate = (this.opt.animate+1)%2 || 0;   //animation counter, (goes from zero to 1) in parameters 0 means no animation, 1 = default
		this.opt.animate_2 = (this.opt.animate_2+1)%2 || this.opt.animate;   //fancier charts use this for two-stage animation
		this.opt.speed = this.opt.speed || 10;		//speed defines how quickly animate increments
		this.opt.labelspace = this.opt.labelspace || 50;   //padding for axis labels on some charts
		this.opt.titlespace = this.opt.titlespace || 20;   //padding for title on all charts
		this.mtrack = "";
		this.pal = [
			[[0, 160, 176], [106, 74, 60], [204, 51, 63], [235, 104, 65], [237, 201, 81], [100, 54, 132]],
			[[131,104,213], [23,158,221], [143,215,39], [238,208,42], [246,154,32], [245,42,31], [120,118,121], [226,226,226]],
			[[40,40,40], [110,110,110], [170,170,170], [70,70,70], [140,140,140]]
			];
		this.opt.pal_id = 1;		//default to the second (above) palette feat. 8 colors, later add in more colors and smart palette choosing
		this.opt.cw_w = this.opt.cw-(this.opt.marginX*2)-15;   //available horizontal working area
		this.opt.ch_w = this.opt.ch-(this.opt.marginY*2)-this.opt.titlespace-this.opt.three_d;   //available vertical working area
		this.opt.startX = this.opt.marginX;		//where to start X
		this.opt.smooth = this.opt.smooth || 0;		//smoothing is available for line, area, and streamgraphs (see below)
		
		//SET MAX/MINS
		this.opt.max = -9999999999;
		this.opt.min = 9999999999;
		this.opt.seriesMax = 0;
		this.opt.cmax = this.opt.max;
		this.opt.cmin = this.opt.min;
		var serlen = this.series.length, i;
		this.opt.categoryTotals = [];			//sum of columns
		this.opt.seriesTotals = [];				//sum of rows
		this.opt.categoryTotals_split = [[],[]];	//streamgraphs require alternating column sums (top and bottom halves)
		for(i=0; i<serlen; i++) {
			this.opt.seriesTotals[i] = 0;
			this.series[i].color = this.series[i].color || 'rgb(' + this.pal[this.opt.pal_id][i][0] + ', ' +  this.pal[this.opt.pal_id][i][1] + ', ' +  this.pal[this.opt.pal_id][i][2] + ')';		//series can optionally have colors defined in parameters
			var dlen = this.series[i].data.length, j;
			if(dlen > this.opt.seriesMax) { this.opt.seriesMax = dlen; };
			for(j=0; j<dlen; j++) {
				this.opt.seriesTotals[i] += this.series[i].data[j];
				this.opt.categoryTotals[j] = this.opt.categoryTotals[j]+this.series[i].data[j] || this.series[i].data[j];
				if(i === serlen-1) {
					this.opt.categoryTotals_split[0][j] = this.opt.categoryTotals_split[0][j]+(this.series[i].data[j]/2) || (this.series[i].data[j]/2);
					this.opt.categoryTotals_split[1][j] = this.opt.categoryTotals_split[1][j]+(this.series[i].data[j]/2) || (this.series[i].data[j]/2);
				} else {
					this.opt.categoryTotals_split[i%2][j] = this.opt.categoryTotals_split[i%2][j]+this.series[i].data[j] || this.series[i].data[j];
				}
				if(this.series[i].data[j] > this.opt.max) {
					this.opt.max = this.series[i].data[j];
				}
				if(this.series[i].data[j] < this.opt.min) {
					this.opt.min = this.series[i].data[j];
				}
			}
		}
		
		//SET CATEGORY MAX MINS
		var clen = this.opt.categoryTotals.length, j;
		for(j=0; j<clen; j++) {
			if(this.opt.categoryTotals[j] > this.opt.cmax) {
				this.opt.cmax = this.opt.categoryTotals[j];
			}
			if(this.opt.categoryTotals[j] < this.opt.cmin) {
				this.opt.cmin = this.opt.categoryTotals[j];
			}
		}
		
		//sort requires sort is set to a number less than the number of series
		if(this.opt.sort >= 0 && this.opt.sort < serlen) {
			//SORT DATA BY SERIES IDENTIFIED IN this.opt.sort
			var tsort = this.series[this.opt.sort].data.slice();
			var tslen = tsort.length;
			var tskey = {};
			for(i=0; i<tslen; i++) {
				tskey[tsort[i]] = i;
			}
			tsort.sort(function(a,b){ return a - b; });
			var scopy =[];
			var tsct = tslen-1;
			var tsslen = this.series.length;
			//MAKE SORTED COPIES
			for(i=0; i<tslen; i++) {
				//SORT CATEGORIES
				if(typeof(this.catAx.categories) == "object"){
					scopy[i] = this.catAx.categories[tskey[tsort[tsct]]];
				}
				//SORT SERIES
				for(j=0; j<tsslen; j++) {
					scopy[i+(tslen*(j+1))] = this.series[j].data[tskey[tsort[tsct]]];
				}
				tsct--;
			}
			//OVERWRITE SORTS
			if(typeof(this.catAx.categories) == "object"){
				this.catAx.categories = scopy.slice(0,tslen);
			}
			for(j=0; j<tsslen; j++) {
				this.series[j].data = scopy.slice(tslen*(j+1), tslen*(j+2));
			}
		}
		
		//SWAP AXES IF METRICS ON BOTTOM
		if(this.opt.categories_on_side) {
			var temp = this.catAx.title;
			this.catAx.title = this.metAx.title;
			this.metAx.title = temp;
		}
		
		//SORT BY SERIES IF SET (FOR AREA OR STREAMGRAPH)
		if(this.opt.sort_by_series && !this.opt.stack) { this.sortBySeries();}
		
		//SMOOTHING STUFF
		this.opt.increment = this.opt.cw_w/(this.opt.seriesMax-1);
		this.opt.smooth_amount = this.opt.smooth_amount || 4;
		if(this.opt.smooth_amount < 2) {this.opt.smooth_amount = 2;}
		
		if(this.opt.smooth) {
			var stackAdd = [];
			var tmax = this.opt.max;
			if(this.opt.stack) {tmax = this.opt.cmax;}
			var tot_len = this.series.length, i;
			for(i=0; i<tot_len; i++) {
				var ind_len = this.series[i].data.length, j;
				stackAdd[0] = stackAdd[0] || 0;
				var prevX = this.opt.startX;
				var prevY = this.opt.ch - this.opt.marginY - ((((this.opt.categoryTotals[0] - stackAdd[0] - this.series[i].data[0])/tmax)* this.opt.ch_w)*this.opt.stack) - ((this.series[i].data[0] / tmax) * this.opt.ch_w);
				if(this.opt.stack) { stackAdd[0] += this.series[i].data[0];}
				//ADD COORDS FOR START POINT BEZIER TO THE CALC ARRAY
				this.series[i].calc = [[prevX-1, prevY, prevX, prevY, prevX+1, prevY]];
				for(j=1; j<ind_len; j++) {
					stackAdd[j] = stackAdd[j] || 0;
					//CALCULATE X AND Y COORDS
					var x = this.opt.startX + (this.opt.increment*j);
					var y = this.opt.ch - this.opt.marginY - ((((this.opt.categoryTotals[j] - stackAdd[j] - this.series[i].data[j])/tmax)* this.opt.ch_w)*this.opt.stack) - ((this.series[i].data[j] / tmax) * this.opt.ch_w);
					//IF NOT ON LAST POINT, CALCULATE NEXT Y COORD
					var nextY = y+(y-prevY);
					if(j != ind_len-1) {
						stackAdd[j+1] = stackAdd[j+1] || 0;
						nextY = this.opt.ch - this.opt.marginY - ((((this.opt.categoryTotals[j+1] - stackAdd[j+1] - this.series[i].data[j+1])/tmax)* this.opt.ch_w)*this.opt.stack) - ((this.series[i].data[j+1] / tmax) * this.opt.ch_w);
					}
					var theta1 = Math.atan((y-prevY)/this.opt.increment);
					var theta2 = Math.atan((nextY-y)/this.opt.increment);
					var angle = (theta1+theta2)/2;
					this.series[i].calc[j] = [x-(Math.cos(angle)*(this.opt.increment/this.opt.smooth_amount)), y-(Math.sin(angle)*(this.opt.increment/this.opt.smooth_amount)), x, y, x+(Math.cos(angle)*(this.opt.increment/this.opt.smooth_amount)), y+(Math.sin(angle)*(this.opt.increment/this.opt.smooth_amount))];
					if(this.opt.stack) { stackAdd[j] += this.series[i].data[j];}
					prevY = y
				}
			}
		}
		
		//CALCULATE METRIC TICKS
		var tmax = this.opt.max;
		if(this.opt.stack){ tmax = this.opt.cmax;}
		
		this.opt.tick_spacing = 0;
		var minimum = tmax / 5;
	    var magnitude = Math.pow(10, Math.floor(Math.log(minimum) / Math.log(10)));
	    var residual = minimum / magnitude;
	    if (residual > 5){
	        this.opt.tick_spacing = 10 * magnitude;
		} else if (residual > 2){
	        this.opt.tick_spacing = 5 * magnitude;
		} else if (residual > 1){
	        this.opt.tick_spacing = 2 * magnitude;
		} else {
	        this.opt.tick_spacing = magnitude;
		}
		
		//MOUSE TRACKING SETUP
		//this.canvas.onmouseover = function() {this.mouseOver()};
		//this.canvas.onmouseout = function() {this.mouseOut()};
	},
	draw: function(){
		//INCREMENT ANIMATION COUNTERS
		if(this.opt.animate > 0.999) {
			this.opt.animate = 1;
			if(this.opt.animate_2 > 0.999) {
				this.opt.animate_2 = 1;
				if(typeof(this.mtrack) !== "object") {
					clearInterval(this.interval);
					}
			} else {
				this.opt.animate_2 += 0.3;
			}
		} else {
			var adder = (1-this.opt.animate)/this.opt.speed;
			if(adder < .01) {adder = .01; }
			this.opt.animate += adder;
		}
		//CLEAR
		this.ctx.clearRect(0, 0, this.opt.cw, this.opt.ch);
		//TITLE
		this.ctx.textAlign = "center";
		this.ctx.font = "14pt 'Calibri' bold";
		this.ctx.fillStyle = "#333";
		this.ctx.fillText(this.opt.title, this.opt.cw/2, 15);		//SUBTITLE
		this.ctx.font = "10pt 'Calibri'";
		this.ctx.fillStyle = "#666";
		this.ctx.fillText(this.opt.subtitle, this.opt.cw/2, 28);
	},
	mouseOver: function(){
		if(typeof(this.mtrack) !== "object") {
			this.mtrack = [];	//mtrack stores the 
			this.canvas.onmousemove = function(e) { this.mtrack[0] = e.offsetX; this.mtrack[1] = e.offsetY; };
			if(this.opt.animate_2 === 1) {this.interval = setInterval(this.draw, 1000/30); }
		}
	},
	mouseOut: function() {
		if(typeof(this.mtrack) === "object") {
			this.mtrack = "";
			this.canvas.onmousemove = null;
			if(this.opt.animate_2 === 1) { clearInterval(this.interval);  }
		}
	},
	sortBySeries: function() {
		//FOR AREA OR STREAMGRAPH RE-SORT SERIES BY SERIES TOTALS
		var tst = this.opt.seriesTotals.slice();
		var ser = tst.length, i;
		var skeys = {};
		var tmp = [];
		for(i=0;i<ser;i++) {
			skeys[tst[i]] = i;
			tmp[i] = this.series[i];
		}
		tst.sort(function(b,a){ return a - b; });
		for(i=0;i<ser;i++) {
			this.series[i] = tmp[skeys[tst[i]]];
		}
	},
	drawGridlines: function() {	
     	this.ctx.lineWidth = 1;
     	this.ctx.strokeStyle = "rgba(120,120,120,0.6)";
		var tmax = this.opt.max;
		if(this.opt.stack) {tmax = this.opt.cmax;}
     	//horizontal
     	if(this.opt.categories_on_bottom || this.opt.horizontal_ticks) {
           	var i;
           	for(i=0; i<5; i++) {
				var tval = (i+1)*this.opt.tick_spacing;
               	this.ctx.beginPath();
               	this.ctx.moveTo(this.opt.startX, this.opt.titlespace + this.opt.marginY + this.opt.ch_w - (this.opt.ch_w * (tval/tmax)));
               	this.ctx.lineTo(this.opt.cw-this.opt.marginX,  this.opt.titlespace + this.opt.marginY + this.opt.ch_w - (this.opt.ch_w * (tval/tmax)));
               	this.ctx.stroke();
				this.ctx.font = "10pt 'Calibri'";
				this.ctx.fillStyle = "#999";
				this.ctx.fillText(tval, this.opt.cw-this.opt.marginX, this.opt.titlespace + this.opt.marginY + this.opt.ch_w - (this.opt.ch_w * (tval/tmax))-2);
           	}
     	}
		//vertical
		else if(this.opt.categories_on_side || this.opt.vertical_ticks) {
           	var i;
           	for(i=0; i<5; i++) {
				var tval = (i+1)*this.opt.tick_spacing;
               	this.ctx.beginPath();
               	this.ctx.moveTo(this.opt.startX + this.opt.labelspace + (this.opt.cw_w * (tval/tmax)), this.opt.titlespace + this.opt.marginY);
               	this.ctx.lineTo(this.opt.startX + this.opt.labelspace + (this.opt.cw_w * (tval/tmax)), this.opt.titlespace + this.opt.marginY + this.opt.ch_w);
               	this.ctx.stroke();
				this.ctx.font = "10pt 'Calibri'";
				this.ctx.textBaseline = "top";
				this.ctx.fillStyle = "#666";
				this.ctx.fillText(tval, this.opt.startX + this.opt.labelspace + (this.opt.cw_w * (tval/tmax)), this.opt.titlespace + this.opt.marginY + this.opt.ch_w+3);
				this.ctx.textBaseline = "alphabetic";
           	}
     	}
	},
	drawAxes: function() {
		//DRAW AXES
		this.ctx.textAlign = "start";
		this.ctx.lineWidth = 2;
		this.ctx.strokeStyle = "rgb(50,50,50)";
		this.ctx.beginPath(); 
		this.ctx.moveTo(this.opt.cw-this.opt.marginX, this.opt.ch-this.opt.marginY-(this.opt.labelspace*this.opt.categories_on_bottom));
		this.ctx.lineTo(this.opt.marginX + (this.opt.labelspace*this.opt.categories_on_side), this.opt.ch-this.opt.marginY-(this.opt.labelspace*this.opt.categories_on_bottom));
		this.ctx.lineTo(this.opt.marginX + (this.opt.labelspace*this.opt.categories_on_side), this.opt.marginY+this.opt.titlespace);
		this.ctx.stroke();
		//CLEAR RECT BEHIND AXES
		//this.ctx.clearRect(this.opt.marginX + (this.opt.labelspace*this.opt.categories_on_side), this.opt.ch-this.opt.marginY-(this.opt.labelspace*this.opt.categories_on_bottom)+1, this.opt.cw - this.opt.marginX - (this.opt.labelspace*this.opt.categories_on_side), this.opt.marginY+(this.opt.labelspace*this.opt.categories_on_bottom)-1);
		//DRAW LABELS
		this.ctx.font = "10pt 'Calibri'";
		this.ctx.fillStyle = "#666";
		this.ctx.textAlign = "center";
		this.ctx.fillText(this.catAx.title, this.opt.cw/2, this.opt.ch-5);		//X AXIS
		this.ctx.rotate(-Math.PI/2);
		this.ctx.fillText(this.metAx.title, -this.opt.ch/2, 10);		//Y AXIS
		this.ctx.rotate(Math.PI/2);
		if(this.opt.categories_on_side + this.opt.categories_on_bottom > 0) {
			//ITEM LABELS
			this.ctx.font = "11pt 'Calibri'";
			this.ctx.fillStyle = "#333";
			this.ctx.textAlign = "right";
			var catlen = this.catAx.categories.length, i;
			for(i=0; i<catlen; i++) {
				//CALCULATE ANGLED WIDTH ch
				var hhei = this.opt.ch-(this.opt.marginY + this.opt.labelspace)+10;
				var hwid = this.opt.marginX + (i*(this.opt.cw_w/catlen)) + ((this.opt.cw_w/catlen)/2)-(this.opt.maxigap/2);
				if(this.opt.categories_on_side) {
					hhei = this.opt.marginY + this.opt.titlespace + (i*(this.opt.ch_w/catlen)) + ((this.opt.ch_w/catlen)/2)-(this.opt.maxigap/2);
					hwid = (this.opt.marginX + this.opt.labelspace-5);
				}
				var ctxt = this.catAx.categories[i];
				if(ctxt.length > 16) {
					ctxt = ctxt.substr(0, 15) + '…';
				}
				this.ctx.translate(hwid, hhei);
				this.ctx.rotate(-Math.PI/4);
				this.ctx.fillText(ctxt, 0, 0);
				this.ctx.rotate(Math.PI/4);
				this.ctx.translate(-hwid, -hhei);
			}
		}
	}
});

var Pie = Chart.extend({
	init: function(canvas_name, options){
		if(!this.interval) {
			//CALL PARENT
			this._super( canvas_name, options );
			
			//SETTINGS SPECIFIC TO PIE CHARTS
			this.opt.c = [0, (this.opt.ch+this.opt.titlespace)/2];   //the centerpoint of the first pie
			this.opt.r = ((this.opt.cw/2)-(this.opt.margin*1.75))/this.series.length - (this.opt.margin*(this.series.length-1)/2);   //radius
			if(this.opt.r > this.opt.c[1]-this.opt.margin) {
				this.opt.r = this.opt.c[1]-(this.opt.margin*1.75);
			}
			this.opt.increment = Math.PI/50;		//100 vertices
			
			//PRE-CALCULATE GRADIENTS
			this.gradients = {shadow:[], main:[], highlight:[]};
			var serlen = this.series.length, i;
			for(i=0; i<serlen; i++) {
				var dlen = this.series[i].data.length, j;
				this.opt.c[0] = -(this.opt.r+this.opt.margin) + (((this.opt.r*2) + (this.opt.margin*2))*(1+i));
				this.gradients.shadow[i] = [];
				this.gradients.main[i] = [];
				this.gradients.highlight[i] = [];
				
				for(j=0; j<dlen; j++) {
					//SHADOW GRADIENTS
					this.gradients.shadow[i][j] = [];
					this.gradients.shadow[i][j][0] = this.ctx.createRadialGradient(this.opt.c[0]-this.opt.r/2,this.opt.c[1]-this.opt.r/2,10,this.opt.c[0]-this.opt.r/2,this.opt.c[1]-this.opt.r/2,this.opt.r*1.5);
					this.gradients.shadow[i][j][0].addColorStop(0,'rgba(' + Math.round(this.pal[this.opt.pal_id][j][0]*0.6, 0) +',' + Math.round(this.pal[this.opt.pal_id][j][1]*0.6, 0) +',' + Math.round(this.pal[this.opt.pal_id][j][2]*0.6, 0) +',1)');
					this.gradients.shadow[i][j][0].addColorStop(1,'rgba(' + Math.round(this.pal[this.opt.pal_id][j][0]*0.6, 0) +',' + Math.round(this.pal[this.opt.pal_id][j][1]*0.6, 0) +',' + Math.round(this.pal[this.opt.pal_id][j][2]*0.6, 0) +',1)');
					this.gradients.shadow[i][j][1]= this.ctx.createRadialGradient(this.opt.c[0]-this.opt.r/2,this.opt.c[1]-this.opt.r/2,10,this.opt.c[0]-this.opt.r/2,this.opt.c[1]-this.opt.r/2,this.opt.r*1.5);
					this.gradients.shadow[i][j][1].addColorStop(0,'rgba(' + Math.round(this.pal[this.opt.pal_id][j][0]*0.5, 0) +',' + Math.round(this.pal[this.opt.pal_id][j][1]*0.5, 0) +',' + Math.round(this.pal[this.opt.pal_id][j][2]*0.5, 0) +',1)');
					this.gradients.shadow[i][j][1].addColorStop(1,'rgba(' + Math.round(this.pal[this.opt.pal_id][j][0]*0.5, 0) +',' + Math.round(this.pal[this.opt.pal_id][j][1]*0.5, 0) +',' + Math.round(this.pal[this.opt.pal_id][j][2]*0.5, 0) +',1)');
					//MAIN GRADIENT
					this.gradients.main[i][j] = this.ctx.createRadialGradient(this.opt.c[0]-this.opt.r/3,this.opt.c[1]-this.opt.r/1.5,10,this.opt.c[0]-this.opt.r/3,this.opt.c[1]-this.opt.r/1.5,this.opt.r*1.65);
					this.gradients.main[i][j].addColorStop(0,'rgba(' + Math.round(this.pal[this.opt.pal_id][j][0]*1.1, 0) +',' + Math.round(this.pal[this.opt.pal_id][j][1]*1.1, 0) +',' + Math.round(this.pal[this.opt.pal_id][j][2]*1.1, 0) +',1)');
					this.gradients.main[i][j].addColorStop(0.2,'rgba(' + Math.round(this.pal[this.opt.pal_id][j][0]*0.97, 0) +',' + Math.round(this.pal[this.opt.pal_id][j][1]*0.97, 0) +',' + Math.round(this.pal[this.opt.pal_id][j][2]*0.97, 0) +',1)');
					this.gradients.main[i][j].addColorStop(0.9,'rgba(' + Math.round(this.pal[this.opt.pal_id][j][0]*0.8, 0) +',' + Math.round(this.pal[this.opt.pal_id][j][1]*0.8, 0) +',' + Math.round(this.pal[this.opt.pal_id][j][2]*0.8, 0) +',1)');
					this.gradients.main[i][j].addColorStop(1,'rgba(' + Math.round(this.pal[this.opt.pal_id][j][0]*0.7, 0) +',' + Math.round(this.pal[this.opt.pal_id][j][1]*0.7, 0) +',' + Math.round(this.pal[this.opt.pal_id][j][2]*0.7, 0) +',0.99)');
					//HIGHLIGHT GRADIENT
					this.gradients.highlight[i][j] = this.ctx.createRadialGradient(this.opt.c[0], this.opt.c[1]-this.opt.r*4, this.opt.r*3,this.opt.c[0],this.opt.c[1]-this.opt.r*3,(this.opt.r*4.1));
					this.gradients.highlight[i][j].addColorStop(0,'rgba(255,255,255,0)');
					this.gradients.highlight[i][j].addColorStop(0.4,'rgba(255,255,255, 0.1)');
					this.gradients.highlight[i][j].addColorStop(0.405,'rgba(255,255,255,0.0)');
				}
			}
			//MAXIGAP SHOULD BE REDUCED FOR PIE CHARTS
			this.opt.maxigap = this.opt.maxigap/2;
			var _this = this;
			
			this.interval = setInterval(function() {_this.draw();}, 1000/30);
		}
	},
	draw: function(){
	
		// Call the inherited version of draw()
		this._super();
		
		// Draw Pie-Specific Stuff
		var sh_an = this.opt.three_d*this.opt.animate_2;
		var serlen = this.series.length, i;
		
		//DRAW EACH PIECE OF PIE
		for(i=0; i<serlen; i++) {
			var theta = 0;
			var div = this.opt.seriesTotals[i]/(Math.PI*2);
			this.opt.c[0] = -(this.opt.r+this.opt.margin) + (((this.opt.r*2) + (this.opt.margin*2))*(1+i));
			if(serlen === 1) { this.opt.c[0] = this.opt.cw/2; }
			var cen_an = [this.opt.c[0]-sh_an/2, this.opt.c[1]-sh_an];
			var dlen = this.series[i].data.length, j;
			if(this.opt.animate_2 > 0) {
				for(j=0; j<dlen; j++) {
					//SHADOWS
					this.ctx.fillStyle = this.gradients.shadow[i][j][0];
					var temp_offset_center = [cen_an[0] + Math.sin((theta+((this.series[i].data[j]/div)/2))*this.opt.animate)*this.opt.maxigap, cen_an[1] + Math.cos((theta+((this.series[i].data[j]/div)/2))*this.opt.animate)*this.opt.maxigap];
					var cgap = ((this.opt.maxigap/this.opt.r)*(Math.PI/2))/2;
					var t_theta = cgap;
					
					//VERTICAL AREAS SHOULD BE DARKER
					if((theta+t_theta)%Math.PI > Math.PI*0.75 || (theta+t_theta)%Math.PI < Math.PI*0.25) {
						this.ctx.fillStyle = this.gradients.shadow[i][j][1];
					}
					this.ctx.shadowBlur    = this.opt.shadow;
					this.ctx.shadowColor   = 'rgba(0,0,0,0.3)';
					
					//FIRST RECT
					this.ctx.beginPath();
					this.ctx.moveTo(temp_offset_center[0], temp_offset_center[1]);
					this.ctx.lineTo(temp_offset_center[0] + sh_an/2, temp_offset_center[1] + sh_an);
					this.ctx.lineTo(cen_an[0] + sh_an/2 + Math.sin((theta+t_theta))*(this.opt.r), cen_an[1] + sh_an + Math.cos((theta+t_theta))*(this.opt.r));
					this.ctx.lineTo(cen_an[0] + Math.sin((theta+t_theta))*(this.opt.r), cen_an[1] + Math.cos((theta+t_theta))*(this.opt.r));
					this.ctx.fill();
					//ARC
					this.ctx.fillStyle = this.gradients.shadow[i][j][0];
					this.ctx.beginPath();
					this.ctx.moveTo(temp_offset_center[0] + sh_an/2, temp_offset_center[1] + sh_an);
					var finished = 0;
					while(!finished) {
						this.ctx.lineTo(cen_an[0] + sh_an/2 + Math.sin((theta+t_theta))*(this.opt.r), cen_an[1] + sh_an + Math.cos((theta+t_theta))*(this.opt.r));
						t_theta += this.opt.increment;
						if(t_theta > (this.series[i].data[j]/div)-cgap) {
							finished = 1;
							t_theta = (this.series[i].data[j]/div)-cgap;
							this.ctx.lineTo(cen_an[0] + sh_an/2 + Math.sin((theta+t_theta))*(this.opt.r), cen_an[1] + sh_an + Math.cos((theta+t_theta))*(this.opt.r));
						}
					}
					this.ctx.fill();
					//SECOND REC
					if((theta+t_theta)%Math.PI > Math.PI*0.75 || (theta+t_theta)%Math.PI < Math.PI*0.25) {
						this.ctx.fillStyle = this.gradients.shadow[i][j][1];
					}
					this.ctx.beginPath();
					this.ctx.moveTo(temp_offset_center[0], temp_offset_center[1]);
					this.ctx.lineTo(temp_offset_center[0] + sh_an/2, temp_offset_center[1] + sh_an);
					this.ctx.lineTo(cen_an[0] + sh_an/2 + Math.sin((theta+t_theta))*(this.opt.r), cen_an[1] + sh_an + Math.cos((theta+t_theta))*(this.opt.r));
					this.ctx.lineTo(cen_an[0] + Math.sin((theta+t_theta))*(this.opt.r), cen_an[1] + Math.cos((theta+t_theta))*(this.opt.r));
					this.ctx.fill();
					this.ctx.shadowBlur    = 0;
					this.ctx.shadowColor   = 'rgba(0,0,0,0,0)';
					theta += (this.series[i].data[j]/div);
				}
				theta = 0;
			}
			
			for(j=0; j<dlen; j++) {
				this.ctx.fillStyle = this.gradients.main[i][j];
				var temp_offset_center = [cen_an[0] + Math.sin((theta+((this.series[i].data[j]/div)/2))*this.opt.animate)*this.opt.maxigap, cen_an[1] + Math.cos((theta+((this.series[i].data[j]/div)/2))*this.opt.animate)*this.opt.maxigap];
				var cgap = ((this.opt.maxigap/this.opt.r)*(Math.PI/2))/2;
				var t_theta = cgap;
				this.ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
				this.ctx.lineWidth = 1;
				this.ctx.beginPath();
				this.ctx.moveTo(temp_offset_center[0], temp_offset_center[1]);
				var finished = 0;
				while(!finished) {
					this.ctx.lineTo(cen_an[0] + Math.sin((theta+t_theta)*this.opt.animate)*(this.opt.r*this.opt.animate), cen_an[1] + Math.cos((theta+t_theta)*this.opt.animate)*(this.opt.r*this.opt.animate));
					t_theta += this.opt.increment;
					if(t_theta > (this.series[i].data[j]/div)-cgap) {
						finished = 1;
						t_theta = (this.series[i].data[j]/div)-cgap;
						this.ctx.lineTo(cen_an[0] + Math.sin((theta+t_theta)*this.opt.animate)*(this.opt.r*this.opt.animate), cen_an[1] + Math.cos((theta+t_theta)*this.opt.animate)*(this.opt.r*this.opt.animate));
					}
				}
				this.ctx.lineTo(temp_offset_center[0], temp_offset_center[1]);
				this.ctx.fill();
				this.ctx.stroke();
				
				//HIGHLIGHT
				this.fillStyle = 'rgba(255,255,255,0.6)';
				this.ctx.fillStyle = this.gradients.highlight[i][j];
				this.ctx.beginPath(); 
				this.ctx.moveTo(temp_offset_center[0], temp_offset_center[1]);
				t_theta = cgap;
				finished = 0;
				while(!finished) {
					this.ctx.lineTo(cen_an[0] + Math.sin((theta+t_theta)*this.opt.animate)*(this.opt.r*this.opt.animate*0.95), cen_an[1] + Math.cos((theta+t_theta)*this.opt.animate)*(this.opt.r*this.opt.animate*0.95));
					t_theta += this.opt.increment;
					if(t_theta > (this.series[i].data[j]/div)-cgap) {
						finished = 1;
						t_theta = (this.series[i].data[j]/div)-cgap;
						this.ctx.lineTo(cen_an[0] + Math.sin((theta+t_theta)*this.opt.animate)*(this.opt.r*this.opt.animate), cen_an[1] + Math.cos((theta+t_theta)*this.opt.animate)*(this.opt.r*this.opt.animate));
					}
				}
				this.ctx.fill();
				
				theta += (this.series[i].data[j]/div);
			}
			
			for(j=0; j<dlen; j++) {
				//WRITE NUMBER
				var fsize = Math.sqrt(this.opt.r)*1.25;
				if(fsize < 12) { fsize = 12; }
				this.ctx.font = Math.round(fsize) + "pt 'Calibri' bold";
				theta += (this.series[i].data[j]/div);
				var tcenter = theta-((this.series[i].data[j]/div)/2);
				this.ctx.fillStyle = "#FFF";
				this.ctx.textAlign = "center";
				this.ctx.textBaseline = "middle"
				this.ctx.shadowBlur    = 4;
				this.ctx.shadowColor   = 'rgba(0,0,0,0.5)';
				var intxt = this.series[i].data[j];
				var needlabel = true;
				if(this.ctx.measureText(intxt + " - " + this.catAx.categories[j]).width < this.opt.r/1.33) {
					this.ctx.fillText(intxt+ " - " + this.catAx.categories[j], cen_an[0] + Math.sin(tcenter*this.opt.animate)*((this.opt.r*this.opt.animate)/1.75), cen_an[1] + Math.cos(tcenter*this.opt.animate)*((this.opt.r*this.opt.animate)/1.75));
					needlabel = false;
				} else if(this.ctx.measureText(this.catAx.categories[j]).width < this.opt.r/1.33) {
					this.ctx.fillText(intxt, cen_an[0] + Math.sin(tcenter*this.opt.animate)*((this.opt.r*this.opt.animate)/1.5), cen_an[1] + Math.cos(tcenter*this.opt.animate)*((this.opt.r*this.opt.animate)/1.5));
					this.ctx.fillText(this.catAx.categories[j], cen_an[0] + Math.sin(tcenter*this.opt.animate)*((this.opt.r*this.opt.animate)/1.5), cen_an[1] + Math.cos(tcenter*this.opt.animate)*((this.opt.r*this.opt.animate)/1.5)+15);
					needlabel = false;
				} else {
					this.ctx.fillText(intxt, cen_an[0] + Math.sin(tcenter*this.opt.animate)*((this.opt.r*this.opt.animate)/1.5), cen_an[1] + Math.cos(tcenter*this.opt.animate)*((this.opt.r*this.opt.animate)/1.5));
				}
				this.ctx.textBaseline = "alphabetic"
				//WRITE LABEL
				if(needlabel) {
					tcenter -= ((this.series[i].data[j]/div)/4);
					var fsize = Math.sqrt(this.opt.r);
					if(fsize < 10) { fsize = 10; }
					this.ctx.font = Math.round(fsize) + "pt 'Calibri' bold";
					if(tcenter > Math.PI*0.25 && tcenter < Math.PI*0.75) {
						this.ctx.textAlign = "left";
					} else if(tcenter > Math.PI*1.25 && tcenter < Math.PI*1.75) {
						this.ctx.textAlign = "right";
					} else if(tcenter <= Math.PI*0.25 || tcenter >= Math.PI*1.75) {
						//BOTTOM
						this.ctx.textBaseline = "top";
					} else {
						//TOP
						this.ctx.textBaseline = "bottom";
					}
					this.ctx.fillStyle = "rgba(0,0,0,1)";
					this.ctx.shadowBlur    = 4;
					this.ctx.shadowColor   = 'rgba(0,0,0,0.5)';
					this.ctx.shadowColor = 'rgba(255,255,255,0.41)';
					this.ctx.fillText(this.catAx.categories[j], cen_an[0] + Math.sin(tcenter*this.opt.animate)*((this.opt.r*this.opt.animate)*1.2), cen_an[1] + Math.cos(tcenter*this.opt.animate)*((this.opt.r*this.opt.animate)*1.2));
				}
				this.ctx.shadowColor = 'rgba(0,0,0,0)';
				this.ctx.textBaseline = "alphabetic";
				
				//WRITE PIE TITLE
				this.ctx.fillStyle = '#666';
				this.ctx.textAlign = 'center';
				this.ctx.font = "10pt 'Calibri' bold";
				this.ctx.fillText(this.series[i].name + " by " + this.catAx.title, ((this.opt.cw/serlen)*j) + ((this.opt.cw/serlen)/2), this.opt.ch-10);
			}
		}
	}
});

var Bar = Chart.extend({
	init: function(canvas_name, options){
		if(!this.interval) {
			options.params.categories_on_side = 1;
			options.params.categories_on_bottom=0;
			this._super( canvas_name, options );
			
			//INITIALIZE BAR STUFF
			this.opt.cw_w = this.opt.cw-(this.opt.marginX*2)-this.opt.labelspace;
			this.opt.ch_w = this.opt.ch-(this.opt.marginY*2)-this.opt.titlespace-this.opt.three_d;
			
			var _this = this;
			
			this.interval = setInterval(function() {_this.draw();}, 1000/30);
		}
	},
	draw: function(){
		// Call the inherited version of draw()
		this._super();
		//METRICS
		this.drawGridlines();
		//DRAW BAR/COLUMN STUFF
		var active = [];
		var stackX = [];
		var tot_len = this.series.length, i;
		for(i=0; i<tot_len; i++) {
			var ind_len = this.series[i].data.length, j;
			var serspace = this.opt.ch_w/ind_len;
			//TRICK WITH ANIMATE STEPPER TO STAGGER BARS
			var stggr = this.opt.animate*ind_len;
			for(j=0; j<ind_len; j++) {
				//JIGGER WITH ANIMATE
				var animult = 0;
				if(stggr>j/2) {
					animult = stggr/ind_len;
				}
				stackX[j] = stackX[j] || 0;
				var x = this.opt.marginX + this.opt.labelspace + (this.opt.stack*stackX[j]);
				var y = this.opt.marginY + this.opt.titlespace + this.opt.minigap + (j*serspace) + ((1-this.opt.stack)*(i*((serspace-this.opt.maxigap)/tot_len)));
				var w =  this.opt.cw_w * (this.series[i].data[j]/((this.opt.max*((this.opt.stack+1)%2)) + (this.opt.cmax*(this.opt.stack)))) * animult;
				var h = ((serspace-this.opt.maxigap)/((tot_len*((this.opt.stack+1)%2))+(1*this.opt.stack)))-this.opt.minigap;
				stackX[j] += w + this.opt.stack;
				
				this.ctx.fillStyle = this.series[i].color;
				this.ctx.shadowBlur    = this.opt.shadow;
				this.ctx.shadowColor   = 'rgba(0,0,0,0.2)';
				this.ctx.globalAlpha = 0.91;
				//MAIN COLORBOX (SHADOW + BOX)
				this.ctx.beginPath();
				this.ctx.moveTo(x, y);
				if(this.opt.stack) {
					this.ctx.lineTo(x, y+h);
					this.ctx.lineTo(x-this.opt.three_d, y+h+this.opt.three_d);
				} else {
					this.ctx.lineTo(x, y+h+this.opt.three_d);
				}
				this.ctx.lineTo(x+w-this.opt.minigap, y+h+this.opt.three_d);
				this.ctx.lineTo(x+w, y+h);
				this.ctx.lineTo(x+w, y);
				this.ctx.fill();
				this.ctx.shadowColor = 'rgba(0,0,0,0)';
				this.ctx.globalAlpha = 1;
				//GRADIENT SHADOW
				this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
				this.ctx.beginPath();
				this.ctx.moveTo(x, y+h);
				if(this.opt.stack){
					this.ctx.lineTo(x, y+h);
					this.ctx.lineTo(x-this.opt.three_d, y+h+this.opt.three_d);
				} else {
					this.ctx.lineTo(x, y+h+this.opt.three_d);
				}
				this.ctx.lineTo(x+w-this.opt.minigap, y+h+this.opt.three_d);
				this.ctx.lineTo(x+w, y+h);
				this.ctx.fill();
				
				//MAIN SHADOW
				var r2 = Math.sqrt((w*w) + ((w+h)*(w+h)));
				var cstop = h/(r2-w);
				tgrad = this.ctx.createRadialGradient(x+w,y-w,w,x+w,y-w,r2);
				tgrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
				tgrad.addColorStop(cstop, 'rgba(255, 255, 255, 0)');
				tgrad.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
				tgrad.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
				this.ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
				this.ctx.lineWidth = 1;
				this.ctx.fillStyle = tgrad;
				this.ctx.beginPath();
				this.ctx.moveTo(x, y);
				this.ctx.lineTo(x, y+h);
				this.ctx.lineTo(x+w, y+h);
				this.ctx.lineTo(x+w, y);
				this.ctx.lineTo(x, y);
				this.ctx.fill();
				this.ctx.stroke();
				
				//KEY TEXT
				if(active[j]) {
					var fsz = 16;
					if(h+2<fsz) {
						fsz = parseInt(h+2, 10);
					}
					this.ctx.font = fsz + "px 'Calibri' bold";
					this.ctx.textAlign = "right";
					this.ctx.fillStyle = '#FFF';
					var stv = this.series[i].data[j] +" "+ this.series[i].name;
					var pd = -5;
					if(this.ctx.measureText(stv).width > w) {
						this.ctx.fillStyle = '#333';
						this.ctx.textAlign = "left";
						pd = 5;
					}
					this.ctx.fillText(stv, x+w+pd, y+h-1);
				}
			}
		}
		
		//DRAW AXES
		this.drawAxes();
	}
});

var Column = Chart.extend({
	init: function(canvas_name, options){
		if(!this.interval) {
			options.params.categories_on_side = 0;
			options.params.categories_on_bottom=1;
			this._super( canvas_name, options );
			
			//INITIALIZE COLUMN STUFF
			this.opt.cw_w = this.opt.cw-(this.opt.marginX*2)-this.opt.three_d;
			this.opt.ch_w = this.opt.ch-(this.opt.marginY*2)-this.opt.titlespace - this.opt.labelspace;
			
			var _this = this;
			//setTimeout(function() {_this.draw()}, time);
			this.interval = setInterval(function() {_this.draw();}, 1000/30);
		}
	},
	draw: function(){
		// Call the inherited version of draw()
		this._super();
		this.drawGridlines();
		//DRAW COLUMN STUFF
		var active = [];
		var stackX = [];
		var tot_len = this.series.length, i;
		for(i=0; i<tot_len; i++) {
			var ind_len = this.series[i].data.length, j;
			var serspace = this.opt.cw_w/ind_len;
			for(j=0; j<ind_len; j++) {
				stackX[j] = stackX[j] || 0;
				var x = this.opt.marginX + this.opt.minigap + (j*serspace) + ((1-this.opt.stack)*(i*((serspace-this.opt.maxigap)/tot_len)));
				var y = this.opt.ch - this.opt.marginY - this.opt.labelspace - (this.opt.stack*stackX[j]);
				var h =  this.opt.ch_w *(this.series[i].data[j]/((this.opt.max*((this.opt.stack+1)%2)) + (this.opt.cmax*(this.opt.stack)))) * this.opt.animate;
				var w = ((serspace-this.opt.maxigap)/((tot_len*((this.opt.stack+1)%2))+(1*this.opt.stack)))-this.opt.minigap;
				stackX[j] += h + this.opt.stack;
				
				this.ctx.fillStyle = this.series[i].color;
				this.ctx.globalAlpha = 0.91;
				this.ctx.shadowBlur    = this.opt.shadow;
				this.ctx.shadowColor   = 'rgba(0,0,0,0.2)';
				
				//MAIN COLORBOX (SHADOW + BOX)
				this.ctx.beginPath();
				this.ctx.moveTo(x, y);
				this.ctx.lineTo(x, y-h);
				this.ctx.lineTo(x+w-this.opt.minigap, y-h);
				this.ctx.lineTo(x+w-this.opt.minigap+this.opt.three_d, y-h+this.opt.three_d);
				this.ctx.lineTo(x+w-this.opt.minigap+this.opt.three_d, y+this.opt.three_d);
				this.ctx.lineTo(x+w-this.opt.minigap, y);
				this.ctx.fill();
				this.ctx.shadowColor = 'rgba(0,0,0,0)';
				
				this.ctx.globalAlpha = 1;
				
				//GRADIENT SHADOW
				this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
				this.ctx.beginPath();
				this.ctx.moveTo(x+w-this.opt.minigap, y-h);
				this.ctx.lineTo(x+w-this.opt.minigap+this.opt.three_d, y-h+this.opt.three_d);
				this.ctx.lineTo(x+w-this.opt.minigap+this.opt.three_d, y+this.opt.three_d);
				this.ctx.lineTo(x+w-this.opt.minigap, y);
				this.ctx.fill();
				
				//MAIN SHADOW
				var r2 = Math.sqrt((h*h) + ((w+h)*(w+h)));
				var cstop = h/(r2-w);
				tgrad = this.ctx.createRadialGradient(x-h,y-h,h,x-h,y-h,r2);
				tgrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
				tgrad.addColorStop(cstop, 'rgba(255, 255, 255, 0)');
				tgrad.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
				tgrad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
				this.ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
				this.ctx.lineWidth = 1;
				this.ctx.fillStyle = tgrad;
				this.ctx.beginPath();
				this.ctx.moveTo(x, y);
				this.ctx.lineTo(x, y-h);
				this.ctx.lineTo(x+w-this.opt.minigap, y-h);
				this.ctx.lineTo(x+w-this.opt.minigap, y);
				this.ctx.lineTo(x, y);
				this.ctx.fill();
				this.ctx.stroke();
				
				//KEY TEXT
				if(active[j]) {
					var fsz = 16;
					if(h+2<fsz) {
						fsz = parseInt(h+2, 10);
					}
					this.ctx.font = fsz + "px 'Calibri' bold";
					this.ctx.textAlign = "right";
					this.ctx.fillStyle = '#FFF';
					var stv = this.series[i].data[j] +" "+ this.series[i].name;
					var pd = -5;
					if(this.ctx.measureText(stv).width > w) {
						this.ctx.fillStyle = '#333';
						this.ctx.textAlign = "left";
						pd = 5;
					}
					this.ctx.fillText(stv, x+w+pd, y+h-1);
				}
			}
		}
		//DRAW AXES
		this.drawAxes();
	}
});

var Line = Chart.extend({
	init: function(canvas_name, options){
		if(!this.interval) {
			options.params.categories_on_side = 0;
			options.params.categories_on_bottom=0;
			options.params.horizontal_ticks = 1;
			this._super( canvas_name, options );
			var _this = this;
			this.interval = setInterval(function() {_this.draw();}, 1000/30);
		}
	},
	draw: function(){
		// Call the inherited version of draw()
		this._super();
		//METRICS
		this.drawGridlines();
		this.ctx.shadowBlur = Math.round(this.opt.animate_2*this.opt.shadow);
		this.ctx.shadowColor = 'rgba(0,0,0,0.2)';
		this.ctx.lineWidth = Math.round(this.opt.animate_2*3)+1;
		//DRAW LINE
		var tot_len = this.series.length, i;
		for(i=0; i<tot_len; i++) {
			var ind_len = this.series[i].data.length, j;
			this.ctx.strokeStyle = this.series[i].color;
			this.ctx.beginPath();
			this.ctx.moveTo(this.opt.startX, this.opt.ch - this.opt.marginY - ((this.series[i].data[0]/this.opt.max)*this.opt.ch_w));
			for(j=1; j<ind_len*this.opt.animate; j++) {
				if(this.opt.smooth) {
					//bezierCurveTo(2ND BEZ PT X OF LAST COORD, 2ND BEZ PT Y OF LAST COORD, 1ST BEZ PT X OF THIS COORD, 1ST BEZ PT Y OF THIS COORD, THIS COORD X, THIS COORD Y)
					this.ctx.bezierCurveTo(this.series[i].calc[j-1][4], this.series[i].calc[j-1][5], this.series[i].calc[j][0], this.series[i].calc[j][1], this.series[i].calc[j][2], this.series[i].calc[j][3]);
				} else {
					this.ctx.lineTo(this.opt.startX + (this.opt.increment*j), this.opt.ch - this.opt.marginY - ((this.series[i].data[j]/this.opt.max)*this.opt.ch_w));
				}
			}
			this.ctx.stroke();
		}
		this.ctx.shadowColor = 'rgba(0,0,0,0.0)';
		this.ctx.shadowBlur = 0;
		//DRAW AXES
		this.drawAxes();
	}
});

var Area = Chart.extend({
	init: function(canvas_name, options){
		if(!this.interval) {
			options.params.categories_on_side = 0;
			options.params.categories_on_bottom=0;
			options.params.horizontal_ticks = 1;
			options.params.sort_by_series = 1;
			this._super( canvas_name, options );
			
			var _this = this;
			this.interval = setInterval(function() {_this.draw();}, 1000/30);
		}
	},
	draw: function(){
		// Call the inherited version of draw()
		this._super();
		//METRICS
		this.drawGridlines();
		//DRAW AREA-SPECIFIC ELEMENTS
		this.ctx.lineWidth = 1;
		//DRAW LINE
		var stackAdd = [];
		var tmax = this.opt.max;
		if(this.opt.stack) {tmax = this.opt.cmax;}
		var tot_len = this.series.length, i;
		for(i=0; i<tot_len; i++) {
			this.ctx.shadowColor = 'rgba(0,0,0,0)';
			var ind_len = this.series[i].data.length, j;
			stackAdd[0] = stackAdd[0] || 0;
			this.ctx.strokeStyle = this.series[i].color;
			this.ctx.fillStyle = 'rgba' + this.series[i].color.substr(3, this.series[i].color.length-4) + ", " + (1-((i/tot_len)/4)) + ')';
			this.ctx.shadowColor = 'rgba(' + Math.round(getR(this.series[i].color)/2) + ', ' + Math.round(getG(this.series[i].color)/2) + ', ' + Math.round(getB(this.series[i].color)/2) + ', 0.2)';
			this.ctx.shadowBlur = this.opt.shadow*2;
			this.ctx.beginPath();
			this.ctx.lineWidth = 0;
			this.ctx.moveTo(this.opt.startX, this.opt.ch-this.opt.marginY);
			this.ctx.lineTo(this.opt.startX, this.opt.ch - this.opt.marginY - ((((this.opt.categoryTotals[0] - stackAdd[0] - this.series[i].data[0])/tmax)* this.opt.ch_w)*this.opt.stack) - ((this.series[i].data[0] / tmax) * this.opt.ch_w));
			this.ctx.lineWidth = 1;
			var calcmax = this.opt.ch_w;
			for(j=1; j<Math.floor(ind_len*this.opt.animate); j++) {
				if(this.opt.smooth) {
					//bezierCurveTo(2ND BEZ PT X OF LAST COORD, 2ND BEZ PT Y OF LAST COORD, 1ST BEZ PT X OF THIS COORD, 1ST BEZ PT Y OF THIS COORD, THIS COORD X, THIS COORD Y)
					this.ctx.bezierCurveTo(this.series[i].calc[j-1][4], this.series[i].calc[j-1][5], this.series[i].calc[j][0], this.series[i].calc[j][1], this.series[i].calc[j][2], this.series[i].calc[j][3]);
				} else {
					stackAdd[j] = stackAdd[j] || 0;
					var ty = this.opt.ch - this.opt.marginY - ((((this.opt.categoryTotals[j] - stackAdd[j] - this.series[i].data[j])/tmax)* this.opt.ch_w)*this.opt.stack) - ((this.series[i].data[j] / tmax) * this.opt.ch_w);
					this.ctx.lineTo(this.opt.startX + (this.opt.increment*(j-1)) + (this.opt.increment*this.opt.animate), ty);
					if(this.opt.stack) { stackAdd[j] += this.series[i].data[j];}
				}
			}
			this.ctx.lineWidth = 0;
			this.ctx.lineTo(this.opt.startX + (this.opt.increment*(ind_len-1))/(1/this.opt.animate), this.opt.ch-this.opt.marginY);
			this.ctx.fill();
			this.ctx.stroke();
			this.ctx.shadowColor = 'rgba(0,0,0,0)';
			if(this.opt.stack) { stackAdd[0] += this.series[i].data[0];}
		}
		
		//DRAW AXES
		this.drawAxes();
	}
});


var Streamgraph = Chart.extend({
	init: function(canvas_name, options){
		if(!this.interval) {
			options.params.categories_on_side = 0;
			options.params.categories_on_bottom = 0;
			options.params.horizontal_ticks = 1;
			options.params.sort_by_series = 1;
			
			this._super( canvas_name, options );
			//GET MID-PT
			this.opt.midpt = (this.opt.ch_w/2) + this.opt.titlespace + this.opt.marginY;			this.opt.increment = this.opt.cw_w/(this.opt.seriesMax+1);
			
			var _this = this;
			this.interval = setInterval(function() {_this.draw();}, 1000/30);
		}
	},
	draw: function(){
		// Call the inherited version of draw()
		this._super();
		//METRICS
		this.drawGridlines();
		//DRAW AREA-SPECIFIC ELEMENTS
		this.ctx.lineWidth = 1;
		//DRAW LINE
		var stackAdd = [[],[]];
		var tmax = this.opt.max;
		if(this.opt.stack) {tmax = this.opt.cmax;}
		
		var tot_len = this.series.length, i;
		for(i=0; i<tot_len; i++) {
			this.ctx.shadowColor = 'rgba(0,0,0,0)';
			this.ctx.strokeStyle = this.series[i].color;
			var trans = 1;
			if(!this.opt.stack) { trans = (1-((i/tot_len)/4)); }
			this.ctx.fillStyle = 'rgba' + this.series[i].color.substr(3, this.series[i].color.length-4) + ", " + trans + ')';
			this.ctx.shadowColor = 'rgba(' + Math.round(getR(this.series[i].color)/2) + ', ' + Math.round(getG(this.series[i].color)/2) + ', ' + Math.round(getB(this.series[i].color)/2) + ', 0.2)';
			this.ctx.shadowBlur = this.opt.shadow;
			this.ctx.lineWidth = 1;
			
			//ALWAYS START AT MIDPOINT
			this.ctx.beginPath();
			this.ctx.moveTo(this.opt.startX, this.opt.midpt);
			var divider = 1;
			var ind_len = this.series[i].data.length;
			//EVENS CURVE ON TOP
			if(i%2 === 0 || i === tot_len-1) {
				var j;
				for(j=0; j<Math.floor(ind_len*this.opt.animate); j++) {
					if(this.opt.smooth) {
						var bx1 = this.opt.startX + (this.opt.increment/1.66);
						var by1 = this.opt.midpt - this.series[i].calc[j][1]/1.66 ;
						if(j>0) { bx1 = this.series[i].calc[j-1][4]; by1 = this.series[i].calc[j-1][5];}
						//bezierCurveTo(2ND BEZ PT X OF LAST COORD, 2ND BEZ PT Y OF LAST COORD, 1ST BEZ PT X OF THIS COORD, 1ST BEZ PT Y OF THIS COORD, THIS COORD X, THIS COORD Y)
						this.ctx.bezierCurveTo(bx1, by1, this.series[i].calc[j][0], this.series[i].calc[j][1], this.series[i].calc[j][2], this.series[i].calc[j][3]);
					} else {
						stackAdd[0][j] = parseInt(stackAdd[0][j]) || 0;
						var ty = this.opt.midpt - ((((this.opt.categoryTotals_split[0][j] - stackAdd[0][j] - this.series[i].data[j])/tmax)* this.opt.ch_w)*this.opt.stack)/divider - ((this.series[i].data[j] / tmax) * this.opt.ch_w)/divider;
						
						this.ctx.lineTo(this.opt.startX + (this.opt.increment*j) + (this.opt.increment*this.opt.animate), ty);
						if(this.opt.stack) { stackAdd[0][j] = parseInt(this.series[i].data[j]) + parseInt(stackAdd[0][j]);  }
					}
				}
			}
			if(i === tot_len-1) {
				this.ctx.lineTo(this.opt.startX + ((this.opt.increment*(ind_len+1))*this.opt.animate), this.opt.midpt);
				this.ctx.fill();
				this.ctx.shadowColor = 'rgba(' + Math.round(getR(this.series[i].color)/2) + ', ' + Math.round(getG(this.series[i].color)/2) + ', ' + Math.round(getB(this.series[i].color)/2) + ', 0.2)';
				this.ctx.shadowBlur = this.opt.shadow;
				this.ctx.beginPath();
				this.ctx.moveTo(this.opt.startX, this.opt.midpt);
			}
			//ODDS AND FIRST CURVE ON BOTTOM
			if(i%2 === 1 || i === tot_len-1) {
				var j;
				for(j=0; j<Math.floor(ind_len*this.opt.animate); j++) {
					if(this.opt.smooth) {
						var bx1 = this.opt.startX + (this.opt.increment/1.66);
						var by1 = this.opt.midpt + this.series[i].calc[j][1]/1.66 ;
						if(j>0) { bx1 = this.series[i].calc[j-1][4]; by1 = this.series[i].calc[j-1][5];}
						//bezierCurveTo(2ND BEZ PT X OF LAST COORD, 2ND BEZ PT Y OF LAST COORD, 1ST BEZ PT X OF THIS COORD, 1ST BEZ PT Y OF THIS COORD, THIS COORD X, THIS COORD Y)
						this.ctx.bezierCurveTo(bx1, by1, this.series[i].calc[j][0], this.series[i].calc[j][1], this.series[i].calc[j][2], this.series[i].calc[j][3]);
					} else {
						stackAdd[1][j] = parseInt(stackAdd[1][j]) || 0;
						var ty = this.opt.midpt + ((((this.opt.categoryTotals_split[1][j] - stackAdd[1][j] - this.series[i].data[j])/tmax)* this.opt.ch_w)*this.opt.stack)/divider + ((this.series[i].data[j] / tmax) * this.opt.ch_w)/divider;
						
						this.ctx.lineTo(this.opt.startX + (this.opt.increment*j-1) + (this.opt.increment*this.opt.animate), ty);
						if(this.opt.stack) { stackAdd[1][j] = parseInt(this.series[i].data[j]) + parseInt(stackAdd[1][j]); }
					}
				}
			}
			this.ctx.lineTo(this.opt.startX + ((this.opt.increment*(ind_len+1))*this.opt.animate), this.opt.midpt);
			this.ctx.fill();
			this.ctx.stroke();
		}
		
	}
});