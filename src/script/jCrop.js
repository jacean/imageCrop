;
(function (root, $, undefined) {
    //this是document

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
    var defaultConfig = {
        dragBoxCSS: {},
        maskEnable: true,
        maskCSS: {},
        dragEnable: true,
        previewEnable: false,
        previewCSS: {
            width: 200,
            height: 200
        },
        fixRatio: false,
        whRatio: [2, 1],
        flowEnable: true,
        border: 5
    };

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
    var config = $.extend({}, defaultConfig);
    var flags = { crop: false, drag: false };


    function addCornerBox($main, left, top, cursor) {
        $("<div>").appendTo($main).addClass("corner-box").css({
            //减去cornerbox的边线宽度，再加上实际调整  
            left: left - 2,
            top: top - 1,
            cursor: cursor
        });
    };
    function between(dest, h, l) {
        return (dest <= h && dest >= l) || (dest <= l && dest >= h);
    }
    function setDoms(t) {
        var $t = t instanceof jQuery ? t : $(t),
            $doms = {};
        if ($t.hasClass("jcrop-main")) {
            $doms.main = $t;
        }
        if ($t.hasClass("jcrop-img") || $t.hasClass("jcrop-mask") || $t.hasClass("jcrop-db") || $t.hasClass("corner-box")) {
            $doms.main = $t.parent(".jcrop-main");
        }

        if ($doms.main == undefined) {
            return false;
        }
        $doms.current = $t;
        $doms.img = $doms.main.children(".jcrop-img");
        $doms.preMain = $doms.main.children(".jcrop-pre-main");
        $doms.preImg = $doms.main.children(".jcrop-pre-img");
        $doms.mask = $doms.main.children(".jcrop-mask");
        $doms.db = $doms.main.children(".jcrop-db");
        $doms.corner = $doms.main.children(".corner-box");
        return $doms;
    };
    var checkRatio = {
        checkCropRatio: function checkCropRatio(width, height, ratio) {
            /**
            * 当比例固定的时候，检查裁剪比例是否正确，不正确的话以最大值进行规范调整
            * 这里遗留问题
            * 如果鼠标移动在起始点左上，变化的应该是鼠标那边，而不是起始点
            */
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
        },
        checkPreDivRatio: function checkPreDivRatio(width, height, ratio) {
            /**
        * 检查预览框的长宽比例
        * 给定预览框的最大长宽，根据比例进行范围内展示
        * 此时强行修改配置为允许预览
        * checkPreDivRatio(config.previewCSS.width,config.previewCSS.height,config.whRatio);
        * 默认长宽与css内保持一致
        */

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
            return {
                width: newWidth,
                height: newHeight
            }

        }
    }


    var events = {
        mousedown: function mousedown(evt) {
            var $doms = setDoms(evt.target);
            if (!$doms) return;
            evt.preventDefault();

            var crop_coord = {}, drag_coord = {};
            crop_coord.left = $doms.db.position().left;
            crop_coord.top = $doms.db.position().top;
            crop_coord.width = $doms.db.width();
            crop_coord.height = $doms.db.height();

            /**设置鼠标手势 */

            var dragMode = borders.setCornerCursor({ x: evt.pageX, y: evt.pageY }, crop_coord, $doms);
            if (config.dragEnable && (dragMode != dragModeOption.crosshair && dragMode != dragModeOption.default)) {
                $doms.main.data("drag-flag", true);
                $doms.main.data("drag-startX", evt.pageX);
                $doms.main.data("drag-startY", evt.pageY);
                $doms.main.data("drag-src", {
                    left: $doms.db.position().left,
                    top: $doms.db.position().top,
                    width: $doms.db.width(),
                    height: $doms.db.height()
                });
                $doms.main.addClass("dragDom");
                return false;
            }
            if (config.maskEnable) {
                $doms.mask.css({
                    left: $doms.img.position().left,
                    top: $doms.img.position().top,
                    width: $doms.img.width(),
                    height: $doms.img.height()
                }).css("zIndex", 5);
                $doms.mask.show();
            } else {
                $doms.mask.hide();
            }


            if (config.previewEnable) {
                $doms.preMain.show();
            } else {
                $doms.preMain.hide();
            }
            $doms.main.addClass("cropDom");
            $doms.main.data("crop-flag", true);
            $doms.main.data("crop-startX", evt.pageX);
            $doms.main.data("crop-startY", evt.pageY);
            $doms.db.hide();
            $doms.corner.hide();
            $doms.db.width(0);
            $doms.db.height(0);
            return false;
        },
        mousemove: function mousemove(evt) {
            var $t = $(evt.target);
            if ($(".cropDom").length > 0) {
                $t = $(".cropDom")
            }
            if ($(".dragDom").length > 0) {
                $t = $(".dragDom");
            }

            var $doms = setDoms($t);
            if (!$doms) return;
            evt.preventDefault();
            var crop_coord = {}, drag_coord = {};
            crop_coord.left = $doms.db.position().left;
            crop_coord.top = $doms.db.position().top;
            crop_coord.width = $doms.db.width();
            crop_coord.height = $doms.db.height();

            var dragMode = borders.setCornerCursor({ x: evt.pageX, y: evt.pageY }, crop_coord, $doms);


            if ($doms.main.data("crop-flag")) {
                $doms.db.show();
                $doms.corner.show();
                cropStartX = $doms.main.data("crop-startX");
                cropStartY = $doms.main.data("crop-startY");
                crop_coord.left = cropStartX < evt.pageX ? cropStartX : evt.pageX;
                crop_coord.width = Math.abs(cropStartX - evt.pageX);
                crop_coord.top = cropStartY < evt.pageY ? cropStartY : evt.pageY;
                crop_coord.height = Math.abs(cropStartY - evt.pageY);

                var tempRect = checkRatio.checkCropRatio(crop_coord.width, crop_coord.height, config.whRatio);
                crop_coord.width = tempRect.w;
                crop_coord.height = tempRect.h;
                borders.checkArea(crop_coord, $doms.img);
                borders.updatedb(crop_coord, $doms);
                borders.updatePreview($doms);
                return;
            }
            if ($doms.main.data("drag-flag")) {
                $doms.db.show(); $doms.corner.show();
                var dragStartX = $doms.main.data("drag-startX");
                var dragStartY = $doms.main.data("drag-startY");
                crop_coord = $doms.main.data("drag-src");
                switch (dragMode) {
                    case dragModeOption.m:
                        drag_coord.left = crop_coord.left + (evt.pageX - dragStartX);
                        drag_coord.top = crop_coord.top + (evt.pageY - dragStartY);
                        drag_coord.width = crop_coord.width;
                        drag_coord.height = crop_coord.height;
                        break;
                    case dragModeOption.l:

                        drag_coord.left = evt.pageX > crop_coord.left + crop_coord.width ? crop_coord.left + crop_coord.width : evt.pageX;
                        drag_coord.top = crop_coord.top;
                        drag_coord.width = Math.abs(evt.pageX - (crop_coord.left + crop_coord.width));
                        drag_coord.height = crop_coord.height;
                        break;
                    case dragModeOption.r:
                        drag_coord.left = evt.pageX > crop_coord.left ? crop_coord.left : evt.pageX;
                        drag_coord.top = crop_coord.top;
                        drag_coord.width = Math.abs(evt.pageX - crop_coord.left);
                        drag_coord.height = crop_coord.height;
                        break;
                    case dragModeOption.u:
                        drag_coord.left = crop_coord.left;
                        drag_coord.top = evt.pageY > crop_coord.top + crop_coord.height ? crop_coord.top + crop_coord.height : evt.pageY;
                        drag_coord.width = crop_coord.width;
                        drag_coord.height = Math.abs(evt.pageY - (crop_coord.top + crop_coord.height));
                        break;
                    case dragModeOption.d:
                        drag_coord.left = crop_coord.left;
                        drag_coord.top = evt.pageY > crop_coord.top ? crop_coord.top : evt.pageY;
                        drag_coord.width = crop_coord.width;
                        drag_coord.height = Math.abs(evt.pageY - crop_coord.top);
                        break;
                    case dragModeOption.lu:
                        drag_coord.left = evt.pageX > crop_coord.left + crop_coord.width ? crop_coord.left + crop_coord.width : evt.pageX;
                        drag_coord.top = evt.pageY > crop_coord.top + crop_coord.height ? crop_coord.top + crop_coord.height : evt.pageY;
                        drag_coord.width = Math.abs(evt.pageX - (crop_coord.left + crop_coord.width));
                        drag_coord.height = Math.abs(evt.pageY - (crop_coord.top + crop_coord.height));
                        break;
                    case dragModeOption.ld:
                        drag_coord.left = evt.pageX > crop_coord.left + crop_coord.width ? crop_coord.left + crop_coord.width : evt.pageX;
                        drag_coord.top = evt.pageY > crop_coord.top ? crop_coord.top : evt.pageY;
                        drag_coord.width = Math.abs(evt.pageX - (crop_coord.left + crop_coord.width));
                        drag_coord.height = Math.abs(evt.pageY - crop_coord.top);
                        break;
                    case dragModeOption.ru:
                        drag_coord.left = evt.pageX > crop_coord.left ? crop_coord.left : evt.pageX;
                        drag_coord.top = evt.pageY > crop_coord.top + crop_coord.height ? crop_coord.top + crop_coord.height : evt.pageY;
                        drag_coord.width = Math.abs(evt.pageX - crop_coord.left);
                        drag_coord.height = Math.abs(evt.pageY - (crop_coord.top + crop_coord.height));
                        break;
                    case dragModeOption.rd:
                        drag_coord.left = evt.pageX > crop_coord.left ? crop_coord.left : evt.pageX;
                        drag_coord.top = evt.pageY > crop_coord.top ? crop_coord.top : evt.pageY;
                        drag_coord.width = Math.abs(evt.pageX - crop_coord.left);
                        drag_coord.height = Math.abs(evt.pageY - crop_coord.top);
                        break;
                    default:
                        break;
                }
                borders.checkArea(drag_coord, $doms.img);
                borders.updatedb(drag_coord, $doms);
                borders.updatePreview($doms);
                return;
            }

        },
        mouseup: function mouseup(evt) {
            var $t = $(evt.target);
            if ($(".cropDom").length > 0) {
                $t = $(".cropDom")
            }
            if ($(".dragDom").length > 0) {
                $t = $(".dragDom");
            }

            var $doms = setDoms($t);
            if (!$doms) return;

            if ($doms.main.data("crop-flag")) {
                $doms.main.data("crop-flag", false);
                $doms.main.removeClass("cropDom");
                if (!$doms.db || $doms.db.width() == 0 || $doms.db.height() == 0) {
                    $doms.mask.hide();
                    $doms.preMain.hide();
                    $doms.db.hide();
                    $doms.corner.hide();
                }
            }
            if ($doms.main.data("drag-flag")) {
                $doms.main.data("drag-flag", false);
                $doms.main.removeClass("dragDom");
                var crop_coord = {};
                crop_coord.left = $doms.db.position().left;
                crop_coord.top = $doms.db.position().top;
                crop_coord.width = $doms.db.width();
                crop_coord.height = $doms.db.height();
                borders.setCornerCursor({ x: evt.pageX, y: evt.pageY }, crop_coord, $doms);
            }
            borders.setCornerBox($doms);
            return;
        }

    };
    var borders = {
        checkArea: function checkArea(area, $img) {
            /**
            * 边界检查，当选区超出图形则停止变化
            */
            var domRect = {
                left: $img.position().left,
                top: $img.position().top,
                width: $img.width(),
                height: $img.height()
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
        },
        updatedb: function updatedb(current, $doms) {
            var tempRect = {};
            if ($doms.main.data("crop-flag") || $doms.main.data("drag-flag")) {
                tempRect = checkRatio.checkCropRatio(current.width, current.height, config.whRatio);
                current.width = tempRect.w;
                current.height = tempRect.h;
                $doms.db.css({
                    left: current.left,
                    top: current.top,
                    width: current.width,
                    height: current.height
                }).css("zIndex", 10);      //添加后返回的是数组
                borders.setCornerBox($doms);

                var img_pos = $doms.img.offset(), result = {};
                if ($doms.db.css("display") == "none") {
                    result = {
                        left: $doms.db.offset().left - img_pos.left,
                        top: $doms.db.offset().top - img_pos.top,
                        width: $doms.db.width(),
                        height: $doms.db.height()
                    }
                } else {
                    result = {
                        left: 0,
                        top: 0,
                        width: 0,
                        height: 0
                    }
                }
                $doms.main.data("crop", result);
            }


        },
        updatePreview: function updatePreview($doms) {
            /**
            * 通过将原有图片按照裁剪框和预览框的比例进行缩放，以偏移量实现
            */
            if (config.previewEnable) {
                zoom = 1.0;
                $doms.preMain.css(checkRatio.checkPreDivRatio());
                if (config.fixRatio) {
                    if ($doms.main.data("crop-flag")) {
                        // console.log($previewDiv.width());
                        zoom = crop_coord.width / $doms.preMain.width();
                    } if ($doms.main.data("drag-flag")) {
                        zoom = drag_coord.width / $doms.preMain.width();
                    }

                }
                var imgPreWidth = $doms.img.width() / zoom;
                var imgPreHeight = $doms.img.height() / zoom;
                var imgX = $doms.img.position().left;
                var imgY = $doms.img.position().top;
                var boxX = $doms.db.position().left;
                var boxY = $doms.db.position().top;
                var offsetX = (imgX - boxX) / zoom;
                var offsetY = (imgY - boxY) / zoom;
                $doms.preImg.css({
                    width: imgPreWidth,
                    height: imgPreHeight,
                    marginLeft: offsetX,
                    marginTop: offsetY
                });
            }
        },
        setCornerBox: function setCornerBox($doms) {
            if ($doms.db.css("display") == "none") return;
            var db = $doms.db;
            /**
             * 1---2---3
             * |   |   |
             * 4---+---5
             * |   |   |
             * 6---7---8
             */
            $doms.main.children(".corner-box").remove();
            addCornerBox($doms.main, db.position().left - config.border / 2, db.position().top - config.border / 2, dragModeOption.lu);
            addCornerBox($doms.main, db.position().left + db.width() / 2 - config.border / 2, db.position().top - config.border / 2, dragModeOption.u);
            addCornerBox($doms.main, db.position().left + db.width() - config.border / 2, db.position().top - config.border / 2, dragModeOption.ru);
            addCornerBox($doms.main, db.position().left - config.border / 2, db.position().top + db.height() / 2 - config.border / 2, dragModeOption.l);
            addCornerBox($doms.main, db.position().left + db.width() - config.border / 2, db.position().top + db.height() / 2 - config.border / 2, dragModeOption.r);
            addCornerBox($doms.main, db.position().left - config.border / 2, db.position().top + db.height() - config.border, dragModeOption.ld);
            addCornerBox($doms.main, db.position().left + db.width() / 2 - config.border / 2, db.position().top + db.height() - config.border, dragModeOption.d);
            addCornerBox($doms.main, db.position().left + db.width() - config.border / 2, db.position().top + db.height() - config.border, dragModeOption.rd);
            $doms.corner = $doms.main.children(".corner-box");

            if (config.dragEnable) { $doms.corner.show(); } else { $doms.corner.hide(); };

            $doms.db.removeClass("dashed-box");
            $doms.db.children(".dashed-top").remove();
            $doms.db.children(".dashed-left").remove();
            $doms.db.children(".dashed-bottom").remove();
            $doms.db.children(".dashed-right").remove();
            if (!config.flowEnable) {
                $doms.db.addClass("dashed-box");
                return;
            } else {
                $("<div>").appendTo($doms.db).addClass("dashed-top").css("top", 0);
                $("<div>").appendTo($doms.db).addClass("dashed-left").css("left", 0);
                $("<div>").appendTo($doms.db).addClass("dashed-bottom").css("top", $doms.db.height() - 2);
                $("<div>").appendTo($doms.db).addClass("dashed-right").css("left", $doms.db.width() - 2);
            }

        },
        setCornerCursor: function setCornerCursor(point, area, $doms) {
            if ($doms.main.data("drag-flag")) { return $doms.db.css("cursor"); }
            var border = config.border;
            var rect = [
                area.left,
                area.top,
                area.left + area.width,
                area.top + area.height
            ];
            var dragMode = dragModeOption.crosshair;
            if (between(point.x, rect[0] + border, rect[2] - border) && between(point.y, rect[1] + border, rect[3] - border)) {
                dragMode = config.dragEnable ? dragModeOption.m : dragModeOption.default;
            }
            if (config.dragEnable) {
                if (between(point.x, rect[0] - border, rect[0] + border) && between(point.y, rect[1] + border, rect[3] - border)) {
                    dragMode = dragModeOption.l;
                }
                if (between(point.x, rect[2] + border, rect[2] - border) && between(point.y, rect[1] + border, rect[3] - border)) {
                    dragMode = dragModeOption.r;
                }
                if (between(point.x, rect[2] - border, rect[0] + border) && between(point.y, rect[1] - border, rect[1] + border)) {
                    dragMode = dragModeOption.u;
                }

                if (between(point.x, rect[2] - border, rect[0] + border) && between(point.y, rect[3] + border, rect[3] - border)) {
                    dragMode = dragModeOption.d;
                }

                if (between(point.x, rect[0] - border, rect[0] + border) && between(point.y, rect[1] - border, rect[1] + border)) {
                    dragMode = dragModeOption.lu;
                }
                if (between(point.x, rect[0] - border, rect[0] + border) && between(point.y, rect[3] + border, rect[3] - border)) {
                    dragMode = dragModeOption.ld;
                }
                if (between(point.x, rect[2] + border, rect[2] - border) && between(point.y, rect[1] - border, rect[1] + border)) {
                    dragMode = dragModeOption.ru;
                }
                if (between(point.x, rect[2] + border, rect[2] - border) && between(point.y, rect[3] + border, rect[3] - border)) {
                    dragMode = dragModeOption.rd;
                }
            }
            if ($doms.db) $doms.db.css("cursor", dragMode);
            $doms.img.css("cursor", dragMode);
            $doms.mask.css("cursor", dragMode);
            return dragMode;
        }
    };


    var jCrop = function () {
        var previewId = null;
        /**
         * 选区逻辑:
         * 1、在$img上按下鼠标，mask遮罩出现，drag_box出现
         * 2、鼠标在mask上移动，drag_box跟随变化
         * 3、鼠标弹起，判断drag_box的大小，为0则取消drag_box和mask
         * 4、在mask上重新选取，以在mask上按下鼠标开始
         * 5、重复以上
         */
        /**
         * init:初始化，对传入dom元素进行jcrop结构的初始化，使其具有dom->[img,mask,db,preview]的结构，并分别赋予对应cssclass
         * @this:dom元素，element，
         * @param:image,图片路景
         * @param:pId,预览div的id
         */
        function init(image, pId) {
            var $doms = {};
            $doms.main = $(this).addClass("jcrop-main");
            $doms.img = $("<img>").appendTo($doms.main).attr("src", image).addClass("jcrop-img");
            if (pId != undefined) {
                config.previewEnable = true;
                previewId = pId;
                $doms.preMain = $("<div>").appendTo($doms.main).addClass("default-preview-box").css(config.previewCSS).addClass("jcrop-pre-main").hide();
                $doms.preImg = $("<img>").appendTo($doms.preMain).attr("src", image).addClass("jcrop-pre-img").hide();
            }
            $doms.db = $("<div>").appendTo($doms.main).addClass("default-drag-box dashed-box").css(config.dragBoxCSS).addClass("jcrop-db").hide();
            $doms.mask = $("<div>").appendTo($doms.main).addClass("default-mask-box").css(config.maskCSS).addClass("jcrop-mask").hide();//先执行默认的必须格式，然后再被自定义的覆盖，保证基础运行

        }

        function destroy() {
            $doms.remove();
            //如果使所有的话，还需要解绑函数
            $(window).unbind(".jcrop");
        }


        var api = {
            init: init,
            crop: function () {
                return crops.result;
            },
            config: function (opt) {
                config = $.extend({}, defaultConfig, opt);
            },
            destroy: destroy,
            onResize: function () { },
            onMove: function () { }
        };
        return api;
    }

    /**
     * init:{src:image}
     */
    $.fn.jCrop = function (method) {
        var arg = arguments;
        var api = new jCrop();
        if (typeof method === 'string') {
            $(window).bind("mousedown.jcrop", events.mousedown);
            $(window).bind("mousemove.jcrop", events.mousemove);
            $(window).bind("mouseup.jcrop", events.mouseup);
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
        this.each(function () {
            if (api[method]) {
                return api[method].apply(this, Array.prototype.slice.call(arg, 1));
            } else if (typeof method === 'string') {
                return api.init.apply(this, arg);
            } else if (typeof method === "object") {
                return api.config.apply(this, arg);
            }
            else {
                $.error('Method ' + method + ' does not exist on jQuery.jCrop');
            }
        });

    };

    //旋转功能

})(this, jQuery);