app.controller("LoginController", function($scope, $http, loginService) {

  var root = this;

  // que hostname
  this.quehostname = localStorage.host || "";

  // username and password
  this.username = sessionStorage.user || "";
  this.password = sessionStorage.pass || "";

  this.badlogin = false;

  this.login = function() {

    // a protocol must be used
    if (this.quehostname.indexOf("http") === -1) {
      this.quehostname = "http://" + this.quehostname;
    };

    // set host, username, and pass
    localStorage.host = host = this.quehostname;
    sessionStorage.user = this.username;
    sessionStorage.pass = this.password;

    // try to login
    loginService.login(root.username, root.password, function(status) {
      if (!status) root.badlogin = true;
    });
  };

});

app.factory("loginService", function($http, $location) {
  return {
    auth: {username: null},
    newInstance: false,

    login: function(user, pass, callback) {
      var root = this;
      $http({
        method: "POST",
        url: host+"/auth",
        data: {name: user, pass: pass}
      }).success(function(data) {
        // was is successful?
        if (data.key) {
          // save it all into the auth area
          root.auth = data;

          // set header
          $http.defaults.headers.common.Authentication = root.auth.key || "";

          // set sessionstorage
          if (sessionStorage) sessionStorage.queKey = root.auth.key;

          // go to the dash
          $location.url("/dash");
          callback && callback(true);
        } else {
          // wrong credentials
          callback && callback(false);
        }
      });
    },

    loginWithKey: function(key, callback) {
      var root = this;
      $http({
        method: "GET",
        url: host+"/auth/whoami",
        headers: {Authentication: key}
      }).success(function(data) {
        if (data.key !== null) {
          // save it all into the auth area
          root.auth = data;

          // set header
          $http.defaults.headers.common.Authentication = key || "";

          // set sessionstorage
          if (sessionStorage) sessionStorage.queKey = key;

          // callback
          callback && callback(data);
        };
      });
    },

    logout: function() {
      var root = this;
      $http({
        method: "DELETE",
        url: host+"/auth",
        headers: {Authentication: this.auth.key || ""}
      }).success(function(data) {
        // logout
        root.auth = {username: null};

        // forget about that auth header
        $http.defaults.headers.common.Authentication = '';

        // set sessionstorage
        if (sessionStorage) sessionStorage.queKey = undefined;

        // go back to the login screen
        $location.url("/login");
      });
    },

    // if user has permission to do something
    // if permission is thing.edit: thing.edit, thing.*, * all work
    can: function(permission) {
      if (typeof this.auth.permissions === "object") {
        resp = [];
        _.each(this.auth.permissions, function(p) {
          resp.push( matchWildcard(p, permission).length );
        });
        // console.log(permission, resp); // debug
        return _.filter(resp, function(x) { return x !== undefined; }).length;
      } else {
        return false;
      }
    },

    // is this a new que instance?
    isNewInstance: function(callback) {
      var root = this;
      $http({
        method: "GET",
        url: host+"/users/any"
      }).success(function(data) {
        root.newInstance = data.newInstance;
        callback && callback(data.newInstance);
      });
    }

  }
});
