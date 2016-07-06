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

    var jCrop = function () {
        var baseClass ;
        var $img, $dom;
        var $db, $mask, flowInter;
        var $previewImg, previewId = null, $previewDiv;
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

        var dragMode = dragModeOption.default;
        var dragCoord = {}, dragStart = {};
        var drags = {

        };

        function addBaseClass(_$doms) {
            for (i = 0, l = _$doms.length; i < l; i++) {
                _$doms[i].addClass(baseClass);
            }

        }

        /**
         * 选区逻辑:
         * 1、在$img上按下鼠标，mask遮罩出现，drag_box出现
         * 2、鼠标在mask上移动，drag_box跟随变化
         * 3、鼠标弹起，判断drag_box的大小，为0则取消drag_box和mask
         * 4、在mask上重新选取，以在mask上按下鼠标开始
         * 5、重复以上
         */
        function init(image, pId) {
            baseClass = "jcrop-" + (this.id || parseInt(Math.random() * 10000));
            $dom = $(this);
            $img = $("<img>").appendTo($dom).attr("src", image);
            if (pId != undefined) {
                previewId = pId;
                config.previewEnable = true;
                initPreview(previewId);
                $previewDiv.hide();
            }
            $mask = $("<div>").appendTo($dom).attr("id", "mask_box").addClass("default-mask-box").css(config.maskCSS);//先执行默认的必须格式，然后再被自定义的覆盖，保证基础运行
           
            addBaseClass([$dom, $img, $mask]);
            $("."+baseClass).unbind(".jcrop");
            $("."+baseClass).bind("mousedown.jcrop", events.mousedown);
            $("."+baseClass).bind("mousemove.jcrop", events.mousemove);
            $("."+baseClass).bind("mouseup.jcrop", events.mouseup);
        }

        var events = {
            mousedown: function mousedown(evt) {
                console.log(evt.target);
                if (!checkTarget(evt.target)) return;
                evt.preventDefault();
                if (config.dragEnable && (dragMode != dragModeOption.crosshair && dragMode != dragModeOption.default)) {
                    dragInProgress = true;
                    dragStart.x = evt.pageX;
                    dragStart.y = evt.pageY;
                    return false;
                }
                if (config.maskEnable) {
                    $mask.css({
                        left: $img.position().left,
                        top: $img.position().top,
                        width: $img.width(),
                        height: $img.height()
                    }).css("zIndex", 5);
                    $mask.show();
                } else {
                    $mask.hide();
                }

                if ($previewDiv != undefined) $previewDiv.hide();
                if (config.previewEnable) {
                    $previewDiv.show();
                }
                if ($db != undefined) { $db.remove(); $db = null; }

                cropInProgress = true;


                mouseDown_left = evt.pageX;
                mouseDown_top = evt.pageY;

                cropCoord.left = mouseDown_left;
                cropCoord.width = 0;
                cropCoord.top = mouseDown_top;
                cropCoord.height = 0;
                return false;
            },
            mousemove: function mousemove(evt) {
                borders.setCornerCursor({ x: evt.pageX, y: evt.pageY }, cropCoord);
                if (cropInProgress || dragInProgress) {
                    if (cropInProgress) {
                        cropCoord.left = mouseDown_left < evt.pageX ? mouseDown_left : evt.pageX;
                        cropCoord.width = Math.abs(mouseDown_left - evt.pageX);
                        cropCoord.top = mouseDown_top < evt.pageY ? mouseDown_top : evt.pageY;
                        cropCoord.height = Math.abs(mouseDown_top - evt.pageY);

                        var tempRect = checkCropRatio(cropCoord.width, cropCoord.height, config.whRatio);
                        cropCoord.width = tempRect.w;
                        cropCoord.height = tempRect.h;
                        borders.checkArea(cropCoord);
                    }
                    if (dragInProgress) {
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

                        borders.checkArea(dragCoord);
                    }
                    borders.updatedb();
                    borders.updatePreview();
                    if ($db) {
                        var img_pos = $img.offset();
                        coord = {
                            left: $db.offset().left - img_pos.left,
                            top: $db.offset().top - img_pos.top,
                            width: $db.width(),
                            height: $db.height()
                        }
                    } else {
                        coord = {
                            left: 0,
                            top: 0,
                            width: 0,
                            height: 0
                        }
                    }
                }

            },
            mouseup: function mouseup(evt) {
                if (cropInProgress) {
                    cropInProgress = false;
                    if (!$db || $db.width() == 0 || $db.height() == 0) {
                        $mask.hide();
                        if ($previewDiv != undefined) $previewDiv.hide();
                        if ($db) { $db.remove(); $db = null; }
                        clearInterval(flowInter);
                    }
                }
                if (dragInProgress) {
                    dragInProgress = false;
                    cropCoord.left = dragCoord.left;
                    cropCoord.top = dragCoord.top;
                    cropCoord.width = dragCoord.width;
                    cropCoord.height = dragCoord.height;
                    borders.setCornerCursor({ x: evt.pageX, y: evt.pageY }, cropCoord);
                }
                borders.setCornerBox($db);

                return;
            }

        };

        var borders = {
            checkArea: function checkArea(area) {
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
            updatedb: function updatedb() {
                var tempRect, current;
                if ($db) $db.remove();
                $db = $("<div>").appendTo($dom).attr("id", "drag_box").addClass("default-drag-box dashed-box").css(config.dragBoxCSS);

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

                $db.css({
                    left: current.left,
                    top: current.top,
                    width: current.width,
                    height: current.height
                }).css("zIndex", 10);      //添加后返回的是数组
                borders.setCornerBox($db);

            },
            updatePreview: function updatePreview() {
                /**
                * 通过将原有图片按照裁剪框和预览框的比例进行缩放，以偏移量实现
                */

                //预览模式下保证长宽比例好进行直观预览
                if (config.previewEnable) {
                    zoom = 1.0;
                    checkPreDivRatio();
                    if (config.fixRatio) {
                        if (cropInProgress) {
                            // console.log($previewDiv.width());
                            zoom = cropCoord.width / $previewDiv.width();
                        } if (dragInProgress) {
                            zoom = dragCoord.width / $previewDiv.width();
                        }

                    }
                    var imgPreWidth = $img.width() / zoom;
                    var imgPreHeight = $img.height() / zoom;
                    var imgX = $img.position().left;
                    var imgY = $img.position().top;
                    var boxX = $db.position().left;
                    var boxY = $db.position().top;
                    var offsetX = (imgX - boxX) / zoom;
                    var offsetY = (imgY - boxY) / zoom;
                    $previewImg.css({
                        width: imgPreWidth,
                        height: imgPreHeight,
                        marginLeft: offsetX,
                        marginTop: offsetY
                    });
                }
            },
            setCornerBox: function setCornerBox(db) {

                $dom.children().remove(".corner-box");
                if (!db) { return; }
                if (config.dragEnable) {
                    /**
                     * 1---2---3
                     * |   |   |
                     * 4---+---5
                     * |   |   |
                     * 6---7---8
                     */
                    addCornerBox(db.position().left - config.border / 2, db.position().top - config.border / 2, dragModeOption.lu);
                    addCornerBox(db.position().left + db.width() / 2 - config.border / 2, db.position().top - config.border / 2, dragModeOption.u);
                    addCornerBox(db.position().left + db.width() - config.border / 2, db.position().top - config.border / 2, dragModeOption.ru);
                    addCornerBox(db.position().left - config.border / 2, db.position().top + db.height() / 2 - config.border / 2, dragModeOption.l);
                    addCornerBox(db.position().left + db.width() - config.border / 2, db.position().top + db.height() / 2 - config.border / 2, dragModeOption.r);
                    addCornerBox(db.position().left - config.border / 2, db.position().top + db.height() - config.border, dragModeOption.ld);
                    addCornerBox(db.position().left + db.width() / 2 - config.border / 2, db.position().top + db.height() - config.border, dragModeOption.d);
                    addCornerBox(db.position().left + db.width() - config.border / 2, db.position().top + db.height() - config.border, dragModeOption.rd);
                }
                if (!config.flowEnable) {
                    clearInterval(flowInter);
                    db.addClass("dashed-box");
                    db.remove(".dashed-top");
                    db.remove(".dashed-left");
                    db.remove(".dashed-bottom");
                    db.remove(".dashed-right");
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
            },
            setCornerCursor: function setCornerCursor(point, area) {
                if (dragInProgress) {
                    return;
                }
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
                if ($db) $db.css("cursor", dragMode);
                $img.css("cursor", dragMode);
                $mask.css("cursor", dragMode);
                // $(window).css("cursor",dragMode);
            }
        };

        function addCornerBox(left, top, cursor) {
            $("<div>").appendTo($dom).addClass("corner-box").css({
                //减去cornerbox的边线宽度，再加上实际调整  
                left: left - 2,
                top: top - 1,
                cursor: cursor
            });
        };

        function checkTarget(t) {
            var targets = [$dom, $db, $img, $mask, $previewDiv, $previewImg];
            return inArray($(t), targets) || inArray($(t), $(".corner-box"));
        };
        function inArray(t, arr) {
            for (var i = 0, k = arr.length; i < k; i++) {
                var x = arr[i];
                if (t.is(arr[i])) {
                    return true;
                }
            }
            // 如果不在数组中就会返回false 
            return false;
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
            $previewDiv.css({
                width: newWidth,
                height: newHeight
            });

        }
        function initPreview(pId) {
            previewId = pId;
            $previewDiv = $("#" + previewId).addClass("default-preview-box").css(config.previewCSS);
            checkPreDivRatio();
            $previewImg = $("<img>").appendTo("#" + previewId).attr("id", "preview_box").attr("src", image);
            if (!config.previewEnable) {
                $previewDiv.hide();
            }
        }




        function between(dest, h, l) {
            return (dest <= h && dest >= l) || (dest <= l && dest >= h);
        }

        function destroy() {
            $db.remove();
            $mask.remove();
            $db = null;
            $mask = null;
        }


        var config = $.extend({}, defaultConfig);

        var api = {
            init: init,
            crop: function () {
                return coord;
            },
            config: function (opt) {
                config = $.extend({}, defaultConfig, opt);
            },
            setPreDivRect: checkPreDivRatio,
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
        return this.each(function () {
            var api = new jCrop();
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