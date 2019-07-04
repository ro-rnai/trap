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
let grid;
let trap;
let ani;
let auxLine,auxLine2;
let area; //陷阱可放置區域輔助線
let hint;
let mobX,mobY; //魔物座標
let trapX,trapY; //魔物座標
let acttionLock=false; //鎖住使用者動作(動畫中鎖住)
let timer=false;

(function(){ //初始化
	let svg=svgCreate('svg',{
		width:cellWidth*29+5,
		height:cellWidth*29+5,
		viewBox:''+[-0.5,-0.5,cellWidth*29+5,cellWidth*29+5].join(' ')+''
	});
	//格子
	grid=(function(){
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
					style:'stroke-width:1px;stroke:gray;fill:white',
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
		group.appendChild(svgCreate('rect',{
			x:0,
			y:0,
			style:'stroke:black;fill:none',
			width:cellWidth*29,
			height:cellWidth*29
		}));
		return group;
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
	auxLine2=(function(){
		let line=svgCreate('path',{
			transform:'translate('+0.5*cellWidth+' '+0.5*cellWidth+')',
			style:"fill:none;stroke-width:2px;stroke:black"
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
		group.appendChild(svgCreate('circle',{
			style:'stroke:none;fill:lightgray',
			cx:center,
			cy:center,
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
	svg.appendChild(auxLine2);
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
	refreshMapGrid();
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
	if((dx<2 && dy<2) || (Math.abs(x-mobX)<2 && Math.abs(y-mobY)<2)) {
		str='無法放置陷阱（3x3內不能有魔物或是玩家）';
	}
	if(dx>4 || dy>4 || dx+dy>5) {
		str='超出能放置陷阱範圍(人物會移動)';
	}
	msg.innerHTML='<span style="color:red">'+str+'</span>';
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

function refreshAuxLine()
{
	let ck=document.getElementById('aux').checked;
	auxLine.setAttributeNS(null,'d',getPathData(mobX,mobY,
		mobX>14?15:(mobX<14?13:14),
		mobY>14?15:(mobY<14?13:14),
	cellWidth));
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
		trap.children[0].setAttributeNS(null,'style','stroke:none;fill:#00F;opacity:0.2');
	} else {
		area.setAttributeNS(null,'style','stroke:none;fill:none');
		trap.children[0].setAttributeNS(null,'style','stroke:none;fill:#00F;opacity:0');
	}
}

function refreshMapGrid()
{
	let ck=document.getElementById('grid').checked;
	let arr=grid.children;
	for(let i=arr.length-1; i>=0; --i) {
		let ele=arr[i];
		if(ele.getAttributeNS(null,'class')!=='grid') {
			continue;
		}
		let x=parseInt(ele.dataset.x,10);
		let y=parseInt(ele.dataset.y,10);
		ele.setAttributeNS(null,'style',ck?
			'stroke-width:1px;stroke:gray;fill:white':
			'stroke-width:1px;stroke:white;fill:white'
		);
	}
}

function getPathData(sx, sy, ex, ey, edge, asArray) //從 mobX,mobY 取得路徑字串
{
	let dx=Math.abs(ex-sx),
	    dy=Math.abs(ey-sy),
		dd=Math.min(dx,dy);
	if(dd===0 || dx===dy) {
		if(!asArray) {
			return 'M'+sx*edge+','+sy*edge+'L'+ex*edge+','+ey*edge;
		}
		return [sx,sy,ex,ey];
	}
	let mx=ex>sx?sx+dd:sx-dd,
	    my=ey>sy?sy+dd:sy-dd;
	if(!asArray) {
		return 'M'+sx*edge+','+sy*edge+'L'+mx*edge+','+my*edge+' '+ex*edge+','+ey*edge;
	}
	return [sx,sy,mx,my,ex,ey];
}

function getInertsect(x1, y1, x2, y2, x3, y3, x4, y4)
{
	let p=isIntersect(x1, y1, x2, y2, x3, y3, x4, y4);
	let p2=isIntersect(x3, y3, x4, y4, x1, y1, x2, y2);
	if(p!==null && p2!==null){
		return p;
	}
	return null;
	
	/** 
	 * P3-P4線段是否與 P1-P2線段有交點
	 * 有的話回傳交點
	 * 沒有的話回傳 null
	 * 若兩線段重疊(無限多個交點)，則取離P1最近的點
	 *
	 * @param float (x|y)[1-4] 點的x,y值
	 * @return float|false 交點或無交點
	 */
	function isIntersect(x1, y1, x2, y2, x3, y3, x4, y4)
	{
		let a=y2-y1;
		let b=x1-x2;
		let c=a*x1+b*y1;
		if((a*x3+b*y3-c)*(a*x4+b*y4-c)<=0) {
			let cross=(a*(x4-x3)+b*(y4-y3));
			if(cross!==0) {
				let t=(c-a*x3-b*y3)/cross;
				return {x:x3+t*(x4-x3),y:y3+t*(y4-y3)};
			} else {
				let d1=isBetween(x1, y1, x2, y2, x3, y3);
				let d2=isBetween(x1, y1, x2, y2, x4, y4);
				return d1!==false?
					(d2!==false?
						(d1<d2?
							{x:x3,y:y3}:
							{x:x4,y:y4}):
						{x:x3,y:y3}):
					(d2!==false?{x:x4,y:y4}:null);
			}
			
		}
		return null;
	}
	
	/** 
	 * P3是否在 P1,P2之間
	 *
	 * @param float (x|y)[1-3] 點的x,y值
	 * @return int|false 回傳p3與p1距離平方，或p3不在兩點間
	 */
	function isBetween(x1, y1, x2, y2, x3, y3) //,若是，回傳p3與p1距離，否則回傳false
	{
		let dx1=x1-x3,dx2=x2-x3,dy1=y1-y3,dy2=y2-y3;
		let innerProd=dx1*dx2+dy1*dy2;
		let len1p2=dx1*dx1+dy1*dy1;
		let len2p2=dx2*dx2+dy2*dy2;
		return innerProd===-len1p2*len2p2?len1p2:false;
	}
}

function run()
{
	posints=getPathData(
		mobX,
		mobY,
		mobX>14?15:(mobX<14?13:14),
		mobY>14?15:(mobY<14?13:14),
		cellWidth,
		true
	);
	let trp=[
		trapX-1,trapY-1,
		trapX+1,trapY-1,
		trapX+1,trapY+1,
		trapX-1,trapY+1,
		trapX-1,trapY-1
	];
	let mindis=null,tmpP=null,sumdis=0;
	for(let i=0;i+3<posints.length;i+=2) {
		let arr=posints.slice(i,i+4);
		for(let j=0;j+3<trp.length;j+=2) {
			let brr=arr.concat(trp.slice(j,j+4));
			let p=getInertsect.apply(null,brr);
			if(p===null) {
				continue;
			}
			let dis=(p.x-mobX)*(p.x-mobX)+(p.y-mobY)*(p.y-mobY);
			if(tmpP===null || dis<mindis) {
				tmpP=p;
				mindis=dis;
			}
		}
		if(tmpP!==null) {
			sumdis+=Math.sqrt((tmpP.x-posints[i])*(tmpP.x-posints[i])
			+(tmpP.y-posints[i+1])*(tmpP.y-posints[i+1]));
			break;
		}
		sumdis+=Math.sqrt((posints[i+2]-posints[i])*(posints[i+2]-posints[i])
		+(posints[i+3]-posints[i+1])*(posints[i+3]-posints[i+1]));
	}
	if(tmpP===null) {
		tmpP={
			x:mobX>14?15:(mobX<14?13:14),
			y:mobY>14?15:(mobY<14?13:14)
		}
	}
	ani=svgCreate('animateMotion',{
		begin:"click",
		dur:sumdis/5+'s',
		fill:'freeze',
		path:getPathData(mobX,mobY,tmpP.x,tmpP.y,cellWidth)
	});
	ani.addEventListener('end',function(evt){
		let touch=(Math.abs(tmpP.x-14)<2 && Math.abs(tmpP.y-14)<2)?true:false;
		if(Math.abs(tmpP.x-trapX)<2 && Math.abs(tmpP.y-trapY)<2) {
			msg.innerHTML=(touch?'<span style="color:red">被魔物碰到1下</span><br>':'')+'陷阱捕獲魔物';
			setElementPos(mob, trapX, trapY);
		} else {
			msg.innerHTML='<span style="color:red">失敗</span>';
			setElementPos(mob, tmpP.x, tmpP.y);
		}
		mob.removeChild(ani);
		setTimeout(function(){
			resetMobPos();
		},1000);
	});
	mob.setAttributeNS(null,'transform','translate('+0.5*cellWidth+' '+0.5*cellWidth+')');
	mob.appendChild(ani).beginElement();
}

