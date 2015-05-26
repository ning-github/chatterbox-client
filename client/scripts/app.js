// YOUR CODE HERE:
// /////////////////////////////////////////
// chatterbox Application Class
// /////////////////////////////////////////
var App = function(){
  this.data = {};
  this.rooms = {};
  this.refreshID = null;
}

App.prototype.init = function(){
  var index = window.location.href.indexOf("username=");
  this.username = window.location.href.split("").slice(index+9).join("");
};

App.prototype.send = function(message){
  $.ajax({
    url: 'https://api.parse.com/1/classes/chatterbox',
    type: 'POST',
    data: JSON.stringify(message),
    contentType: 'application/json',
    success: function (data) {
      console.log('chatterbox: Message sent');
    },
    error: function (data) {
      // see: https://developer.mozilla.org/en-US/docs/Web/API/console.error
      console.error('chatterbox: Failed to send message');
    }
  });
};

App.prototype.fetch = function(url, callback){
  var context = this;
  $.ajax({
    type: 'GET',
    url: url,
    contentType: 'application/json',
    success: function (data) {
      console.log('chatterbox: Message get');
      _.extend(context.data, data);
      _.each(data.results, callback);
    },
    error: function (data) {
      // see: https://developer.mozilla.org/en-US/docs/Web/API/console.error
      console.error('chatterbox: Failed to get message');
    }
  });
};

App.prototype.clearMessages = function(){
  $("#chats").html('');
};

App.prototype.addMessage = function(msgObject){
  var $username = $('<div></div>').text(msgObject.username);
  var $text = $('<div></div>').text(msgObject.text);
  var $roomname = $('<div></div>').text(msgObject.roomname);

  var $message = $('<li></li>');
  $message.addClass('well');
  $message.append($username, $text, $roomname);

  $message.appendTo('#chats');
};

App.prototype.refreshMessages = function() {
  var context = this;

  var accessEach = function (obj) {
    context.addMessage(obj);
  };

  this.fetch('https://api.parse.com/1/classes/chatterbox', accessEach);
};

App.prototype.refreshRooms = function () {
  var context = this;

  var getRooms = function (obj) {
    context.rooms[obj.roomname] = obj.roomname;
  }

  this.fetch('https://api.parse.com/1/classes/chatterbox', getRooms);

  for (var key in context.rooms) {
    if (key) {
      $('<option></option>').val(key).text(key).appendTo('#roomSelect');
    }
  }
}

App.prototype.addRoom = function(){};


var app = new App();
app.init();

/////////////////////////////////////////////////
/// jQuery DOM interactions
/////////////////////////////////////////////////
$(document).on('ready', function () {

  $('.menu').on('click', 'button.refresh', function(e) {
    app.refreshID = setInterval(app.refreshMessages.bind(app), 1000);
    $(this).text('Stop Refreshing');
    $(this).toggleClass('stopRefresh');
    $(this).toggleClass('refresh');
  });

  $('.menu').on('click', 'button.stopRefresh', function(e) {
    if (app.refreshID) {
      clearInterval(app.refreshID);
    }

    $(this).text('Refresh');
    $(this).toggleClass('stopRefresh');
    $(this).toggleClass('refresh');
  });

  $('.submit').on('click', function(e){
    var msg = {
      username: app.username,
      roomname: "Ning and JP's Special Place",
      text: $('#message').val()
    };

    app.send(msg);
    $('#message').val('');
  });

});
