
; $.extend({
    log: function (message) {
        var now = new Date(),
            y = now.getFullYear(),
            m = now.getMonth() + 1, //！JavaScript中月分是从0开始的
            d = now.getDate(),
            h = now.getHours(),
            min = now.getMinutes(),
            s = now.getSeconds(),
            time = y + '/' + m + '/' + d + ' ' + h + ':' + min + ':' + s;
        console.log(time + ' My App: ' + message);
    }

});

function assertElement(ele) {
    try {
        ele.cloneNode(true);
        if (ele.nodeType != 1 && ele.nodeType != 9) {
            //throw new Error("");        
            return false;//表示这不是一个合法的DOM元素（不是element,也不是document）                
        }
    } catch (e) {
        throw new Error("ele参数不合法");
    }
    return false;
}