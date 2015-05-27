// /////////////////////////////////////////
// BACKBONE.JS IMPLEMENTATION
// /////////////////////////////////////////
var Message = Backbone.Model.extend({
  url: 'https://api.parse.com/1/classes/chatterbox',
  defaults: {
    username: ''
  }
});

var Messages = Backbone.Collection.extend({
  model: Message,
  url: 'https://api.parse.com/1/classes/chatterbox',

  loadMessages: function () {
    this.fetch({data: {order: '-createdAt'}});
  },

  parse: function (response, options) {
    var output = [];

    for (var i = response.results.length-1; i>=0; i--) {
      output.push(response.results[i]);
    }

    return output;
  }
});

var MessageView = Backbone.View.extend({
  model: Message,

  template: _.template(['<li class="well">',
        '<div class="username"><%-username%></div>',
        '<div class="msgText"><%-text%></div>',
        '<div><%-roomname%></div>',
      '</li>',].join('')),

  render: function () {
    this.$el.html(this.template(this.model.attributes));
    return this.$el;
  }
});

var MessagesView = Backbone.View.extend({
  initialize: function () {
    this.collection.on('sync', this.render, this);
    this.onScreenMessages = {};
  },

  render: function () {
    this.collection.forEach(this.renderMessage, this);
  },

  renderMessage: function(item){
    // if it's not currently on screen
    if (!this.onScreenMessages[item.get('objectId')]){
      this.onScreenMessages[item.get('objectId')] = true;
      var newMessageView = new MessageView({model:item});
      this.$el.prepend(newMessageView.render());
    }
  }
});

var SubmitView = Backbone.View.extend({

  events: {
    'click .submit': 'doSubmit'
  },

  doSubmit: function(e){
    e.preventDefault();

    var $text = this.$('#message');
    var $roomname = this.$('#roomname');
    this.collection.create({
      username: window.location.search.substr(10),
      text: $text.val(),
      roomname: $roomname.val()
    });
    $text.val('');
    $roomname.val('');
  },

});


// /////////////////////////////////////////
// ORIGINAL JQUERY IMPLEMENTATION
// /////////////////////////////////////////


// /////////////////////////////////////////
// chatterbox Application Class
// /////////////////////////////////////////
var App = function(){
  this.data = {};
  this.rooms = {};
  this.friends = {};
  this.refreshID = null;
  this.url = 'https://api.parse.com/1/classes/chatterbox';
}

// take a message and send that message to the server
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

// perform a callback function
App.prototype.fetch = function(url, callback){
  var context = this;
  $.ajax({
    type: 'GET',
    url: url,
    contentType: 'application/json',
    success: function (data) {
      console.log('chatterbox: Message get');
      callback(data.results); //callback takes an array of al message objects
    },
    error: function (data) {
      // see: https://developer.mozilla.org/en-US/docs/Web/API/console.error
      console.error('chatterbox: Failed to get message');
    }
  });
};

App.prototype.clearMessages = function(){
  $("#chats li").html('');
};

App.prototype.addMessage = function(msgObject, addTo){
  addTo = addTo || 'appendTo';
  var $username = $('<div></div>').text(msgObject.username);
  $username.addClass('username');
  var $text = $('<div></div>').text(msgObject.text);
  $text.addClass('msgText');
  var $roomname = $('<div></div>').text(msgObject.roomname);

  var $message = $('<li></li>');
  $message.addClass('well');
  $message.append($username, $text, $roomname);

  $message[addTo]('#chats');
};

App.prototype.refreshMessages = function() {
  var context = this;

  //callback function takes in an array of message
  //objects
  var accessEach = function (objArray) {
    _.each(objArray, function(item){
      if(!(item.objectId in context.data)){
        context.data[item.objectId] = item;
        context.addMessage(item, "prependTo");
      }
    });
  };

  this.fetch('https://api.parse.com/1/classes/chatterbox', accessEach);

  context.refreshRooms();
  context.highlightFriends();
};


App.prototype.highlightFriends = function () {
  var context = this;
  _.each($('li'), function (item) {
    if ($(item).children('.username').text() in context.friends){
      $(item).children('.msgText').addClass('bolded');
    }
  });
}

App.prototype.refreshRooms = function () {
  var context = this;

  var getRooms = function (objArray) {
    _.each(objArray, function (item) {
      if (!(item.roomname in context.rooms) && item.roomname) {
        context.addRoom(item.roomname);
        context.rooms[item.roomname] = item.roomname;
      }
    });
  }

  this.fetch('https://api.parse.com/1/classes/chatterbox', getRooms);
}

App.prototype.addRoom = function(roomname){
  $('<option></option>').val(roomname).text(roomname).appendTo('#roomSelect');
};

App.prototype.init = function(){
  // obtain the username
  var index = window.location.href.indexOf("username=");
  this.username = window.location.href.split("").slice(index+9).join("");

  // get the rooms dropdown menu ready
  app.refreshRooms();

  var context = this;
  // for each message object, iterate over its properties and
  this.fetch(this.url, function(array){
    _.each(array, function(item){
      // save its unique objectId, paired with the object itself
      context.data[item.objectId] = item;
      context.addMessage(item, "appendTo");
    });
  });
};

// var app = new App();
// app.init();

/////////////////////////////////////////////////
/// jQuery DOM interactions
/////////////////////////////////////////////////
// $(document).on('ready', function () {

//   // begin auto feed-refresh
//   $('.menu').on('click', 'button.refresh', function(e) {
//     app.refreshID = setInterval(app.refreshMessages.bind(app), 1000);
//     $(this).text('Stop Refreshing');
//     $(this).toggleClass('stopRefresh');
//     $(this).toggleClass('refresh');
//   });

//   // stop auto feed-refresh
//   $('.menu').on('click', 'button.stopRefresh', function(e) {
//     if (app.refreshID) {
//       clearInterval(app.refreshID);
//     }
//     $(this).text('Refresh');
//     $(this).toggleClass('stopRefresh');
//     $(this).toggleClass('refresh');
//   });

//   // submit a new message/room
//   $('.submit').on('click', function(e){
    // var room = $('#roomname').val();

    // if (room === '') {
    //   room = $('#roomSelect').val();
    // }

    // var msg = {
    //   username: app.username,
    //   roomname: room,
    //   text: $('#message').val()
    // };
    // app.send(msg);
//     $('#message').val('');
//   });

//   // add a friend
//   $('#main').on('click', '.username', function (e) {
//     var name = $(this).text();
//     if (!(name in app.friends)) {
//       $('.friends-list').append($('<li></li>').text(name));
//       app.friends[name] = name;
//     }
//     app.highlightFriends();
//   });

// });
