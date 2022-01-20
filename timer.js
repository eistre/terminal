//https://stackoverflow.com/questions/36563749/how-i-extend-settimeout-on-nodejs
//author: jfriend00
//added function newTime.
module.exports = class Timer {
    constructor(t, fn) {
        this.fn = fn;
        this.time = Date.now() + t;
        this.updateTimer();
    }

    addTime(t) {
        this.time += t;
        this.updateTimer();
    }

    //Takes in Date object.
    newTime(t) {
        this.time = Date.now() + t;
        this.updateTimer();
    }

    stop() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }

    updateTimer() {
        var self = this;
        this.stop();
        var delta = this.time - Date.now();
        if (delta > 0) {
            this.timer = setTimeout(function () {
                self.timer = null;
                self.fn();
            }, delta);
        }
    }
}
/**Tests
 * 
 var killTimers = {}
 var timerz = new Timer(3000, ()=>{console.log("DoneZ!")})
 killTimers[0]=timerz;
 var timerp = new Timer(3000, ()=>{console.log("DoneP")})
 killTimers[1]=timerp;
 
 if(killTimers[0])
 new Timer(2000, () => {killTimers[0].newTime(1000); console.log("z pikendatud")})
 else console.log("TimerZ polnud olemas :(")
 */