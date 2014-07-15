/**
 * Created by wangyanjun on 2014-07-13.
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

  var getPath = (function () {
    var src = $('script[src*="datepicker.js"]').attr('src');
    var index = src.indexOf('datepicker.js');
    var path = src.substring(0, index);
    return path;
  })();

  var componentName = 'datePicker';
  var today = moment();
  var defaults = {
    date: today,
    style: {
      selected: 'selected',
      active: 'active',
      weekend: 'weekend'
    }
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

      if (!componentTmpl) {//加载模板，只加载一次
        $.ajax({
          url: settings.tmplUrl || (getPath + 'templates/datepicker-tmpl.html'),
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

      /**
       * 点击前一个月后一个月重新渲染
       * @param step
       */
      var reRender = function (step) {
        var html = renderDays(step);
        picker.find('[data-days]').empty().html(html);
        picker.find('[data-current-date]').html(activeDate.format('YYYY年M月'));
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
          //加载数据
          if (settings.events && $.isFunction(settings.events)) {
            settings.events(activeDate.format('YYYY-MM'), loadData);
          }
        });

        //当前天
        picker.on('click', '[data-day]', function (e) {
          var el = $(e.currentTarget);
          if(el.hasClass('prev') || el.hasClass('next')){
            return;
          }
          var currentDay = el.attr('data-day');
          activeDate = moment(currentDay);
          //回调函数
          if (settings.onClickDay && $.isFunction(settings.onClickDay)) {
            settings.onClickDay(currentDay);
          }
          el.addClass(settings.style.active).siblings().removeClass(settings.style.active);
        });
      };

      /**
       * 根据events返回的数据设置日程信息
       * @param data
       */
      var loadData = function (data) {
        if (!data) {
          return;
        }
        var dataMonth = picker.find('[data-days]');
        var schedules = data.schedules;
        var activeDate = data.activeDate;
        var i, len;

        for (i = 0, len = schedules.length; i < len; i++) {
          dataMonth.find('[data-day="' + schedules[i] + '"]').addClass(settings.style.selected);
        }
        picker.find('span[data-day="' + activeDate + '"]').addClass(settings.style.active).siblings().removeClass(settings.style.active);

      };


      //渲染模板数据
      var json = {};
      json.currentDate = activeDate.format('YYYY年M月');
      json.daysHtml = renderDays();
      picker.html(applyTemplate(componentTmpl, json));

      initEvent();

      //加载数据
      if (settings.events && $.isFunction(settings.events)) {
        settings.events(activeDate.format('YYYY-MM'), loadData);
      }
      //加载当前天数据
      if (settings.onClickDay && $.isFunction(settings.onClickDay)) {
        settings.onClickDay(activeDate.format('YYYY-MM-DD'));
      }

      api = {
        settings: settings
      };
      picker.data(componentName, api);

    });
  };
})(jQuery);

