$(function () {
  'use strict';

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