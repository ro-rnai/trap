

function svgCreate(tagName, attrs)
{
	const svgns='http://www.w3.org/2000/svg';
	const xlinkns='http://www.w3.org/1999/xlink';
	let ele=document.createElementNS(svgns, tagName);
	if(attrs) {
		for(let k in attrs) {
			ele.setAttributeNS(null, k, attrs[k]);
		}
	}
	return ele;
}
const cellWidth=24;

let map=document.getElementById('map');
let mob; //魔物的 svg
let trap;
let auxLine;
let area; //陷阱可放置區域輔助線
let hint;
let mobX,mobY; //魔物座標
let trapX,trapY; //魔物座標
let acttionLock=false; //鎖住使用者動作(動畫中鎖住)
let timer=false;

(function(){ //初始化
	let svg=svgCreate('svg',{
		width:cellWidth*29,
		height:cellWidth*29,
		viewBox:''+[cellWidth*14,cellWidth*14,-0.5,-0.5].join(',')+''
	});
	//格子
	(function(){
		let group=svgCreate('g');
		svg.appendChild(group);
		group.appendChild(svgCreate('rect',{
			style:'stroke:none;fill:yellow',
			width:cellWidth*29,
			height:cellWidth*29
		}));
		for(let y=0;y<29;++y) {
			for(let x=0;x<29;++x) {
				let grid=svgCreate('rect',{
					style:x===14&&y===14?
						'stroke-width:1px;stroke:gray;fill:lightgray':
						'stroke-width:1px;stroke:gray;fill:white',
					class:'grid',
					x:x*cellWidth,
					y:y*cellWidth,
					width:cellWidth,
					height:cellWidth
				});
				grid.addEventListener('click',setTrap);
				grid.dataset.x=x;
				grid.dataset.y=y;
				group.appendChild(grid);
			}
		}
	})();
	
	hint=(function(){
		let text=svgCreate('text',{
			'pointer-events':'none',
			x:cellWidth*14.5,
			y:cellWidth*5,
			'text-anchor':'middle',
			style:'font-size:36px;color:blue;opacity:0.5'
		});
		text.innerHTML="點擊格子放置陷阱";
		return text;
	})();
	svg.appendChild(hint);
	//輔助線
	auxLine=(function(){
		let line=svgCreate('path',{
			'pointer-events':'none',
			transform:'translate('+0.5*cellWidth+' '+0.5*cellWidth+')'
		});
		return line;
	})();
	area=(function(){
		let path=svgCreate('path',{
			transform:'translate('+14.5*cellWidth+','+14.5*cellWidth+')',
			d:'M '+ -4.5*cellWidth+','+ -1.5*cellWidth + ' l '+([
				cellWidth+',0 0,'+ -cellWidth,
				cellWidth+',0 0,'+ -cellWidth,
				cellWidth+',0 0,'+ -cellWidth,
				3*cellWidth+',0',
				'0,'+ cellWidth+' '+cellWidth+',0',
				'0,'+ cellWidth+' '+cellWidth+',0',
				'0,'+ cellWidth+' '+cellWidth+',0',
				'0,'+ 3*cellWidth,
				-cellWidth+',0 0,'+ cellWidth,
				-cellWidth+',0 0,'+ cellWidth,
				-cellWidth+',0 0,'+ cellWidth,
				-3*cellWidth+',0',
				'0,'+ -cellWidth+' '+ -cellWidth+',0',
				'0,'+ -cellWidth+' '+ -cellWidth+',0',
				'0,'+ -cellWidth+' '+ -cellWidth+',0',
				'z'
			].join(' '))
			
		});
		return path;
	})();
	//人物
	let hunter=(function(){
		let group=svgCreate('g',{
			'pointer-events':'none'
		});
		let center=29/2*cellWidth;
		group.appendChild(svgCreate('circle',{
			style:'stroke-width:1px;stroke:gray;fill:green',
			cx:center,
			cy:center-2.1*cellWidth,
			r:0.4*cellWidth
		}));
		group.appendChild(svgCreate('path',{
			style:'stroke-width:1px;stroke:gray;fill:green',
			d:'M '+center+','+center+' l '+[
				-0.4*cellWidth+','+ -1.6*cellWidth,
				0.8*cellWidth+',0'
			].join(',')+' z'
		}));
		return group;
	})();
	
	//魔物
	mob=(function(){
		let group=svgCreate('g',{
			transform:'translate('+ -cellWidth*10+','+ -cellWidth*10+')',
			'pointer-events':'none'
		});
		group.appendChild(svgCreate('circle',{
			style:'stroke:none;fill:lightgray',
			cx:0,
			xy:0,
			r:cellWidth*0.4
		}));
		group.appendChild(svgCreate('path',{
			style:'stroke-width:1px;stroke:gray;fill:red',
			d:'M 0,0 l '+[
				-cellWidth +','+-2*cellWidth,
				cellWidth +','+cellWidth,
				cellWidth +','+-cellWidth
			].join(',')+' z'
		}));
		group.appendChild(svgCreate('path',{
			style:'stroke-width:1px;stroke:gray;fill:red',
			d:'M '+ -0.6*cellWidth+','+ -1.6*cellWidth+' l '+[
				1.1*cellWidth +','+-0.4*cellWidth,
				-0.2*cellWidth+','+0.4*cellWidth,
				0.2*cellWidth+','+0.4*cellWidth
			].join(',')+' z'
		}));
		return group;
	})();
	//陷阱
	trap=(function(){
		let group=svgCreate('g',{
			transform:'translate('+ -cellWidth*10+','+ -cellWidth*10+')',
			'pointer-events':'none'
		});
		group.appendChild(svgCreate('rect',{
			style:'stroke:none;fill:#00F;opacity:0.2',
			width:3*cellWidth,
			height:3*cellWidth,
			x:-1.5*cellWidth,
			y:-1.5*cellWidth
		}));
		group.appendChild(svgCreate('path',{
			style:'stroke-width:5px;stroke:red;fill:none',
			d:'M '+-cellWidth*0.4+','+-cellWidth*0.4
				+' l '+cellWidth*0.8+','+cellWidth*0.8
				+' M '+-cellWidth*0.4+','+cellWidth*0.4
				+' l '+cellWidth*0.8+','+-cellWidth*0.8
		}));
		return group;
	})();
	svg.appendChild(area);
	svg.appendChild(trap);
	svg.appendChild(auxLine);
	svg.appendChild(mob);
	svg.appendChild(hunter);
	map.appendChild(svg);
	resetMobPos();
})();

function resetMobPos()
{
	let x,y;
	do{
		x=Math.floor(Math.random()*29);
		y=Math.floor(Math.random()*29);
	} while(Math.abs(x-14)<4 && Math.abs(y-14)<4);
	mobX=x;
	mobY=y;
	setElementPos(mob,x,y);
	setElementPos(trap,-10,-10);
	acttionLock=false;
	refreshAuxLine();
	refreshTrapArea();
}
function setElementPos(ele,x,y) {
	
	ele.setAttributeNS(null,'transform','translate('+ cellWidth*(x+0.5)+','+cellWidth*(y+0.5)+')');
}
let msg=document.getElementById('msg');
function setTrap(evt)
{
	if(hint) {
		hint.parentElement.removeChild(hint);
		hint=false;
	}
	if(acttionLock) {
		return;
	}
	let str='';
	//檢查陷阱允許放置
	let x=parseInt(evt.target.dataset.x,10);
	let y=parseInt(evt.target.dataset.y,10);
	let dx=Math.abs(x-14);
	let dy=Math.abs(y-14);
	console.log([x,y]);
	if((dx<2 && dy<2) || (Math.abs(x-mobX)<2 && Math.abs(y-mobY)<2)) {
		str='無法放置陷阱（3x3內不能有魔物或是玩家）';
	}
	if(dx>4 || dy>4 || dx+dy>5) {
		str='超出能放置陷阱範圍(人物會移動)';
	}
	msg.textContent=str;
	if(str!=='') {
		return;
	}
	acttionLock=true;
	//顯示陷阱
	trapX=x;
	trapY=y;
	setElementPos(trap, x, y);
	//跑動畫及結果
	run();
}

function run()
{
	//檢查碰到人物
	let dx=Math.abs(mobX-14);
	let dy=Math.abs(mobY-14);
	let touch=dx<2&&dy<2?true:false;
	//檢查進入陷阱
	let trapped=Math.abs(mobX-trapX)<2 && Math.abs(mobY-trapY)<2 ? true:false;
	
	if(trapped){
		setElementPos(mob, trapX, trapY);
		msg.innerHTML=(touch?'被魔物碰到1下<br>':'')+'陷阱捕獲魔物';
		setTimeout(function(){
			resetMobPos();
		},1000);
		return;
	}
	if(touch) {
		msg.innerHTML='失敗';
		setTimeout(function(){
			resetMobPos();
		},1000);
		return;
	}
	
	mobX=dx<=1?mobX:(mobX>14?mobX-1:mobX+1);
	mobY=dy<=1?mobY:(mobY>14?mobY-1:mobY+1);
	setElementPos(mob, mobX, mobY);
	setTimeout(run,500);
}

function refreshAuxLine()
{
	let ck=document.getElementById('aux').checked;
	let x=mobX,y=mobY;
	let dx=Math.abs(x-14);
	let dy=Math.abs(y-14);
	let x1,y1,x2,y2;
	if(dx>dy) {
		y1=y>14?15:y==14?14:13;
		dy=Math.abs(y-y1);
		x1=x>14?x-dy:x==14?14:x+dy;
		y2=y1;
		x2=x>14?15:x==14?14:13;
		auxLine.setAttributeNS(null,'d','M'+x*cellWidth+','+y*cellWidth+'L'+x1*cellWidth+','+y1*cellWidth+' '+x2*cellWidth+','+y2*cellWidth);
	} else if(dy>dx) {
		x1=x>14?15:x==14?14:13;
		dx=Math.abs(x-x1);
		y1=y>14?y-dx:y==14?14:y+dx;
		x2=x1;
		y2=y>14?15:y==14?14:13;
		auxLine.setAttributeNS(null,'d','M'+x*cellWidth+','+y*cellWidth+'L'+x1*cellWidth+','+y1*cellWidth+' '+x2*cellWidth+','+y2*cellWidth);
	} else {
		x1=x>14?15:x==14?14:13;
		y1=y>14?15:y==14?14:13;
		auxLine.setAttributeNS(null,'d','M'+x*cellWidth+','+y*cellWidth+'L'+x1*cellWidth+','+y1*cellWidth);
	}
	
	if(ck) {
		auxLine.setAttributeNS(null,'style','stroke:#F0F;stroke-width:2px;stroke-dasharray:8,6;fill:none');
	} else {
		auxLine.setAttributeNS(null,'style','stroke:none;fill:none');
	}
}

function refreshTrapArea()
{
	let ck=document.getElementById('area').checked;
	if(ck) {
		area.setAttributeNS(null,'style',"fill:none;stroke-width:2px;stroke:black");
	} else {
		area.setAttributeNS(null,'style','stroke:none;fill:none');
	}
}