/**
 * EFF Alerts is a mobile app for receiving news and notifications from EFF.
 * Copyright (C) 2014-2016 Electronic Frontier Foundation (EFF).
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Primary application target, defines top level module and imports required files.
 */

var angular = require('angular');

var appSettings = require('../build/app_settings');

var Raven = require('./raven-client');
window.Raven = Raven;

require('ionic-native');

var acmRequires = ['ionic', 'ionic.native', 'xml'];

if (Raven) {
  acmRequires.unshift('ngRaven');
}

var actionCenterMobile = angular.module('acm', acmRequires);

actionCenterMobile.config(function ($ionicConfigProvider) {
  $ionicConfigProvider
    .tabs.position('bottom')
    .style('striped');
});

actionCenterMobile.controller('ActionCenterCtrl', require('./controllers/actionCenter'));
actionCenterMobile.controller('WelcomeCarouselCtrl', require('./controllers/welcome_carousel'));
actionCenterMobile.controller('HomeCtrl', require('./controllers/home'));
actionCenterMobile.controller('ActionCtrl', require('./controllers/action'));
actionCenterMobile.controller('NewsCtrl', require('./controllers/news'));
actionCenterMobile.controller('MoreCtrl', require('./controllers/more'));
actionCenterMobile.controller('DonateCtrl', require('./controllers/donate'));
actionCenterMobile.controller('SettingsCtrl', require('./controllers/settings'));

actionCenterMobile.factory('acmUserDefaults', require('./services/user_defaults'));
actionCenterMobile.factory('acmDeviceLanguage', require('./services/language'));
actionCenterMobile.factory('acmSharing', require('./services/sharing'));

actionCenterMobile.factory('acmPushNotification', require('./services/push'));
actionCenterMobile.factory('acmGCMPushNotification', require('./services/push/gcm'));
actionCenterMobile.factory('acmAPNSPushNotification', require('./services/push/apns'));
actionCenterMobile.factory('acmPushNotificationHelpers', require('./services/push/helpers'));

actionCenterMobile.config(function ($stateProvider) {

  var appStates = [

    {
      name: 'acm',
      url: '/acm',
      templateUrl: 'ng_partials/base.html',
      abstract: true,
      controller: 'ActionCenterCtrl'
    },

    {
      name: 'welcome',
      url: '/welcome',
      templateUrl: 'ng_partials/welcome/welcome_carousel.html',
      controller: 'WelcomeCarouselCtrl'
    },

    {
      name: 'acm.homeTabs',
      abstract: true,
      url: '/homeTabs',
      templateUrl: 'ng_partials/homeTabs.html'
    },

    {
      name: 'acm.homeTabs.home',
      url: '/home',
      views: {
        'home-tab' :{
          templateUrl: 'ng_partials/home.html',
          controller: 'HomeCtrl'
        }
      }
    },

    {
      name: 'acm.homeTabs.action',
      url: '/action',
      views: {
        'action-tab' :{
          templateUrl: 'ng_partials/action.html',
          controller: 'ActionCtrl',
        }
      }
    },

    {
      name: 'acm.homeTabs.news',
      url: '/news',
      views: {
          'news-tab' :{
            templateUrl: 'ng_partials/news.html',
            controller: 'NewsCtrl',
          }
        }
    },

    {
      name: 'acm.homeTabs.more',
      url: '/more',
      views: {
        'more-tab' :{
          templateUrl: 'ng_partials/more.html',
          controller: 'MoreCtrl'
        }
      }
    },
    {
      name: 'acm.homeTabs.donate',
      url: '/donate',
      views: {
        'donate-tab' :{
          templateUrl: 'ng_partials/donate.html',
          controller: 'DonateCtrl'
        }
      }
    },
    {
      name: 'acm.homeTabs.settings',
      url: '/settings',
      views: {
        'settings-tab' :{
          templateUrl: 'ng_partials/settings.html',
          controller: 'SettingsCtrl'
        }
      }
    }

  ];

  for (var i = 0, len = appStates.length; i < len; i++) {
    $stateProvider.state(appStates[i]);
  }

  // NOTE: no otherwise is specified for routing, because:
  //  * the user shouldn't be able to get to any non-standard routes
  //  * it causes a load of the page by default prior to the routing logic in run() kicking in
});

actionCenterMobile.run(function (
  $rootScope, $state, $ionicHistory, $ionicPlatform, acmPushNotification, acmUserDefaults) {

  var registerForPush = function () {
    var platform = ionic.Platform.platform().toUpperCase();

    if (window.plugins !== undefined &&
        appSettings['APP']['PUSH_CAPABLE_PLATFORMS'].indexOf(platform) !== -1) {
      acmPushNotification.register();

      if (acmUserDefaults.getUserDefault(acmUserDefaults.keys.PUSH_ENABLED) !== false) {
        acmPushNotification.subscribe(function() {}, function(err) {
          console.log("Couldn't subscribe to FCM topic: " + JSON.stringify(err));
        });
      }
    }
  };

  $ionicPlatform.ready(function () {

    // Listen to the resume event - this is fired when the app re-enters the foreground
    // There's an edge case where a user gets a notification, but doesn't click it, where they're
    // not directed to the action page on app re-open.
    document.addEventListener('resume', function () {

      if (acmUserDefaults.hasUnreadAction() && $state.current.name !== 'acm.homeTabs.home') {
        $state.go('acm.homeTabs.home', {}, {location: 'replace'});
        acmUserDefaults.hasReadAction();
        var deregister = $rootScope.$on('$stateChangeSuccess', function () {
          $ionicHistory.clearHistory();
          deregister();
        });
      }

      if (!acmUserDefaults.getUserDefault(acmUserDefaults.keys.REGISTERED_FOR_PUSH)) {
        registerForPush();
      }

      console.log(acmUserDefaults.getActionInfo());

    }, false);

    // Hide the accessory bar by default
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }

    // Requires org.apache.cordova.statusbar
    if (window.StatusBar) {
      StatusBar.styleDefault();
    }

    registerForPush();

    // NOTE: this is delayed until post-ready as some plugins are not available otherwise (e.g.
    //       appAvailability) and cause problems if accessed.
    var completedWelcome = acmUserDefaults.getUserDefault(
      acmUserDefaults.keys.USER_HAS_COMPLETED_WELCOME);

    if (completedWelcome) {
      $state.go(acmUserDefaults.hasUnreadAction() ? 'acm.homeTabs.home' : 'acm.homeTabs.action');
      acmUserDefaults.hasReadAction();
    }
    else {
      $state.go('welcome');
    }
  });
});

// Require in the cached templates - see gulp/tasks/ng_templates.js for details
require('../build/acmTemplates');
