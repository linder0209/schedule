$(function () {
  'use strict';

  /**
   * 例子：需要在服务器端运行
   * date 设置当前系统时间，取服务器端时间
   * onClickDay：点击某一天，回调函数，需要开发实现
   */
  $('#datepicker').datePicker({
    date: '2014-07-14',
    events: function (month, callback) {
      $.ajax({
        url: './json/datepicker/' + month + '.json',
        data: {
          month: month
        },
        dataType: 'json',
        success: function (data) {
          callback(data);
        }
      });
    },
    onClickDay: function (currentDay) {
      //点击某一天加载数据
      $.ajax({
        url: '',
        data: {
          currentDay: currentDay
        },
        dataType: 'json',
        success: function (data) {
        }
      });
    }
  });
});