
(function (root) {
    //this是document
    root.jCrop = function () {
        var dom;
        var db, mask, flowInter;
        var previewImg, previewId = null, previewDiv;
        var cropInProgress = false, dragInProgress = false;
        var coord = {
            left: 0,
            top: 0,
            width: 0,
            height: 0
        }
        var cropCoord = {
            left: 0,
            width: 0,
            top: 0,
            height: 0
        };
        var dragModeOption = {
            default: "auto",
            crosshair: "crosshair",
            m: "move",
            l: "w-resize",
            r: "e-resize",
            u: "n-resize",
            d: "s-resize",
            lu: "nw-resize",
            ld: "sw-resize",
            ru: "ne-resize",
            rd: "se-resize"
        };
        var dragMode = dragModeOption.default;
        var dragCoord = {}, dragStart = {};
        var option = {
            color: {
                red: "#ff0000",
                blue: "#0000ff",
                green: "#00ff00",
                gray: "#eeeeee"
            },
            opacity: {
                no: 0,
                low: 0.2,
                mid: 0.5,
                high: 0.8,
                full: 1
            }

        }

        /**
         * 选区逻辑:
         * 1、在dom上按下鼠标，mask遮罩出现，drag_box出现
         * 2、鼠标在mask上移动，drag_box跟随变化
         * 3、鼠标弹起，判断drag_box的大小，为0则取消drag_box和mask
         * 4、在mask上重新选取，以在mask上按下鼠标开始
         * 5、重复以上
         */
        function init(elementId, image, pId) {
            dom = $("#" + elementId);
            dom.attr("src", image);
            if (pId != undefined) {
                previewId = pId;
                config.previewEnable = true;
                initPreview(previewId);
                previewDiv.hide();
            }
            mask = $("<div>").appendTo("body").attr("id", "mask_box").addClass("default-mask-box").css(config.maskCSS);//先执行默认的必须格式，然后再被自定义的覆盖，保证基础运行
            mask.css("cursor", dragModeOption.crosshair);
            dom.css("cursor", dragModeOption.crosshair);
            dom.mousedown(mousedown);
            mask.mousedown(mousedown);
            $(window).mousemove(mousemove);
            $(window).mouseup(mouseup);
        }
        function mousedown(evt) {
            if (config.maskEnable) {
                mask.css({
                    left: dom.position().left,
                    top: dom.position().top,
                    width: dom.width(),
                    height: dom.height()
                }).css("zIndex", 5);
                mask.show();
            } else {
                mask.hide();
            }
            if (previewDiv != undefined) previewDiv.hide();
            if (config.previewEnable) {
                previewDiv.show();
            } else { previewDiv.hide(); }
            if (db != undefined) { db.remove(); db = null; }

            cropInProgress = true;
            evt.preventDefault();
            cropInProgress = true;

            mouseDown_left = evt.pageX;
            mouseDown_top = evt.pageY;

            cropCoord.left = mouseDown_left;
            cropCoord.width = 0;
            cropCoord.top = mouseDown_top;
            cropCoord.height = 0;

            return false;
        }
        function mousemove(evt) {

            if (cropInProgress) {
                cropCoord.left = mouseDown_left < evt.pageX ? mouseDown_left : evt.pageX;
                cropCoord.width = Math.abs(mouseDown_left - evt.pageX);
                cropCoord.top = mouseDown_top < evt.pageY ? mouseDown_top : evt.pageY;
                cropCoord.height = Math.abs(mouseDown_top - evt.pageY);

                var tempRect = checkCropRatio(cropCoord.width, cropCoord.height, config.whRatio);
                cropCoord.width = tempRect.w;
                cropCoord.height = tempRect.h;
                checkArea(cropCoord);
                updatedb();
                updatePreview();

            } else if (dragInProgress) {
                switch (dragMode) {
                    case dragModeOption.m:
                        dragCoord.left = cropCoord.left + (evt.pageX - dragStart.x);
                        dragCoord.top = cropCoord.top + (evt.pageY - dragStart.y);
                        dragCoord.width = cropCoord.width;
                        dragCoord.height = cropCoord.height;
                        break;
                    case dragModeOption.l:
                        dragCoord.left = evt.pageX > cropCoord.left + cropCoord.width ? cropCoord.left + cropCoord.width : evt.pageX;
                        dragCoord.top = cropCoord.top;
                        dragCoord.width = Math.abs(evt.pageX - (cropCoord.left + cropCoord.width));
                        dragCoord.height = cropCoord.height;
                        break;
                    case dragModeOption.r:
                        dragCoord.left = evt.pageX > cropCoord.left ? cropCoord.left : evt.pageX;
                        dragCoord.top = cropCoord.top;
                        dragCoord.width = Math.abs(evt.pageX - cropCoord.left);
                        dragCoord.height = cropCoord.height;
                        break;
                    case dragModeOption.u:
                        dragCoord.left = cropCoord.left;
                        dragCoord.top = evt.pageY > cropCoord.top + cropCoord.height ? cropCoord.top + cropCoord.height : evt.pageY;
                        dragCoord.width = cropCoord.width;
                        dragCoord.height = Math.abs(evt.pageY - (cropCoord.top + cropCoord.height));
                        break;
                    case dragModeOption.d:
                        dragCoord.left = cropCoord.left;
                        dragCoord.top = evt.pageY > cropCoord.top ? cropCoord.top : evt.pageY;
                        dragCoord.width = cropCoord.width;
                        dragCoord.height = Math.abs(evt.pageY - cropCoord.top);
                        break;
                    case dragModeOption.lu:
                        dragCoord.left = evt.pageX > cropCoord.left + cropCoord.width ? cropCoord.left + cropCoord.width : evt.pageX;
                        dragCoord.top = evt.pageY > cropCoord.top + cropCoord.height ? cropCoord.top + cropCoord.height : evt.pageY;
                        dragCoord.width = Math.abs(evt.pageX - (cropCoord.left + cropCoord.width));
                        dragCoord.height = Math.abs(evt.pageY - (cropCoord.top + cropCoord.height));
                        break;
                    case dragModeOption.ld:
                        dragCoord.left = evt.pageX > cropCoord.left + cropCoord.width ? cropCoord.left + cropCoord.width : evt.pageX;
                        dragCoord.top = evt.pageY > cropCoord.top ? cropCoord.top : evt.pageY;
                        dragCoord.width = Math.abs(evt.pageX - (cropCoord.left + cropCoord.width));
                        dragCoord.height = Math.abs(evt.pageY - cropCoord.top);
                        break;
                    case dragModeOption.ru:
                        dragCoord.left = evt.pageX > cropCoord.left ? cropCoord.left : evt.pageX;
                        dragCoord.top = evt.pageY > cropCoord.top + cropCoord.height ? cropCoord.top + cropCoord.height : evt.pageY;
                        dragCoord.width = Math.abs(evt.pageX - cropCoord.left);
                        dragCoord.height = Math.abs(evt.pageY - (cropCoord.top + cropCoord.height));
                        break;
                    case dragModeOption.rd:
                        dragCoord.left = evt.pageX > cropCoord.left ? cropCoord.left : evt.pageX;
                        dragCoord.top = evt.pageY > cropCoord.top ? cropCoord.top : evt.pageY;
                        dragCoord.width = Math.abs(evt.pageX - cropCoord.left);
                        dragCoord.height = Math.abs(evt.pageY - cropCoord.top);
                        break;
                    default:
                        break;
                }
                checkArea(dragCoord);
                updatedb();
                updatePreview();

            } else {
                setCorner({ x: evt.pageX, y: evt.pageY }, cropCoord);
            }
        }

        /**
         * 边界检查，当选区超出图形则停止变化
         */
        function checkArea(area) {
            var domRect = {
                left: dom.position().left,
                top: dom.position().top,
                width: dom.width(),
                height: dom.height()
            }

            if (area.left > domRect.left) {

                if (area.left + area.width > domRect.left + domRect.width) {
                    area.width = domRect.left + domRect.width - area.left;
                }
                if (area.left > domRect.left + domRect.width) {
                    area.left = domRect.left + domRect.width;
                    area.width = 0;
                }
            } else {
                area.width = area.width - (domRect.left - area.left);
                area.left = domRect.left;
            }
            if (area.top > domRect.top) {
                if (area.top + area.height > domRect.top + domRect.height) {
                    area.height = domRect.top + domRect.height - area.top;
                }
                if (area.top > domRect.top + domRect.height) {
                    area.top = domRect.top + domRect.height;
                    area.height = 0;
                }
            } else {
                area.height = area.height - (domRect.top - area.top);
                area.top = domRect.top;

            }
        }
        function dbmousedown(evt) {
            evt.preventDefault();
            if (config.dragEnable) {
                dragInProgress = true;
                dragStart.x = evt.pageX;
                dragStart.y = evt.pageY;
            }
            return false;
        }

        function mouseup(evt) {

            if (cropInProgress) {
                cropInProgress = false;
                if (!db || db.width() == 0 || db.height() == 0) {
                    mask.hide();
                    previewDiv.hide();
                    if (db) { db.remove();db=null; }
                    clearInterval(flowInter);
                }
            }
            if (dragInProgress) {
                dragInProgress = false;
                var img_pos = dom.offset();
                coord = {
                    left: db.offset().left - img_pos.left,
                    top: db.offset().top - img_pos.top,
                    width: db.width(),
                    height: db.height()
                }
                cropCoord.left = dragCoord.left;
                cropCoord.top = dragCoord.top;
                cropCoord.width = dragCoord.width;
                cropCoord.height = dragCoord.height;
                setCorner({ x: evt.pageX, y: evt.pageY }, cropCoord);
            }
            setFlowBox(db);
            return;
        }

        function updatedb() {
            var tempRect, current;
            if (db) db.remove();
            db = $("<div>").appendTo("body").attr("id", "drag_box").addClass("default-drag-box dashed-box").css(config.dragBoxCSS);
            db.mousemove(mousemove);
            db.mousedown(dbmousedown);

            if (cropInProgress) {
                tempRect = checkCropRatio(cropCoord.width, cropCoord.height, config.whRatio);
                cropCoord.width = tempRect.w;
                cropCoord.height = tempRect.h;
                current = cropCoord;
            }
            if (dragInProgress) {
                tempRect = checkCropRatio(dragCoord.width, dragCoord.height, config.whRatio);
                dragCoord.width = tempRect.w;
                dragCoord.height = tempRect.h;
                current = dragCoord;
            }

            db.css({
                left: current.left,
                top: current.top,
                width: current.width,
                height: current.height
            }).css("zIndex", 10);      //添加后返回的是数组
            setFlowBox(db);

        }
        /**
         * 通过将原有图片按照裁剪框和预览框的比例进行缩放，以偏移量实现
         */
        function updatePreview() {
            //预览模式下保证长宽比例好进行直观预览
            if (config.previewEnable) {
                zoom = 1.0;
                checkPreDivRatio();
                if (config.fixRatio) {
                    if (cropInProgress) {
                        // console.log(previewDiv.width());
                        zoom = cropCoord.width / previewDiv.width();
                    } if (dragInProgress) {
                        zoom = dragCoord.width / previewDiv.width();
                    }

                }
                var imgPreWidth = dom.width() / zoom;
                var imgPreHeight = dom.height() / zoom;
                var imgX = dom.position().left;
                var imgY = dom.position().top;
                var boxX = db.position().left;
                var boxY = db.position().top;
                var offsetX = (imgX - boxX) / zoom;
                var offsetY = (imgY - boxY) / zoom;
                previewImg.css({
                    width: imgPreWidth,
                    height: imgPreHeight,
                    marginLeft: offsetX,
                    marginTop: offsetY
                });
            }
        }

        function addCornerBox(left, top) {
            $("<div>").appendTo("body").addClass("corner-box").css({
                //减去cornerbox的边线宽度，再加上实际调整  
                left: left - 2,
                top: top - 1
            });
        }
        function setFlowBox(db) {

            $(".corner-box").remove();
            if (!db) { return; }
            if (config.dragEnable) {
                /**
                 * 1---2---3
                 * |   |   |
                 * 4---+---5
                 * |   |   |
                 * 6---7---8
                 */
                addCornerBox(db.position().left - config.border / 2, db.position().top - config.border / 2);
                addCornerBox(db.position().left + db.width() / 2 - config.border / 2, db.position().top - config.border / 2);
                addCornerBox(db.position().left + db.width() - config.border / 2, db.position().top - config.border / 2);
                addCornerBox(db.position().left - config.border / 2, db.position().top + db.height() / 2 - config.border / 2);
                addCornerBox(db.position().left + db.width() - config.border / 2, db.position().top + db.height() / 2 - config.border / 2);
                addCornerBox(db.position().left - config.border / 2, db.position().top + db.height() - config.border);
                addCornerBox(db.position().left + db.width() / 2 - config.border / 2, db.position().top + db.height() - config.border);
                addCornerBox(db.position().left + db.width() - config.border / 2, db.position().top + db.height() - config.border);
            }
            if (!config.flowEnable) {
                clearInterval(flowInter);
                db.addClass("dashed-box");
                $(".dashed-top").remove();
                $(".dashed-left").remove();
                $(".dashed-bottom").remove();
                $(".dashed-right").remove();
                return;
            } else {
                if (db.hasClass("dashed-box")) {
                    db.removeClass("dashed-box");
                    $("<div>").appendTo(db).addClass("dashed-top").css("top", 0);
                    $("<div>").appendTo(db).addClass("dashed-left").css("left", 0);
                    $("<div>").appendTo(db).addClass("dashed-bottom").css("top", db.height() - 2);
                    $("<div>").appendTo(db).addClass("dashed-right").css("left", db.width() - 2);
                    clearInterval(flowInter);
                    flowInter = setInterval(function () {
                        var $left = $(".dashed-top").css("left");
                        var $top = $(".dashed-bottom").css("left");
                        $left = parseInt($left);
                        $top = parseInt($top);
                        if ($left < 0) {
                            $left += 2;
                        }
                        else {
                            $left = -1400;
                        }
                        if ($top > -1000) {
                            $top -= 2;
                        }
                        else {
                            $top = 0;
                        }
                        $(".dashed-top").css("left", $left + "px");
                        $(".dashed-right").css("top", $left + "px");
                        $(".dashed-bottom").css("left", $top + "px");
                        $(".dashed-left").css("top", $top + "px");
                    }, 60);
                }
            }
        }
        /**
         * 当比例固定的时候，检查裁剪比例是否正确，不正确的话以最大值进行规范调整
         * 这里遗留问题
         * 如果鼠标移动在起始点左上，变化的应该是鼠标那边，而不是起始点
         */
        function checkCropRatio(width, height, ratio) {
            var newWidth = width;
            var newHeight = height;

            if (config.fixRatio) {
                if (ratio instanceof Array) {
                    if (ratio.length == 2) {
                        ratio = (parseFloat(ratio[0]) / (parseFloat(ratio[1]) || 1)) || 1;
                    }
                    else ratio = parseFloat(ratio[0]) || 1;
                } else {
                    ratio = parseFloat(ratio) || 1;
                }

                if (width / height < ratio) {
                    newWidth = height * ratio;
                    newHeight = height;
                } else {
                    newHeight = width / ratio;
                    newWidth = width;
                }
            }
            return {
                w: newWidth,
                h: newHeight
            }
        }
        /**
         * 检查预览框的长宽比例
         * 给定预览框的最大长宽，根据比例进行范围内展示
         * 此时强行修改配置为允许预览
         * checkPreDivRatio(config.previewCSS.width,config.previewCSS.height,config.whRatio);
         * 默认长宽与css内保持一致
         */
        function checkPreDivRatio(width, height, ratio) {
            if (!previewId) {
                return;
            }
            width = typeof width !== 'undefined' ? width : config.previewCSS.width;
            height = typeof height !== 'undefined' ? height : config.previewCSS.height;
            ratio = typeof ratio !== 'undefined' ? ratio : config.whRatio;
            if (ratio instanceof Array) {
                if (ratio.length == 2) {
                    ratio = (parseFloat(ratio[0]) / (parseFloat(ratio[1]) || 1)) || 1;
                }
                else ratio = parseFloat(ratio[0]) || 1;
            } else {
                ratio = parseFloat(ratio) || 1;
            }

            var newWidth = width;
            var newHeight = height;
            if (ratio >= 1) {
                newHeight = width / ratio;
                newWidth = width;
            } else {
                newWidth = height * ratio;
                newHeight = height;
            }
            previewDiv.css({
                width: newWidth,
                height: newHeight
            });

        }
        function initPreview(pId) {
            previewId = pId;
            previewDiv = $("#" + previewId).addClass("default-preview-box").css(config.previewCSS);
            checkPreDivRatio();
            previewImg = $("<img>").appendTo("#" + previewId).attr("id", "preview_box").attr("src", image);
            if (!config.previewEnable) {
                previewDiv.hide();
            }
        }


        function setCorner(point, area) {
            if (dragInProgress) {
                return;
            }
            if (!db) return;
            var border = config.border;
            var rect = [
                area.left,
                area.top,
                area.left + area.width,
                area.top + area.height
            ];
            dragMode = dragModeOption.crosshair;
            if (between(point.x, rect[0] + border, rect[2] - border) && between(point.y, rect[1] + border, rect[3] - border)) {
                dragMode = config.dragEnable ? dragModeOption.m : dragModeOption.default;
            }
            if (config.dragEnable) {
                if (between(point.x, rect[0], rect[0] + border) && between(point.y, rect[1] + border, rect[3] - border)) {
                    dragMode = dragModeOption.l;
                }
                if (between(point.x, rect[2], rect[2] - border) && between(point.y, rect[1] + border, rect[3] - border)) {
                    dragMode = dragModeOption.r;
                }
                if (between(point.x, rect[2] - border, rect[0] + border) && between(point.y, rect[1], rect[1] + border)) {
                    dragMode = dragModeOption.u;
                }

                if (between(point.x, rect[2] - border, rect[0] + border) && between(point.y, rect[3], rect[3] - border)) {
                    dragMode = dragModeOption.d;
                }

                if (between(point.x, rect[0], rect[0] + border) && between(point.y, rect[1], rect[1] + border)) {
                    dragMode = dragModeOption.lu;
                }
                if (between(point.x, rect[0], rect[0] + border) && between(point.y, rect[3], rect[3] - border)) {
                    dragMode = dragModeOption.ld;
                }
                if (between(point.x, rect[2], rect[2] - border) && between(point.y, rect[1], rect[1] + border)) {
                    dragMode = dragModeOption.ru;
                }
                if (between(point.x, rect[2], rect[2] - border) && between(point.y, rect[3], rect[3] - border)) {
                    dragMode = dragModeOption.rd;
                }
            }
            db.css("cursor", dragMode);
            dom.css("cursor", dragMode);
            mask.css("cursor", dragMode);
        }


        function between(dest, h, l) {
            return (dest <= h && dest >= l) || (dest <= l && dest >= h);
        }


        function updateConfig() {



        }

        function refresh() {
            updateConfig();
        }
        function destroy() {
            db.remove();
            mask.remove();
            db = null;
            mask = null;
        }

        function crop() {
            return coord;
        }

        function cancel() {
            destroy();
        }

        var config = {
            dragBoxCSS: {},
            maskEnable: true,
            maskCSS: {},
            dragEnable: true,
            previewEnable: true,
            previewCSS: {
                width: 200,
                height: 200
            },
            fixRatio: false,
            whRatio: [2, 1],
            flowEnable: true,
            border: 5
        };

        return {
            init: init,
            initPreview: initPreview,
            config: config,
            option: option,
            setPreDivRect: checkPreDivRatio,
            crop: crop,
            cancel: cancel,
            refresh: refresh

        }
    } ();

    //旋转功能

})(this);