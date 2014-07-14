/**
 * Created by linder on 2014/7/7.
 */

(function ($, undefined) {
  'use strict';

  var re = /\{\{:([\w-]+)\}\}/g;
  // 该方法支持键值即json格式的数据
  function applyTemplate(template, values) {
    return template.replace(re, function (m, name) {
      return values[name] !== undefined ? values[name] : '';
    });
  }

  function getSelectedData(data) {
    var selectedData = [];
    var _data = $.extend([], data);
    $.each(_data, function (index, item) {
      if (item.selected) {
        selectedData.push(item);
      }
    });
    return selectedData;
  }

  var getPath = (function () {
    var src = $('script[src*="schedule.js"]').attr('src');
    var index = src.indexOf('schedule.js');
    var path = src.substring(0, index);
    return path;
  })();

  var componentName = 'schedulePicker';
  var today = moment();
  var defaults = {
    date: today,
    style: {
      selected: 'selected',
      active: 'active',
      weekend: 'weekend',
      itemActive: 'act',
      itemAppointed: 'act2'
    },
    plugins: undefined,//插件必须是字符串或字符串组成的数组，需要实现方法 loadPlugin
    onClickSave: undefined,
    onClickClear: undefined
  };

  var componentTmpl;
  var generatedIds = 0;

  $.fn[componentName] = function (options) {

    var component = $(this).data(componentName);

    if (component) {
      return component;
    }

    return this.each(function () {
      var api;
      var settings = $.extend(true, {}, defaults, options);
      var picker = $(this);
      var activeDate = settings.date;
      if (typeof activeDate === 'string') {
        activeDate = moment(activeDate);
      }
      var calendarItemData = [];//当天日程数据
      var editStatus = true; //编辑状态
      var calendarItemChanged = false;//当前数据是否已变化
      var relatedElements = {};//相关元素

      if (!componentTmpl) {//加载模板，只加载一次
        $.ajax({
          url: settings.tmplUrl || (getPath + 'templates/schedule-tmpl.html'),
          async: false,
          dataType: 'text',
          success: function (content) {
            componentTmpl = content;
          }
        });
      }

      //渲染当月日期
      var renderDays = function (step) {
        if (step) {
          activeDate.add('M', step);
        }
        var a = activeDate.clone();
        a.startOf('month').startOf('isoWeek');
        var b = a.clone().add('d', 42);
        var html = '';
        var isNext = false;

        while (a < b) {
          var classes = [];
          if (a.weekday() === 6 || a.weekday() === 0) {//周末
            classes.push(settings.style.weekend);
          }
          if (a.month() !== activeDate.month()) {
            classes.push(isNext ? 'next' : 'prev');
          } else {
            isNext = true;
          }
          html += '<span data-day="' + a.format('YYYY-MM-DD') + '" class="' + classes.join(' ') + '">' + a.date() + '</span>';
          a.add('d', 1);
        }
        return html;
      };

      //渲染当天时段
      var renderCalendarItems = function () {
        var tmpl = '<li><div data-calendar-item="{{:itemIndex}}" row="{{:row}}" col="{{:col}}" class="calendar-item-inner">{{:timePeriod}}</div></li>',
          val,
          nextVal,
          html = '',
          start ,
          end,
          row = 0,
          col = 0;
        for (var i = 0; i < 48; i++) {
          val = i / 2;
          nextVal = val + 1;
          val = val < 10 ? ('0' + val) : val;
          nextVal = nextVal < 10 ? ('0' + nextVal) : nextVal;

          if (i % 2 === 0) {
            start = val + ':00';
            end = val + ':30';
            val += ':00';
          } else {
            start = val + ':30';
            end = nextVal + ':00';
            val = '';
          }
          row = parseInt(i / 12);
          col = i % 12;

          html += applyTemplate(tmpl, {timePeriod: val, itemIndex: i, row: row, col: col});
          calendarItemData.push({
            index: i,
            start: start,
            end: end,
            status: '',
            selected: false
          });
        }
        return html;
      };

      /**
       * 点击前一个月后一个月重新渲染
       * @param step
       */
      var reRender = function (step) {
        var fn = function () {
          var html = renderDays(step);
          picker.find('[data-days]').empty().html(html);
          picker.find('[data-current-date]').html(activeDate.format('YYYY年M月'));
          picker.find('[data-current-ymd]').html(activeDate.format('YYYY年M月D日'));
        };

        if (calendarItemChanged === true) {
          if (!relatedElements.scheduleConfirm) {
            //创建确认提示对话框
            relatedElements.scheduleConfirm = $('#scheduleConfirmDialog');
            relatedElements.scheduleConfirm.on('click', '[data-dialog-action]', function (e) {
              e.preventDefault();
              var action = $(e.currentTarget).attr('data-dialog-action');
              switch (action) {
                case 'close':
                  break;
                case 'yes':
                  if (settings.onClickSave && $.isFunction(settings.onClickSave)) {
                    settings.onClickSave(activeDate.format('YYYY-MM'), activeDate.format('YYYY-MM-DD'), getSelectedData(calendarItemData), function () {
                      calendarItemChanged = false;
                    });
                  }
                  fn();
                  calendarItemChanged = false;
                  break;
                case 'no':
                  fn();
                  calendarItemChanged = false;
                  break;
              }
              relatedElements.scheduleConfirm.hide();
            });
          }
          relatedElements.scheduleConfirm.show();
          return;
        } else {
          fn();
        }

      };

      //创建相关元素
      var createElement = function () {
        var el = $('<div id="tooltip' + generatedIds++ + '" class="tooltip" style="display:none;"/>').appendTo(document.body);
        el.html('该时段已被预约，不可取消设置');
        relatedElements.appointedTooltip = el;
        $(document.body).on('click', function () {
          el.hide();
        });
      };

      //初始化相关事件
      var initEvent = function () {
        //前或后一个月
        picker.on('click', '[data-prev-next]', function (e) {
          var el = $(e.currentTarget);
          if (el.attr('data-prev-next') === 'prev') {
            reRender(-1);
          } else {
            reRender(1);
          }
          clearData();
          //加载数据
          if (settings.events && $.isFunction(settings.events)) {
            settings.events(activeDate.format('YYYY-MM'), activeDate.format('YYYY-MM-DD'), loadData);
          }
        });

        //当前天
        picker.on('click', '[data-day]', function (e) {
          var el = $(e.currentTarget);
          var currentDay = el.attr('data-day');
          activeDate = moment(currentDay);
          clearData();
          //加载数据
          if (settings.events && $.isFunction(settings.events)) {
            settings.events(activeDate.format('YYYY-MM'), currentDay, loadData);
          }
        });

        // 当日时段日程
        picker.on('click', '[data-calendar-item]', function (e) {
          var el = $(e.currentTarget);
          var index = el.attr('data-calendar-item');
          if (calendarItemData[index].status === 'appointed') {
            e.stopPropagation();
            var offset = el.offset(),
              width = el.width(),
              height = el.height();
            relatedElements.appointedTooltip.css({
              top: offset.top + height / 2 - 15,
              left: offset.left + width - 5
            }).show();
            return;
          }
          var selected = calendarItemData[index].selected;
          el[selected ? 'removeClass' : 'addClass'](settings.style.itemActive);
          calendarItemData[index].selected = !selected;
          calendarItemChanged = true;
        });

        //选择当日全部时段
        picker.on('change', '[data-select-all]', function (e) {
          var el = $(e.currentTarget);
          var checked = el.prop('checked');
          var item;
          for (var i = 0, len = calendarItemData.length; i < len; i++) {
            item = calendarItemData[i];
            if (item.status !== 'appointed') {
              picker.find('[data-calendar-item]')[checked ? 'addClass' : 'removeClass'](settings.style.itemActive);
              item.selected = checked;
            }
          }
          calendarItemChanged = true;
        });

        // save
        picker.on('click', '[data-save-data]', function (e) {
          e.preventDefault();
          var el = $(e.currentTarget);
          if (el.hasClass('disable')) {
            return;
          }
          if (settings.onClickSave && $.isFunction(settings.onClickSave)) {
            settings.onClickSave(activeDate.format('YYYY-MM'), activeDate.format('YYYY-MM-DD'), getSelectedData(calendarItemData), function () {
              calendarItemChanged = false;
            });
          }
        });

        //clear
        picker.on('click', '[data-clear-data]', function (e) {
          e.preventDefault();
          var el = $(e.currentTarget);
          if (el.hasClass('disable')) {
            return;
          }
          for (var i = 0, len = calendarItemData.length; i < len; i++) {
            if (calendarItemData[i].status !== 'appointed') {
              calendarItemData[i].selected = false;
            }
          }
          picker.find('[data-calendar-item]').removeClass(settings.style.itemActive);
          picker.find('[data-select-all]').prop('checked', false);
        });

        if (settings.onClickClear && $.isFunction(settings.onClickClear)) {
          settings.onClickClear(activeDate.format('YYYY-MM'), activeDate.format('YYYY-MM-DD'), getSelectedData(calendarItemData), function () {
            calendarItemChanged = false;
          });
        }
      };

      /**
       * 根据events返回的数据设置日程信息
       * @param data
       */
      var loadData = function (data) {
        var dataMonth = picker.find('[data-days]');
        if (!data) {
          return;
        }
        var schedule = data.schedule;
        var currentDate = data.currentDate;
        var activeDate = data.activeDate;
        var scheduleItems = data.scheduleItems;
        var i, len;

        for (i = 0, len = schedule.length; i < len; i++) {
          dataMonth.find('[data-day="' + schedule[i] + '"]').addClass(settings.style.selected);
        }
        picker.find('span[data-day="' + activeDate + '"]').addClass(settings.style.active)
          .siblings().removeClass(settings.style.active);

        if (moment(activeDate) < moment(currentDate)) {
          editStatus = false;
        } else {
          editStatus = true;
        }
        picker.find('[data-save-data],[data-clear-data]')[editStatus ? 'removeClass' : 'addClass']('disable');
        if (editStatus) {
          picker.find('[data-select-all]').removeAttr('disabled');
        } else {
          picker.find('[data-select-all]').attr('disabled', 'disabled');
        }

        for (i = 0, len = scheduleItems.length; i < len; i++) {
          var status = scheduleItems[i].status;
          var index = scheduleItems[i].index;
          picker.find('[data-calendar-item="' + scheduleItems[i].index + '"]').addClass(status === 'appointed' ? settings.style.itemAppointed : settings.style.itemActive);
          calendarItemData[index].selected = true;
          calendarItemData[index].status = status;
        }
      };

      //清空数据
      var clearData = function () {
        for (var i = 0, len = calendarItemData.length; i < len; i++) {
          calendarItemData[i].selected = false;
          calendarItemData[i].status = '';
        }
        picker.find('[data-calendar-item]').each(function (index, item) {
          $(item).removeClass(settings.style.itemActive + ' ' + settings.style.itemAppointed);
        });
        picker.find('[data-save-data],[data-clear-data]').removeClass('disable');
        picker.find('[data-select-all]').removeAttr('disabled');
      };


      //渲染模板数据
      var json = {};
      json.currentDate = activeDate.format('YYYY年M月');
      json.daysHtml = renderDays();
      json.calendarItems = renderCalendarItems();
      json.currentYMD = activeDate.format('YYYY年M月D日');
      picker.html(applyTemplate(componentTmpl, json));

      createElement();
      initEvent();

      //加载数据
      if (settings.events && $.isFunction(settings.events)) {
        settings.events(activeDate.format('YYYY-MM'), activeDate.format('YYYY-MM-DD'), loadData);
      }

      if (settings.plugins) {
        if (!$.isArray(settings.plugins)) {
          settings.plugins = [settings.plugins];
        }
        $.each(settings.plugins, function (index, item) {
          if ($.schedulePickerPlugins[item] && $.isFunction($.schedulePickerPlugins[item].loadPlugin)) {
            $.schedulePickerPlugins[item].loadPlugin(picker);
          }
        });
      }
      api = {
        calendarItemData: calendarItemData,
        settings: settings
      };
      picker.data(componentName, api);

    });
  };
})(jQuery);

