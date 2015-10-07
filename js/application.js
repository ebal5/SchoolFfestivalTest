function Logger(lv){
    this.showLevel = lv;
}
Logger.prototype.logging = function(mes){
    console.log(mes);
};
Logger.prototype.log = function (str, level){
    level = level || 0;
    if(level >= this.showLevel){
        var lvMes = "";
        switch (level){
        case 0:
            lvMes = "[Develop] -- ";
            break;
        case 1:
            lvMes = "[Notice] -- ";
            break;
        case 2:
            lvMes = "[Warning] -- ";
            break;
        case 3:
            lvMes = "[Error] -- ";
            break;
        case 4:
            lvMes = "[Fatal] -- ";
            break;
        default:
            lvMes = "[LogError] -- ";
        }
        this.logging(lvMes+str);
    }
};
var logger = new Logger(0);

function Application(tgtID, wsURL){
    var self = this;
    this.opp = "";
    this.wave = 0;
    this.pos = -1;
    this.myMap = [0,0,0,0,0,0,0,0,0,0];
    this.doMap = [0,0,0,0,0,0,0,0,0,0];
    this.rsMap = [0,0,0,0,0,0,0,0,0,0];
    this.waveDone = false; // needed?
    this.editFlag = false;
    this.getDone = false;
    this.doFlag = false;
    // 各キーの入力状態を示す。ミリ秒単位でやればよかろうて。
    this.rFlag = false;
    this.sFlag = false;
    this.nFlag = false;
    this.spFlag = false;
    // 使用メソッドの責任でオフにされるフラグ。
    this.useKeyFlag = false;
    this.tool = 0;
    this.canvas = document.getElementById(tgtID || "target");
    if(typeof(this.canvas.getContext) == "undefined"){
        logger.log("[Canvas] -- Cannot get Context.", 4);
    }
    this.ctx = this.canvas.getContext('2d');
    logger.log("[Application] -- It's canvas id: "+ (tgtID||"target"), 1);
    this.canvas.addEventListener('click', this.click(), false);
}

Application.prototype.drawBack = function (){
    var ctx = this.ctx;
    ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
    ctx.fillStyle = '#ffefb6'; // Background color
    ctx.fillRect(0,0,this.canvas.width, this.canvas.height);
};
Application.prototype.drawWave = function (){
    this.drawBack();
    var ctx = this.ctx;
    ctx.font = 'bold 20px serif';
    ctx.fillStyle = '#000';
    ctx.fillText('Wave '+this.wave, 200, 100);
};
Application.prototype.drawMyMap = function (){
    this.drawWave();
    var ctx = this.ctx;
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#000';
    var bombs = 0;
    for(var i=0; i<10; i++){
        if(this.myMap[i] == 0){
            ctx.strokeRect(100+50*i, 150, 50, 50);
        }else{
            bombs++;
            ctx.strokeRect(100+50*i, 150, 50, 50);
            ctx.fillRect(100+50*i, 150, 50, 50);
        }
    }
    var remain = this.wave-bombs;
    ctx.font = 'bold 20px serif';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#000';
    ctx.fillText('地雷 あと '+remain+'個', 500, 100);

    ctx.fillStyle = '#faa';
    ctx.fillRect(200, 300, 100, 50);
    ctx.fillStyle = '#000';
    ctx.fillText('埋める', 210, 330);
};
Application.prototype.drawDoMap = function (){
    this.drawWave();
    var ctx = this.ctx;
    ctx.strokeStyle = '#000';
    var bombs = 0;
    for(var i=0; i<10; i++){
            ctx.strokeRect(100+50*i, 150, 50, 50);
    }

    ctx.font = 'bold 20px serif';

    ctx.fillStyle = '#000';
    ctx.fillText('解除ツール あと '+this.tool+'個', 400, 100);
    
    ctx.fillStyle = '#faa';
    ctx.fillRect(100, 300, 100, 50);
    ctx.fillStyle = '#000';
    ctx.fillText('進む',110, 330);

    ctx.fillStyle = '#faa';
    ctx.fillRect(300, 300, 100, 50);
    ctx.fillStyle = '#000';
    ctx.fillText('解除',310, 330);

    ctx.fillStyle = '#faa';
    ctx.fillRect(500, 300, 100, 50);
    ctx.fillStyle = '#000';
    ctx.fillText('戻る', 510, 330);

    for(var j = 0; j <= this.pos; j++){
        switch (this.rsMap[j]){
        case 0:
            ctx.fillStyle = '#00d';
            ctx.fillRect(100+50*j, 150, 50, 50);
            break;
        case 1:
            ctx.fillStyle = '#f00';
            ctx.fillRect(100+50*j, 150, 50, 50);
            break;
        case 2:
        case 3:
            ctx.fillStyle = '#0f0';
            ctx.fillRect(100+50*j, 150, 50, 50);
            break;
        }
    }
};

Application.prototype.clearWave = function (){
    logger.log("Clear wave",1);
    var self = this;
    var ctx = self.ctx;
    ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
    ctx.fillStyle = '#0e9';
    ctx.font = 'bold 50px serif';
    ctx.fillText("Clear wave "+self.wave, 300, 250);
    var fn = function (){self.doFlag = false; self.sendRes();};
    window.setTimeout(fn, 2000);
};

Application.prototype.bomb = function (){
    logger.log('Bomb', 1);
    var ctx = this.ctx;
    ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
    ctx.fillStyle = '#f00';
    ctx.beginPath();
    ctx.arc(400,300,200,0, Math.PI*2, true);
    ctx.fill();
    var self = this;
    var fn = function (){self.doFlag=false; self.sendRes();};
    window.setTimeout(fn, 2000);
};

Application.prototype.checkMyMap = function (){
    return true;
};

Application.prototype.edit = function (){
    var self = this;
    var fn = function (){self.editFlag = true;self.drawMyMap();};
    var ctx = self.ctx;
    self.editFlag = true;
    self.wave++;
    self.myMap = [0,0,0,0,0,0,0,0,0,0];    
    self.drawBack();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 50px serif';
    ctx.fillText("Wave "+self.wave+" Map Edit Part", 100, 300);
    window.setTimeout(fn, 2000);
};

Application.prototype.getPoint = function (){
    var point = 0;
    for(var i = 0; i < this.rsMap.length; i++){
        if(this.rsMap[i] == 4){break;}
        if(this.rsMap[i] == 1){point = 0;break;}
        point++;
    }
    return point;
};

Application.prototype.do = function (){
    // 開始メッセージでも表示する？
    // 現在の状態がその一例。 正直アニメーションはめんどかった。
    this.getDone = false;
    var ctx = this.ctx;
    this.rsMap = [0,0,0,0,0,0,0,0,0,0];
    this.tool = this.wave;
    this.drawBack();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 50px serif';
    ctx.fillText('Wave '+this.wave+" Start!!", 250, 300);
    var self = this;
    var func = function (){self.pos = -1; self.doFlag = true; self.drawDoMap(); };
    window.setTimeout(func, 2000);
};

Application.prototype.game = function (){
    if(typeof(this.pre) != "undefined"){this.pre();}
    this.edit();
};

Application.prototype.reset = function (){
    this.waveDone = false;
    this.editFlag = false;
    this.getDone = false;
    this.doFlag = false;
    this.wave = 0;
    this.tool = 0;
    this.pos = -1;
    this.myMap = [0,0,0,0,0,0,0,0,0,0];
    this.doMap = [0,0,0,0,0,0,0,0,0,0];
    this.rsMap = [0,0,0,0,0,0,0,0,0,0];    
    this.opp = "";
    this.room = "";
    logger.log("[Application] -- Reset game.", 2);
    // this.ws.send("Restart", null);
    this.waiting();
};

Application.prototype.waiting = function (){
    this.drawBack();
    var ctx = this.ctx;
    ctx.font = 'bold 20px serif';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#000';
    ctx.fillText("通信待機中", 300, 200);
    logger.log("[Application] -- Waiting for message from server", 1);
};

Application.prototype.toggleBomb = function (b){
    var remain = this.wave - this.myMap.reduce(function (n,acc){return n+acc;});
    if(this.myMap[b] == 0 && remain > 0){
        this.myMap[b] = 1;
    }else{
        this.myMap[b] = 0;
    }
    this.drawMyMap();
};

Application.prototype.setDoMap = function (map){
    this.doMap = map;
    this.getDone = true;
    if(!this.editFlag){
        this.do();
    }
    logger.log("[Application] -- Set enemy map.");
};

Application.prototype.sendMap = function (){
    this.editFlag = false;
    logger.log("[Dummy] -- Send map method. It is dummy",0);
};

Application.prototype.sendRes = function (){
    this.doFlag = false;
    var pt = this.getPoint();
    var obj = {
        map: this.rsMap,
        point: pt
    };
    var json = JSON.stringify(obj);
    logger.log("[Dummy] -- Send result. Result: "+json, 0);
    if(this.wave < 3){this.edit();}else{this.waiting();}
};

Application.prototype.click = function (){
    var self = this;
    return function (ev){
        var rect = ev.target.getBoundingClientRect();
        var x = ev.clientX - rect.left;
        var y = ev.clientY - rect.top;
        if(self.editFlag){
            if(y >= 150 && y <= 200 && x >= 100 && x <= 600){
                var num = Math.floor((x - 100)/50);
                self.toggleBomb(num);
            }else if(y >= 300 && y <= 350 && x >= 200 && x <= 300 && self.checkMyMap()){
                self.sendMap();
                if(self.getDone){
                    self.do();
                }else{
                    self.waiting();
                }
            }
        }else if(self.doFlag){
            if(y >= 300 && y <= 350 && self.pos < 9){
                var func;
                if(x >= 100 && x <= 200){
                    // 通常の進行
                    self.pos++;
                    if(self.doMap[self.pos] == 1){
                        if(self.pos > 0){
                            self.rsMap[self.pos] = 1;
                        }
                        func = self.bomb();
                    }else{
                        if(self.pos > 0){
                            self.rsMap[self.pos] = 0;
                        }
                        if(self.pos == 9){
                            func = self.clearWave();
                        }else{
                            func = self.drawDoMap();
                        }
                    }
                }else if(x >= 300 && x <= 400){
                    // 解除ツールの使用
                    if(self.tool > 0){
                        self.pos++;
                        self.tool--;
                        if(self.doMap[self.pos] == 1){
                            self.rsMap[self.pos] = 2;
                        }else{
                            self.rsMap[self.pos] = 3;
                        }
                    }else{
                        alert("もうないよ");
                    }
                    func = self.drawDoMap();
                }else if(x >= 500 && x <= 600){
                    // 戻る気になったらしい。
                    // 諦めて勉強しな
                    self.rsMap[self.pos] += 4;
                    func = self.rtb();
                }
                logger.log("Current position: "+self.pos, 0);
                logger.log("Current map value: "+self.rsMap[self.pos], 0);
                func();
            }
        }
    };
};

var app;
document.addEventListener("DOMContentLoaded", function(){
    app = new Application();
    app.game();
    app.setDoMap(doTest1);
});


var doTest1 = [0,0,1,0,0,0,0,0,0,0];
var doTest2 = [0,1,0,1,0,0,0,0,0,0];
