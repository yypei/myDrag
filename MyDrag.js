/**
 * Created by yangyp on 2018/6/28.
 */
/**
 * var myDrag=new MyDrag({options}); myDrag.init();
 * options内部参数 el要进行拖拽的元素（ps：必传）  dragMode拖拽模式下面有参数说明（可不传  默认任意拖拽） upgradeDragMode升级拖拽(可不传  需基础模式拖拽参数dragMode配合)  limitDrag拖拽边界限制（可不传   对应模式有默认的边界限制）
 */
MyDrag=function(options){
    if(!options.el){
        return;
    }
    this.el=options.el;
    this.elSelector=options.el.selector;//为了排序的时候dom元素置换位置之后跟新 this.el
    this.parent=this.el.parents();
    this.arguOptions=options;
    this.targetEl=options.targetEl?options.targetEl:''; //targetEl碰撞检测的另一个元素
    this.flag=false;
    this.upBlock=false;
    this.cur = {
        x:0,
        y:0
    };
    this.touch;
    this.nx;
    this.ny;
    this.dx;
    this.dy;
    this.x;
    this.y;
    this.leftArr=[];
    this.topArr=[];
    this.options={
        dragMode:'wantonly',
        //默认任意拖拽（wantonly）。  盒子内部（insideBox） 盒内左右拖拽（leftRightBoxDrag）
        // 导航条一部分在盒子内一部分在盒子外部适用于移动端（navDrag） 盒内上下拖拽（upDownBoxDrag）
        upgradeDragMode:'',
        //  横向拖拽排序(horizontalOrderingDrag) 纵向拖拽排序(longitudinalSortingDrag)
        // 移动结束后判断是否在碰撞范围（upDragCollision）  移动过程中碰撞检测（movingDragCollision）
        needInitDom:false,//是否需要初始化dom元素的定位位置
        limitDrag:{}//使用者可以自己定义拖拽边界{limitTopNum,limitRightNum,limitRightNum,limitLeftNum}
    };
};
MyDrag.prototype={
    init:function(){
        for(var key in this.arguOptions) {
            this.options[key] = this.arguOptions[key];
        }
        if(this.options.needInitDom){
            this.initDom();
        }
        if(this.options.upgradeDragMode==='horizontalOrderingDrag'){
            // 横向拖拽应在盒子内部
            this.options.dragMode='leftRightBoxDrag';
        }
        if(this.options.upgradeDragMode==='longitudinalSortingDrag'){
            // 纵向拖拽应在盒子内部
            this.options.dragMode='upDownBoxDrag';
        }
        this.draggable();
    },
    initDom:function(){
        this.parent.css('position','relative');
        this.el.each(function (index,el) {
            this.leftArr.push($(el).position().left);
            this.topArr.push($(el).position().top);
        }.bind(this));
        this.el.each(function(index,el){
            $(el).css({'position':'absolute','left':this.leftArr[index],'top':this.topArr[index]})
        }.bind(this));
    },
    draggable:function(){
        this.el.on("mousedown",function(event){
            this.down(event);
        }.bind(this));
        this.el.on("touchstart",function(event){
            this.down(event);
        }.bind(this));
    },
    down:function(event){
        this.currentEl=$(event.currentTarget);
        this.zIndex=this.currentEl.css('z-index');
        this.currentEl.css('z-index',10000);
        this.currentElIndex=this.currentEl.index();
        this.parent=this.currentEl.parents();
        this.flag = true;
        if(event.type==='touchstart'){
            this.touch = event.originalEvent.targetTouches[0];
        }else{
            this.touch = event;
        }
        this.cur.x = this.touch.clientX;
        this.cur.y = this.touch.clientY;
        this.dx = this.currentEl.position().left;
        this.dy = this.currentEl.position().top;
        $(document).on("mousemove",function(event){
            this.move(event);
        }.bind(this));
        $(document).on("touchmove",function(event){
            this.move(event);
        }.bind(this));
        $(document).on("mouseup",function(event){
            this.end(event);
        }.bind(this));
        $(document).on("touchend",function(event){
            this.end(event);
        }.bind(this));
        return false;
    },
    move:function (event){
        if(event.type==='touchmove'){
            this.touch = event.originalEvent.targetTouches[0];
        }else{
            this.touch = event;
        }
        this.nx = this.touch.clientX - this.cur.x;
        this.ny = this.touch.clientY - this.cur.y;
        this.x = this.dx+this.nx;
        this.y = this.dy+this.ny;
        if(this.flag && this.nx){
            this.upBlock=true;
            // 简单拖拽开始
            switch(this.options.dragMode){
                case 'insideBox':
                    this.insideBox();
                    break;
                case 'navDrag':
                    this.navDrag();
                    break;
                case 'upDownBoxDrag':
                    this.upDownBoxDrag();
                    break;
                case 'leftRightBoxDrag':
                    this.leftRightBoxDrag();
                    break;
                default:
                    break;
            }
            // 简单拖拽结束
            // 移动中升级拖拽开始   可配合dragMode参数控制拖拽范围
            if(this.options.upgradeDragMode){
                // 需要就传
                switch(this.options.upgradeDragMode){
                    case 'movingDragCollision':
                        this.movingDragCollision();
                        break;
                }
            }
            // 移动中升级拖拽结束
            this.limitNumFn();
            if(this.options.dragMode!='upDownBoxDrag'){
                this.currentEl.css('left',this.x);
            }
            if(this.options.dragMode!='leftRightBoxDrag'){
                this.currentEl.css('top',this.y);
            }
            this.currentEl.setCapture && this.currentEl.setCapture();
            event.preventDefault();
            return false;
        }
    },
    end:function (){
        // 移动结束升级拖拽开始   可配合dragMode参数控制拖拽范围
        if(this.upBlock){
            // 确定不是点击而是拖拽才执行下面代码
            if(this.options.upgradeDragMode){
                // 需要就传
                switch(this.options.upgradeDragMode){
                    case 'upDragCollision':
                        this.upDragCollision();
                        break;
                    case 'horizontalOrderingDrag':
                        this.horizontalOrderingDrag();
                        break;
                    case 'longitudinalSortingDrag':
                        this.longitudinalSortingDrag();
                        break;
                }
            }
            this.upBlock=false;
        }
        // 移动结束升级拖拽结束
        this.currentEl.css('z-index',this.zIndex);
        this.currentEl.releaseCapture && this.currentEl.releaseCapture();
        $(document).off('mousemove');
        $(document).off('mouseup');
        $(document).off('touchmove');
        $(document).off('touchend');
        this.flag = false;
    },
    insideBox:function(){
        // 盒子内部任意拖拽
        this.options.limitDrag={
            limitTopNum:0,
            limitRightNum:this.parent.outerWidth()-this.el.outerWidth(),
            limitBottomNum:this.parent.outerHeight()-this.el.outerHeight(),
            limitLeftNum:0
        };
    },
    navDrag:function(){
        // 导航条拖拽
        this.options.limitDrag={
            limitTopNum:0,
            limitRightNum:0,
            limitBottomNum:0,
            limitLeftNum:this.parent.outerWidth()-this.el.outerWidth()
        }
    },
    upDownBoxDrag:function(){
        // 盒子内部纵向拖拽
        this.options.limitDrag={
            limitTopNum:0,
            limitBottomNum:this.parent.outerHeight()-this.el.outerHeight()
        }
    },
    leftRightBoxDrag:function(){
        // 盒子内部横向拖拽
        this.options.limitDrag={
            limitRightNum:this.parent.outerWidth()-this.el.outerWidth(),
            limitLeftNum:0
        }
    },
    limitNumFn:function(){
        var limitDrag=this.options.limitDrag;
        if(limitDrag.limitLeftNum||limitDrag.limitLeftNum===0){
            if(this.x<=limitDrag.limitLeftNum){
                this.x =limitDrag.limitLeftNum;
            }
        }
        if(limitDrag.limitRightNum||limitDrag.limitRightNum===0){
            if(this.x>=limitDrag.limitRightNum){
                this.x =limitDrag.limitRightNum;
            }
        }
        if(limitDrag.limitTopNum||limitDrag.limitTopNum===0){
            if(this.y<=limitDrag.limitTopNum){
                this.y =limitDrag.limitTopNum;
            }
        }
        if(limitDrag.limitBottomNum||limitDrag.limitBottomNum===0){
            if(this.y>=limitDrag.limitBottomNum){
                this.y =limitDrag.limitBottomNum;
            }
        }
    },
    horizontalOrderingDrag:function(){
        // 横向拖拽排序
        if(this.x>=this.leftArr[this.currentElIndex]){//相对于起始位置向右移动
            for(var i=(this.leftArr.length-1);i>0;i--){
                if((this.x+this.currentEl.outerWidth())>=this.leftArr[i] && this.currentElIndex!==i){
                    $(this.el[i]).after(this.currentEl);
                    break;
                }
            }
        }else{
            for(var i=0;i<this.leftArr.length;i++){//相对于起始位置向左移动
                if(this.x<(this.leftArr[i]+this.currentEl.outerWidth()) && this.currentElIndex!==i){
                    $(this.el[i]).before(this.currentEl);
                    break;
                }
            }
        }

        this.el=$(this.elSelector);
        this.el.each(function(index,el){
            $(el).css('left',this.leftArr[index])
        }.bind(this));
        this.dragCallBack();
    },
    longitudinalSortingDrag:function(){
        // 纵向向拖拽排序
        if(this.y>=this.topArr[this.currentElIndex]){
            for(var i=(this.topArr.length-1);i>0;i--){//相对于起始位置向上移动
                if((this.y+this.currentEl.outerHeight())>=this.topArr[i] && this.currentElIndex!==i){
                    $(this.el[i]).after(this.currentEl);
                    break;
                }
            }
        }else{
            for(var i=0;i<this.topArr.length;i++){//相对于起始位置向下移动
                if(this.y<(this.topArr[i]+this.currentEl.outerHeight()) && this.currentElIndex!==i){
                    $(this.el[i]).before(this.currentEl);
                    break;
                }
            }
        }

        this.el=$(this.elSelector);
        this.el.each(function(index,el){
            $(el).css('top',this.topArr[index])
        }.bind(this));
        this.dragCallBack();
    },
    movingDragCollision:function(){
        // 移动过程中的碰撞检测
        if(this.targetEl){
            this.targetElX=this.targetEl.position().left;
            this.targetElY=this.targetEl.position().top;
            this.targetElWidth=this.targetEl.outerWidth();
            this.targetElHeight=this.targetEl.outerHeight();
            if( !((this.x+this.currentEl.outerWidth())<this.targetElX || this.x>(this.targetElX+this.targetElWidth) || (this.y+this.currentEl.outerHeight())<this.targetElY || this.y>(this.targetElY+this.targetElHeight)) ){
                // 碰撞了
                this.dragCallBack();
                // 碰撞之后具体需要什么操作根据使用者的需求而定   使用者自行编写碰撞回调
            }
        }
    },
    upDragCollision:function(){
        // 鼠标或者手指松开后检测是否碰撞
        if(this.targetEl){
            this.targetElX=this.targetEl.position().left;
            this.targetElY=this.targetEl.position().top;
            this.targetElWidth=this.targetEl.outerWidth();
            this.targetElHeight=this.targetEl.outerHeight();
            if( !(this.x<this.targetElX || this.x>(this.targetElX+this.targetElWidth) || this.y<this.targetElY || this.y>(this.targetElY+this.targetElHeight)) ){
                // 碰撞了
                this.dragCallBack();
                // 碰撞之后具体需要什么操作根据使用者的需求而定   使用者自行编写碰撞回调
            }
        }
    },
    dragCallBack:function(){
        // 拖拽回调
    }
};
