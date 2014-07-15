/**
 * 创建框选单元格插件
 * Created by linder on 2014/7/14.
 */
(function ($, undefined) {
  'use strict';
  $.schedulePickerPlugins = $.schedulePickerPlugins || {};
  var pluginsName = 'regionCell';
  var regionCell = function () {
    var shared;
    return {
      loadPlugin: function (picker) {
        if (!shared) {
          shared = pluginsInstance();
          shared.setPicker(picker);
          shared.initEvent();
        }
      }
    };
  }();

  $.schedulePickerPlugins[pluginsName] = regionCell;

  var pluginsInstance = function () {
    var instance = {
      mouseStatus: 0,//鼠标状态，0为弹起，1为按下
      //用来框选处理单元格数据和状态
      region: {
        startCell: undefined,//开始单元格
        endCell: undefined,//结束单元格
        row: 0,//行
        col: 0,//列
        zone: [0, 0, 0, 0],//选择的区域
        dir: ''//移动的方向
      },

      createElement: function () {
        var rangeTop = $('<div class="range-box" />').appendTo(document.body),
          rangeLeft = $('<div class="range-box" />').appendTo(document.body),
          rangeBottom = $('<div class="range-box" />').appendTo(document.body),
          rangeRight = $('<div class="range-box" />').appendTo(document.body);

        this.rangeEl = {
          top: rangeTop,
          left: rangeLeft,
          bottom: rangeBottom,
          right: rangeRight
        };
      },

      setPicker: function (picker) {
        this.picker = picker;
      },

      getDirection: function (e) {
        var s = e.getTarget();
        var ele = this.findParentByClass(s, this.classes.resizeable, null, true);

        if (!ele) {
          return "";
        }

        var el = ele.dom;
        var xPos, yPos, offset, dir;
        dir = "";
        xPos = parseInt(e.getPageX() - Ext.fly(e.getTarget()).getX() + 1);
        yPos = parseInt(e.getPageY() - Ext.fly(e.getTarget()).getY() + 1);
        offset = 5;

        var srcHeight = ele.getHeight(true);
        var srcWidth = ele.getWidth(true);
        var borderWidth = ele.getBorderWidth('r');
        var tmpDir = "";
        if (yPos >= srcHeight - offset + borderWidth) {
          // 不是最后一列
          if (ele.parent('', false).next('', false)) {
            tmpDir = "s";
          }
        }
        if (xPos >= srcWidth - offset + borderWidth) {
          // 不是最后一行
          if (ele.next('', false)) {
            tmpDir = "e";
          }
        }

        dir = tmpDir;
        return dir;
      },

      initEvent: function () {
        var self = this,
          picker = this.picker;
        //鼠标按下
        picker.find('[data-calendar-items]').mousedown(function (e) {
          var el = $(e.target);
          if (el[0].tagName !== 'LI' || e.button === 2) {
            return;
          }
          if (e.button === 0) {// 左键
            var row = el.attr('row'),
              col = el.attr('col');
            self.mouseStatus = 1;
            $.extend(self.region, {
              startCell: [row, col],
              endCell: [row, col]
            });

//            //定位区域
//            var top = e.pageY,
//              left = e.pageX;
//            self.rangeEl.css({
//              top: top,
//              left: left
//            });
          }
        });

        //鼠标移动
        picker.find('[data-calendar-items]').mousemove(function (e) {
          if (self.mouseStatus === 1) {
            var el = $(e.target),
              row = el.attr('row'),
              col = el.attr('col');
            self.region.endCell = [row, col];

            var zone = self.getZoneCoordinate();
            self.setRange(zone);
          }
        });

        //鼠标弹起
        picker.find('[data-calendar-items]').mouseup(function (e) {
          if (self.mouseStatus === 1) {
            var el = $(e.target),
              row = el.attr('row'),
              col = el.attr('col');
            self.region.endCell = [row, col];
            self.mouseStatus = 0;
            self.resetActiveZone();
            //self.rangeEl.hide();
          }
        });

      },

      resetActiveZone: function () {
        var startCell = this.region.startCell,
          endCell = this.region.endCell;
        if (startCell[0] === endCell[0] && startCell[1] === endCell[1]) {
          return;
        }

        var picker = this.picker;
        var top = startCell[0],
          left = startCell[1],
          bottom = endCell[0],
          right = endCell[1];

        var _max = Math.max(top, bottom), _min = Math.min(top, bottom);
        top = _min;
        bottom = _max;
        _max = Math.max(left, right);
        _min = Math.min(left, right);
        left = _min;
        right = _max;

        var schedulePicker = picker.data('schedulePicker');
        var calendarItemData = schedulePicker.calendarItemData;
        var settings = schedulePicker.settings;
        for (var i = top; i <= bottom; i++) {
          for (var j = left; j <= right; j++) {
            var calendarItem = picker.find('li[row="' + i + '"][col="' + j + '"]');
            calendarItem.addClass(settings.style.itemActive);
            var index = calendarItem.attr('data-calendar-item');
            calendarItemData[index].selected = true;
          }
        }
      },

      getZoneCoordinate: function () {
        var startCell = this.region.startCell,
          endCell = this.region.endCell;
        var top = startCell[0],
          left = startCell[1],
          bottom = endCell[0],
          right = endCell[1];

        var _max = Math.max(top, bottom), _min = Math.min(top, bottom);
        top = _min;
        bottom = _max;
        _max = Math.max(left, right);
        _min = Math.min(left, right);
        left = _min;
        right = _max;

        return {
          top: top,
          left: left,
          bottom: bottom,
          right: right
        };
      },

      setRange: function (zone) {
        var top = zone.top,
          left = zone.left,
          bottom = zone.bottom,
          right = zone.right;

        var tlEl = this.picker.find('li[row="' + top + '"][col="' + left + '"]'),
          brEl = this.picker.find('li[row="' + bottom + '"][col="' + right + '"]');
        var offsetStart = tlEl.offset(),
          offsetEnd = brEl.offset(),
          width = offsetEnd.left - offsetStart.left + 12,
          height = offsetEnd.top - offsetStart.top + 20
        this.rangeEl.top.css({
          top: offsetStart.top + 20,
          left: offsetStart.left + 12
        }).width(width);
      }
    };

    instance.createElement();
    return instance;
  };

})(jQuery);