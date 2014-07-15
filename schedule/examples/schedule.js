$(function () {
  'use strict';

  /**
   * examples 需要在服务器端运行
   * 例子中的json数据只模拟了部分数据
   * 需要结合后台动态返回真实的数据来测试
   * 例子中假设当前系统时间是 2014-07-14
   * json数据格式如下：

   {
    "schedule": ["2014-07-12", "2014-07-13", "2014-07-14", "2014-07-18", "2014-07-19"],
    "currentDate": "2014-07-14",//指系统当前日期
    "activeDate": "2014-07-14",//指当前查看的日期
    "scheduleItems": [
      {
        "start": "18:00",
        "end": "18:30",
        "status": "appointed"//预约取消，拒绝等
      },
      {
        "start": "19:00",
        "end": "19:30",
        "status": ""
      }
    ]
  }
   以上数据格式说明
   schedule: 指当月已经预约的日期
   currentDate: 指系统当前时间
   activeDate: 指当前正在查看或操作的日期
   scheduleItems: 指当日已设置的日程时段，status需要你们来定
   */
  $('#schedule').schedulePicker({
    date: '2014-07-14',
    //plugins: 'regionCell',
    events: function (month, activeDate, callback) {
      $.ajax({
        url: './json/schedule/' + activeDate + '.json',
        data: {
          month: month,
          activeDate: activeDate
        },
        dataType: 'json',
        success: function (data) {
          callback(data);
        }
      });
    },
    onClickSave: function (month, activeDate, selectedItemData, callback) {
      console.info(month);
      console.info(activeDate);
      console.info(selectedItemData);
      if (selectedItemData.length == 0) {
        alert('您今日的可预约时段无设置');
        return;
      }
      //与后台交互，保存当前数据
      $.ajax({
        url: '',
        data: {
          month: month,
          activeDate: activeDate,
          selectedItemData: selectedItemData
        },
        dataType: 'json',
        success: function (data) {
          callback();
          alert('今日设置已保存成功');
        }
      });
    },

    onClickClear: function (month, activeDate, selectedItemData, callback) {
      //与后台交互，清空当前数据
      $.ajax({
        url: '',
        data: {
          month: month,
          activeDate: activeDate,
          selectedItemData: selectedItemData
        },
        dataType: 'json',
        success: function (data) {
          callback();
          alert('今日设置已清空');
        }
      });
    }
  });
});